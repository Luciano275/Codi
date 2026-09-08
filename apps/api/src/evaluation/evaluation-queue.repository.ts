import { Injectable } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { evaluationSettings } from './evaluation.constants';
import type { EvaluationLanguage, EvaluationStatus } from './evaluation.types';

export interface EvaluationJob {
  id: string;
  code: string;
  language: EvaluationLanguage;
  cmsTaskId: number;
  attempts: number;
}

@Injectable()
export class EvaluationQueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async claim(workerId: string): Promise<EvaluationJob | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; code: string; language: string; cmsTaskId: number; attempts: number }>
    >`
      WITH candidate AS (
        SELECT submission.id
        FROM "codi_submission" submission
        WHERE submission.status = 'EVALUATING'
          AND (
            submission."evaluationLeaseUntil" IS NULL
            OR submission."evaluationLeaseUntil" < NOW()
          )
          AND submission."evaluationAttempts" <= ${evaluationSettings.maxAttempts}
        ORDER BY submission."submittedAt"
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE "codi_submission" submission
      SET
        "evaluationAttempts" = submission."evaluationAttempts" + 1,
        "evaluationStartedAt" = COALESCE(submission."evaluationStartedAt", NOW()),
        "evaluationLeaseUntil" = NOW() + (${evaluationSettings.leaseMs} * INTERVAL '1 millisecond'),
        "evaluationWorkerId" = ${workerId}
      FROM candidate, "codi_problem" problem
      WHERE submission.id = candidate.id AND problem.id = submission."problemId"
      RETURNING
        submission.id,
        submission.code,
        submission.language,
        problem."cmsTaskId" AS "cmsTaskId",
        submission."evaluationAttempts" AS attempts
    `;
    const job = rows[0];
    if (!job) return null;
    return { ...job, language: this.normalizeLanguage(job.language) };
  }

  async extendLease(submissionId: string, workerId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "codi_submission"
      SET "evaluationLeaseUntil" = NOW() + (${evaluationSettings.leaseMs} * INTERVAL '1 millisecond')
      WHERE id = ${submissionId} AND "evaluationWorkerId" = ${workerId}
    `;
  }

  async releaseForRetry(
    submissionId: string,
    workerId: string,
    attempts: number,
    error: Error,
  ): Promise<void> {
    if (attempts >= evaluationSettings.maxAttempts) {
      await this.finishWithInfrastructureError(submissionId, workerId, error);
      return;
    }
    await this.prisma.$executeRaw`
      UPDATE "codi_submission"
      SET "evaluationLeaseUntil" = NULL, "evaluationWorkerId" = NULL
      WHERE id = ${submissionId} AND "evaluationWorkerId" = ${workerId}
    `;
  }

  private async finishWithInfrastructureError(
    submissionId: string,
    workerId: string,
    error: Error,
  ): Promise<void> {
    const results = JSON.stringify({ error: error.message, infrastructureFailure: true });
    await this.prisma.$executeRaw`
      UPDATE "codi_submission"
      SET
        status = ${'RUNTIME_ERROR' satisfies EvaluationStatus}::"SubmissionStatus",
        score = 0,
        "cmsResults" = ${results}::jsonb,
        "evaluatedAt" = NOW(),
        "evaluationLeaseUntil" = NULL,
        "evaluationWorkerId" = NULL
      WHERE id = ${submissionId} AND "evaluationWorkerId" = ${workerId}
    `;
  }

  private normalizeLanguage(language: string): EvaluationLanguage {
    if (language === 'python' || language.includes('Python')) return 'python';
    if (language === 'cpp' || language.includes('C++')) return 'cpp';
    throw new Error(`Unsupported evaluation language ${language}`);
  }
}
