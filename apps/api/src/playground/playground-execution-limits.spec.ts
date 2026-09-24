import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_SANDBOX_MEMORY_KB } from '@codi/evaluator-contract';
import { resolvePlaygroundExecutionLimits } from './playground-execution-limits';

test('uses a one-second and 512 MB limit when a task has no configured limits', () => {
  assert.deepEqual(resolvePlaygroundExecutionLimits(), {
    timeSeconds: 1,
    wallSeconds: 1,
    memoryKb: 512 * 1024,
    outputKb: 1024,
    processes: 5,
  });
});

test('uses configured task limits without allowing more than 512 MB', () => {
  assert.deepEqual(
    resolvePlaygroundExecutionLimits({ timeLimit: 3, memoryLimitBytes: 1024n * 1024n * 1024n }),
    {
      timeSeconds: 3,
      wallSeconds: 3,
      memoryKb: MAX_SANDBOX_MEMORY_KB,
      outputKb: 1024,
      processes: 5,
    },
  );
});
