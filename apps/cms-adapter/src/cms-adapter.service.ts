import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, SubmissionStatus } from '@codi/database';

interface CmsTaskRow {
  id: number;
  name: string;
  title: string;
}

interface CmsSubmissionResultRow {
  score: number | null;
  compilation_outcome: string | null;
  evaluations: Array<{
    codename: string;
    outcome: string | null;
    time: number | null;
    memory: number | null;
  }> | null;
}

@Injectable()
export class CmsAdapterService {
  private readonly logger = new Logger(CmsAdapterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncTasks() {
    const tasks = await this.prisma.$queryRawUnsafe<CmsTaskRow[]>(
      `SELECT id, name, title FROM cmsdb.public.tasks`,
    );

    let created = 0;
    let updated = 0;

    for (const task of tasks) {
      await this.prisma.problem.upsert({
        where: { cmsTaskId: task.id },
        create: {
          cmsTaskId: task.id,
          cmsTaskName: task.name,
          title: task.title,
        },
        update: {
          cmsTaskName: task.name,
          title: task.title,
        },
      });
      updated++;
    }

    this.logger.log(`Synced ${tasks.length} tasks (${created} new)`);
    return { synced: tasks.length, created, updated };
  }

  async pollSubmissionResult(cmsSubmissionId: number) {
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        score: number | null;
        compilation_outcome: string | null;
        evaluations: string | null;
      }>
    >(
      `SELECT
         sr.score,
         sr.compilation_outcome,
         CASE
           WHEN jsonb_agg(
             jsonb_build_object(
               'codename', tc.codename,
               'outcome', e.outcome,
               'time', e.execution_time,
               'memory', e.execution_memory
             )
             ORDER BY tc.codename
           )::text = '[null]' THEN NULL
           ELSE jsonb_agg(
             jsonb_build_object(
               'codename', tc.codename,
               'outcome', e.outcome,
               'time', e.execution_time,
               'memory', e.execution_memory
             )
             ORDER BY tc.codename
           )::text
         END AS evaluations
       FROM cmsdb.public.submission_results sr
       LEFT JOIN cmsdb.public.evaluations e
         ON e.submission_id = sr.submission_id
        AND e.dataset_id = sr.dataset_id
       LEFT JOIN cmsdb.public.testcases tc
         ON tc.id = e.testcase_id
       WHERE sr.submission_id = $1
       GROUP BY sr.submission_id, sr.score, sr.compilation_outcome`,
      cmsSubmissionId,
    );

    const row = rows[0];
    if (!row) return { done: false };

    const isDone =
      row.compilation_outcome !== null &&
      (row.compilation_outcome === 'fail' || row.score !== null);

    if (!isDone) return { done: false };

    const status = this.mapStatus(row.compilation_outcome, row.score);

    try {
      const evaluations = row.evaluations ? JSON.parse(row.evaluations) : null;

      await this.prisma.submission.update({
        where: { cmsSubmissionId },
        data: {
          status,
          score: row.score ?? 0,
          cmsResults: evaluations,
          evaluatedAt: new Date(),
        },
      });
    } catch (e) {
      if ((e as any)?.code === 'P2025') {
        this.logger.warn(
          `Submission ${cmsSubmissionId} not found in Codi DB`,
        );
      } else {
        throw e;
      }
    }

    return { done: true, status, score: row.score };
  }

  private mapStatus(
    compilationOutcome: string | null,
    score: number | null,
  ): SubmissionStatus {
    if (compilationOutcome === 'fail') return SubmissionStatus.COMPILATION_ERROR;
    if (score === null || score === undefined) return SubmissionStatus.EVALUATING;
    if (score >= 99.999) return SubmissionStatus.ACCEPTED;
    if (score >= 0.001) return SubmissionStatus.WRONG_ANSWER;
    return SubmissionStatus.WRONG_ANSWER;
  }
}
