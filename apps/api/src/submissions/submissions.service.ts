import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { EvaluationQueueProcessor } from '../evaluation/evaluation-queue.processor';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationQueue: EvaluationQueueProcessor,
  ) {}

  async submit(userId: string, problemId: string, code: string, language: string) {
    const [user, problem] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      this.prisma.problem.findUnique({ where: { id: problemId }, select: { id: true } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!problem) throw new NotFoundException('Problem not found');

    const submission = await this.prisma.submission.create({
      data: { userId, problemId, code, language, status: 'EVALUATING' },
    });
    this.evaluationQueue.wake();
    return submission;
  }

  async findById(id: string, userId?: string) {
    const submission = await this.prisma.submission.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
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
