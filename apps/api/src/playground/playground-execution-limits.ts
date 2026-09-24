import {
  MAX_SANDBOX_MEMORY_KB,
  MAX_SANDBOX_TIME_SECONDS,
  type SandboxCommand,
} from '@codi/evaluator-contract';

const DEFAULT_TIME_SECONDS = 1;
const DEFAULT_MEMORY_KB = MAX_SANDBOX_MEMORY_KB;

export interface TaskResourceLimits {
  timeLimit: number | null;
  memoryLimitBytes: bigint | null;
}

export function resolvePlaygroundExecutionLimits(
  taskLimits?: TaskResourceLimits,
): SandboxCommand['limits'] {
  const timeSeconds = normalizeTimeLimit(taskLimits?.timeLimit);
  return {
    timeSeconds,
    wallSeconds: timeSeconds,
    memoryKb: normalizeMemoryLimit(taskLimits?.memoryLimitBytes),
    outputKb: 1024,
    processes: 5,
  };
}

function normalizeTimeLimit(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value) || value < 0) return DEFAULT_TIME_SECONDS;
  return Math.min(Math.ceil(value), MAX_SANDBOX_TIME_SECONDS);
}

function normalizeMemoryLimit(value: bigint | null | undefined): number {
  if (!value || value <= 0n) return DEFAULT_MEMORY_KB;
  const memoryKb = Number(value / 1024n);
  if (!Number.isSafeInteger(memoryKb) || memoryKb < 1) return DEFAULT_MEMORY_KB;
  return Math.min(memoryKb, MAX_SANDBOX_MEMORY_KB);
}
