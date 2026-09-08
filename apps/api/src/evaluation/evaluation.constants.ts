import { config } from '@codi/config';

export const evaluationSettings = {
  isolateBin: config.eval.isolateBin,
  boxRange: { first: config.eval.firstBoxId, last: config.eval.lastBoxId },
  submissionConcurrency: config.eval.submissionConcurrency,
  testcaseConcurrency: config.eval.testcaseConcurrency,
  compileConcurrency: config.eval.compileConcurrency,
  cacheTtlMs: config.eval.cacheTtlMs,
  queuePollMs: config.eval.queuePollMs,
  leaseMs: config.eval.leaseSeconds * 1000,
  maxAttempts: config.eval.maxAttempts,
  maxOutputKb: config.eval.maxOutputKb,
} as const;
