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
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const submission = await this.prisma.submission.findUnique({
          where: { id: submissionId },
          select: { status: true, score: true, cmsResults: true },
        });
        if (!submission) return;

        if (
          submission.status !== 'PENDING' &&
          submission.status !== 'COMPILING' &&
          submission.status !== 'EVALUATING'
        ) {
          this.logger.log(
            `Submission ${submissionId} evaluated: ${submission.status}`,
          );
          return;
        }
      } catch {
        // poll failed, retry
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
