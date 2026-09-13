import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaService, type SubmissionStatus } from '@codi/database';
import { updateUserExperience } from '../progression/update-user-experience';
import type { EvaluationResult } from './evaluation.types';

const SERIALIZATION_RETRIES = 3;

@Injectable()
export class EvaluationCompletionService {
  private readonly logger = new Logger(EvaluationCompletionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async complete(submissionId: string, workerId: string, result: EvaluationResult): Promise<void> {
    for (let attempt = 1; attempt <= SERIALIZATION_RETRIES; attempt += 1) {
      try {
        await this.completeTransaction(submissionId, workerId, result);
        return;
      } catch (error) {
        if (!this.isSerializationConflict(error) || attempt === SERIALIZATION_RETRIES) throw error;
      }
    }
  }

  private async completeTransaction(
    submissionId: string,
    workerId: string,
    result: EvaluationResult,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (transaction) => {
        const claimed = await transaction.submission.findFirst({
          where: { id: submissionId, evaluationWorkerId: workerId, status: 'EVALUATING' },
          include: { problem: true },
        });
        if (!claimed) return;

        const status = result.status as SubmissionStatus;
        const accepted = result.ok && status === 'ACCEPTED' && result.score >= 99.999;
        const reward = accepted
          ? await this.calculateReward(
              transaction,
              submissionId,
              claimed.userId,
              claimed.problemId,
              claimed.problem.gemsReward,
            )
          : { awardXp: false, awardGems: false };

        await transaction.submission.update({
          where: { id: submissionId },
          data: {
            status,
            score: result.score,
            cmsResults: this.toJson(result.results ?? { error: result.error }),
            evaluatedAt: new Date(),
            evaluationLeaseUntil: null,
            evaluationWorkerId: null,
            gemsAwarded: reward.awardGems,
          },
        });

        let xpAwarded = 0;
        if (reward.awardXp) {
          const award = await updateUserExperience(
            transaction,
            claimed.userId,
            claimed.problem.xpReward,
          );
          xpAwarded = award.xpAwarded;
        }
        if (reward.awardGems) {
          await transaction.user.update({
            where: { id: claimed.userId },
            data: { gems: { increment: claimed.problem.gemsReward } },
          });
        }
        if (xpAwarded > 0) {
          await transaction.submission.update({
            where: { id: submissionId },
            data: { xpAwarded },
          });
        }

        this.logCompletion(
          submissionId,
          result,
          xpAwarded,
          reward.awardGems ? claimed.problem.gemsReward : 0,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async calculateReward(
    transaction: Prisma.TransactionClient,
    submissionId: string,
    userId: string,
    problemId: string,
    gemsReward: number,
  ): Promise<{ awardXp: boolean; awardGems: boolean }> {
    const previousCompletion = await transaction.submission.findFirst({
      where: { userId, problemId, status: 'ACCEPTED', id: { not: submissionId } },
      select: { id: true },
    });
    const isFirstCompletion = !previousCompletion;

    return {
      awardXp: isFirstCompletion,
      awardGems: isFirstCompletion && gemsReward > 0,
    };
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private isSerializationConflict(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
  }

  private logCompletion(
    submissionId: string,
    result: EvaluationResult,
    xpAwarded: number,
    gemsAwarded: number,
  ): void {
    const reward = xpAwarded || gemsAwarded ? `; +${xpAwarded} XP, +${gemsAwarded} gems` : '';
    this.logger.log(`${submissionId}: ${result.status} (${result.score} pts${reward})`);
  }
}
