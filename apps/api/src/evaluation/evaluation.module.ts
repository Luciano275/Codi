import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CmsTaskConfigRepository } from './cms-task-config.repository';
import { EvaluationCompletionService } from './evaluation-completion.service';
import { EvaluationQueueProcessor } from './evaluation-queue.processor';
import { EvaluationQueueRepository } from './evaluation-queue.repository';
import { CloudflareSandboxService } from './cloudflare-sandbox.service';
import { SubmissionCompilerService } from './submission-compiler.service';

@Module({
  providers: [
    CmsTaskConfigRepository,
    EvaluationCompletionService,
    EvaluationQueueProcessor,
    EvaluationQueueRepository,
    EvaluationService,
    CloudflareSandboxService,
    SubmissionCompilerService,
  ],
  exports: [EvaluationQueueProcessor, EvaluationService],
})
export class EvaluationModule {}
