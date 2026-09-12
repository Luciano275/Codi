import { config } from '@codi/config';

export const evaluationSettings = {
  submissionConcurrency: config.eval.submissionConcurrency,
  testcaseConcurrency: config.eval.testcaseConcurrency,
  compileConcurrency: config.eval.compileConcurrency,
  cacheTtlMs: config.eval.cacheTtlMs,
  queuePollMs: config.eval.queuePollMs,
  leaseMs: config.eval.leaseSeconds * 1000,
  maxAttempts: config.eval.maxAttempts,
  maxOutputKb: config.eval.maxOutputKb,
} as const;
