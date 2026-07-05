import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { config } from '@codi/config';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async submit(userId: string, problemId: string, code: string, language: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const submission = await this.prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        status: 'PENDING',
      },
    });

    this.submitToCms(submission.id).catch((err) => {
      this.logger.error(`CMS submission failed: ${err.message}`);
    });

    return submission;
  }

  private async submitToCms(submissionId: string) {
    try {
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'EVALUATING' },
      });

      await this.prisma.submissionRequest.create({
        data: { submissionId, status: 'pending' },
      });

      this.logger.log(`SubmissionRequest created for submission ${submissionId}`);

      this.pollForResult(submissionId).catch((err) => {
        this.logger.error(`Polling failed for ${submissionId}: ${err.message}`);
      });
    } catch (err: any) {
      this.logger.error(`Submit to CMS failed: ${err.message}`);
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'COMPILATION_ERROR' },
      }).catch(() => {});
    }
  }

  private async pollForResult(submissionId: string) {
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1000));

      try {
        // Step 1: Get the request to find the CMS submission ID
        const req = await this.prisma.submissionRequest.findUnique({
          where: { submissionId },
        });
        if (!req || !req.cmsSubmissionId) {
          // Bridge hasn't processed yet
          continue;
        }

        // Step 2: Query CMS compilation + evaluation status from shared DB
        const rows = await this.prisma.$queryRawUnsafe<
          Array<{ compilation_outcome: string | null; score: number | null }>
        >(
          `SELECT sr.compilation_outcome, sr.score
           FROM public.submission_results sr
           WHERE sr.submission_id = $1`,
          [req.cmsSubmissionId],
        );

        if (rows.length === 0) continue;

        const cmsResult = rows[0];

        // Compilation still running
        if (!cmsResult.compilation_outcome) continue;

        // Compilation failed
        if (cmsResult.compilation_outcome === 'fail') {
          await this.prisma.submission.update({
            where: { id: submissionId },
            data: {
              status: 'COMPILATION_ERROR',
              score: 0,
              cmsResults: { compilation_error: true },
            },
          });
          this.logger.log(`Submission ${submissionId}: compilation error`);
          return;
        }

        // Compilation OK → wait for evaluations if no score yet
        if (cmsResult.score === null) continue;

        // Step 3: Get per-testcase outcomes from evaluations
        type EvalRow = { outcome: string | null };
        const evals = await this.prisma.$queryRawUnsafe<EvalRow[]>(
          `SELECT e.outcome FROM public.evaluations e
           WHERE e.submission_id = $1
           ORDER BY e.testcase_id`,
          [req.cmsSubmissionId],
        );

        const outcomes = evals.map((e) => e.outcome).filter(Boolean);
        const allCorrect = outcomes.every((o) => o === 'correct');
        const status = allCorrect ? 'ACCEPTED' : 'WRONG_ANSWER';
        const score = cmsResult.score ?? 0;

        await this.prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: status as any,
            score,
            cmsResults: { outcomes, score },
          },
        });

        this.logger.log(`Submission ${submissionId} evaluated: ${status} (score: ${score})`);
        return;
      } catch {
        // retry
      }
    }
    this.logger.warn(`Submission ${submissionId} polling timed out`);
  }

  async findById(id: string) {
    return this.prisma.submission.findUnique({
      where: { id },
      include: { problem: true },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.submission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      include: { problem: true },
    });
  }
}
