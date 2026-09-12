import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { evaluationSettings } from './evaluation.constants';
import { EvaluationCompletionService } from './evaluation-completion.service';
import { EvaluationQueueRepository, type EvaluationJob } from './evaluation-queue.repository';
import { EvaluationService } from './evaluation.service';

@Injectable()
export class EvaluationQueueProcessor implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(EvaluationQueueProcessor.name);
  private readonly workerId = `${process.pid}:${randomUUID()}`;
  private readonly running = new Set<Promise<void>>();
  private active = true;
  private wakeResolver: (() => void) | null = null;
  private loop: Promise<void> | null = null;

  constructor(
    private readonly queue: EvaluationQueueRepository,
    private readonly evaluator: EvaluationService,
    private readonly completion: EvaluationCompletionService,
  ) {}

  onModuleInit(): void {
    this.loop = this.processLoop();
    void this.loop.catch((error: unknown) => {
      this.logger.error(`Evaluation queue stopped: ${this.errorMessage(error)}`);
    });
  }

  wake(): void {
    this.wakeResolver?.();
    this.wakeResolver = null;
  }

  async onApplicationShutdown(): Promise<void> {
    this.active = false;
    this.wake();
    await this.loop;
    await Promise.allSettled(this.running);
  }

  private async processLoop(): Promise<void> {
    while (this.active) {
      if (this.running.size >= evaluationSettings.submissionConcurrency) {
        await Promise.race(this.running);
        continue;
      }

      const job = await this.claimNextJob();
      if (!job) {
        await this.waitForWork();
        continue;
      }
      this.start(job);
    }
  }

  private start(job: EvaluationJob): void {
    const operation = this.process(job)
      .catch((error: unknown) => {
        this.logger.error(`Could not release failed job ${job.id}: ${this.errorMessage(error)}`);
      })
      .finally(() => {
        this.running.delete(operation);
        this.wake();
      });
    this.running.add(operation);
  }

  private async claimNextJob(): Promise<EvaluationJob | null> {
    try {
      return await this.queue.claim(this.workerId);
    } catch (error) {
      this.logger.error(`Could not claim evaluation job: ${this.errorMessage(error)}`);
      await this.waitForWork();
      return null;
    }
  }

  private async process(job: EvaluationJob): Promise<void> {
    const heartbeat = setInterval(
      () => {
        void this.queue.extendLease(job.id, this.workerId).catch((error: unknown) => {
          this.logger.warn(`Could not renew lease for ${job.id}: ${this.errorMessage(error)}`);
        });
      },
      Math.min(30_000, Math.max(1_000, evaluationSettings.leaseMs / 3)),
    );

    try {
      const result = await this.evaluator.evaluate(
        job.userId,
        job.language,
        job.code,
        job.cmsTaskId,
      );
      await this.completion.complete(job.id, this.workerId, result);
    } catch (error) {
      const failure = this.toError(error);
      this.logger.error(
        `Evaluation attempt ${job.attempts} failed for ${job.id}: ${failure.message}`,
      );
      await this.queue.releaseForRetry(job.id, this.workerId, job.attempts, failure);
    } finally {
      clearInterval(heartbeat);
    }
  }

  private waitForWork(): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.wakeResolver = null;
        resolve();
      }, evaluationSettings.queuePollMs);
      this.wakeResolver = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private errorMessage(error: unknown): string {
    return this.toError(error).message;
  }
}
