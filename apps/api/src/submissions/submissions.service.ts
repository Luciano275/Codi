import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { EvaluationService } from '../evaluation/evaluation.service';
import { updateUserExperience } from '../progression/update-user-experience';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluation: EvaluationService,
  ) {}

  async submit(userId: string, problemId: string, code: string, language: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const problem = await this.prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw new NotFoundException('Problem not found');

    const submission = await this.prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        status: 'EVALUATING',
      },
    });

    this.evaluate(submission.id, problem.cmsTaskId).catch((err) => {
      this.logger.error(`Evaluation failed: ${err.message}`);
    });

    return submission;
  }

  private async evaluate(submissionId: string, cmsTaskId: number | null) {
    if (!cmsTaskId) {
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'RUNTIME_ERROR', cmsResults: { error: 'No CMS task configured' } },
      });
      return;
    }

    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return;

    const langMap: Record<string, string> = {
      python: 'Python 3 / CPython',
      cpp: 'C++20 / g++',
      c: 'C11 / gcc',
      java: 'Java / JDK',
    };
    const cmsLanguage = langMap[submission.language] || submission.language;

    try {
      const result = await this.evaluation.evaluate(cmsLanguage, submission.code, cmsTaskId);

      if (result.ok) {
        const updateData: any = {
          status: result.status,
          score: result.score,
          cmsResults: result.results ?? [],
          evaluatedAt: new Date(),
        };

        const isAccepted = result.status === 'ACCEPTED' && (result.score ?? 0) >= 99.999;
        if (isAccepted) {
          const problem = await this.prisma.problem.findUnique({
            where: { id: submission.problemId },
            select: { xpReward: true, gemsReward: true },
          });

          const previousAccepted =
            problem &&
            (await this.prisma.submission.findFirst({
              where: {
                userId: submission.userId,
                problemId: submission.problemId,
                status: 'ACCEPTED',
                id: { not: submissionId },
              },
            }));

          const gemsAlreadyAwarded =
            problem &&
            (await this.prisma.submission.findFirst({
              where: {
                userId: submission.userId,
                problemId: submission.problemId,
                status: 'ACCEPTED',
                gemsAwarded: true,
              },
            }));

          await this.prisma.submission.update({
            where: { id: submissionId },
            data: {
              ...updateData,
              gemsAwarded: !gemsAlreadyAwarded && problem != null && problem.gemsReward > 0,
            },
          });

          if (problem && !previousAccepted) {
            await this.prisma.$transaction(async (transaction) => {
              const xpAward = await updateUserExperience(transaction, submission.userId, problem.xpReward);
              await transaction.submission.update({
                where: { id: submissionId },
                data: { xpAwarded: xpAward.xpAwarded },
              });
              await transaction.user.update({
                where: { id: submission.userId },
                data: { gems: { increment: problem.gemsReward } },
              });
            });
            this.logger.log(
              `Submission ${submissionId}: ACCEPTED — awarded ${problem.xpReward} XP, ${problem.gemsReward} gems`,
            );
          } else if (problem && !gemsAlreadyAwarded && problem.gemsReward > 0) {
            await this.prisma.user.update({
              where: { id: submission.userId },
              data: { gems: { increment: problem.gemsReward } },
            });
            this.logger.log(
              `Submission ${submissionId}: ACCEPTED — awarded ${problem.gemsReward} gems (retroactive)`,
            );
          } else {
            this.logger.log(`Submission ${submissionId}: ${result.status} (${result.score} pts)`);
          }
        } else {
          await this.prisma.submission.update({ where: { id: submissionId }, data: updateData });
          this.logger.log(`Submission ${submissionId}: ${result.status} (${result.score} pts)`);
        }
      } else {
        await this.prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: (result.status as any) || 'RUNTIME_ERROR',
            score: 0,
            cmsResults: { error: result.error },
            evaluatedAt: new Date(),
          },
        });
        this.logger.warn(`Submission ${submissionId}: ${result.status} - ${result.error}`);
      }
    } catch (err: any) {
      this.logger.error(`Evaluation error for ${submissionId}: ${err.message}`);
      await this.prisma.submission
        .update({
          where: { id: submissionId },
          data: { status: 'RUNTIME_ERROR', cmsResults: { error: err.message } },
        })
        .catch(() => {});
    }
  }

  async findById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;
    const submission = await this.prisma.submission.findUnique({
      where,
      include: { problem: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    return submission;
  }

  async findByUser(userId: string) {
    return this.prisma.submission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      include: { problem: true },
    });
  }
}
