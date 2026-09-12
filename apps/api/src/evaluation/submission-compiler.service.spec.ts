import assert from 'node:assert/strict';
import test from 'node:test';
import type { SandboxCommand } from '@codi/evaluator-contract';
import {
  CloudflareSandboxService,
  type SandboxExecution,
  type SandboxSession,
} from './cloudflare-sandbox.service';
import { SubmissionCompilerService } from './submission-compiler.service';
import type { CmsTaskConfiguration } from './evaluation.types';

const USER_ID = '00000000-0000-4000-8000-000000000001';

test('C++ compilation creates a statically linked executable', async () => {
  const sandbox = new SandboxRecorder();
  const compiler = new SubmissionCompilerService(sandbox as unknown as CloudflareSandboxService);

  const compiled = await compiler.compile(USER_ID, 'cpp', 'int main() { return 0; }', task());

  assert.deepEqual(
    sandbox.commands.map(({ command }) => command),
    [
      [
        '/usr/bin/g++',
        '-DEVAL',
        '-std=gnu++20',
        '-O2',
        '-pipe',
        '-c',
        '-o',
        'solution.o',
        'solution.cpp',
      ],
      ['/usr/bin/g++', '-B/usr/bin', '-static', '-s', '-o', 'submission', 'solution.o', '-lm'],
    ],
  );
  assert.deepEqual(compiled.command, ['./submission']);
  assert.deepEqual(compiled.files.get('submission'), Buffer.from('compiled-binary'));
});

class SandboxRecorder {
  readonly commands: SandboxCommand[] = [];

  async use<T>(
    userId: string,
    files: ReadonlyMap<string, Buffer>,
    operation: (session: SandboxSession) => Promise<T>,
  ): Promise<T> {
    assert.equal(userId, USER_ID);
    assert.ok(files.has('solution.cpp'));
    return operation({
      execute: async (command) => {
        this.commands.push(command);
        return successfulExecution();
      },
      read: async (filename) =>
        Buffer.from(filename === 'submission' ? 'compiled-binary' : filename),
    });
  }
}

function successfulExecution(): SandboxExecution {
  return {
    exitCode: 0,
    signal: null,
    stdout: '',
    stderr: '',
    timedOut: false,
    metadata: new Map(),
  };
}

function task(): CmsTaskConfiguration {
  return {
    datasetId: 1,
    timeLimit: 1,
    memoryLimitKb: 262_144,
    taskType: 'Batch',
    taskTypeParameters: ['diff'],
    scoreType: 'Sum',
    scoreTypeParameters: [],
    graderSource: null,
    testcases: [],
  };
}
