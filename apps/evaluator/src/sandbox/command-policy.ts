import type { SandboxCommand } from '@codi/evaluator-contract';

const ALLOWED_COMMANDS = new Set([
  '/usr/bin/g++\u0000-DEVAL\u0000-std=gnu++20\u0000-O2\u0000-pipe\u0000-c\u0000-o\u0000grader.o\u0000grader.cpp',
  '/usr/bin/g++\u0000-DEVAL\u0000-std=gnu++20\u0000-O2\u0000-pipe\u0000-c\u0000-o\u0000solution.o\u0000solution.cpp',
  '/usr/bin/g++\u0000-B/usr/bin\u0000-static\u0000-s\u0000-o\u0000submission\u0000grader.o\u0000solution.o\u0000-lm',
  '/usr/bin/g++\u0000-B/usr/bin\u0000-static\u0000-s\u0000-o\u0000submission\u0000solution.o\u0000-lm',
  '/usr/bin/g++\u0000-B/usr/bin\u0000-std=c++17\u0000-O2\u0000-o\u0000a.out\u0000source.cpp\u0000-lm',
  '/usr/bin/python3\u0000-m\u0000py_compile\u0000solution.py',
  '/usr/bin/python3\u0000-m\u0000py_compile\u0000solution.py\u0000grader.py',
  '/usr/bin/python3\u0000grader.py',
  '/usr/bin/python3\u0000solution.py',
  '/usr/bin/python3\u0000-u\u0000source.py',
  './a.out',
  './submission',
  '/usr/bin/python3\u0000../grader.py',
  '/usr/bin/python3\u0000../solution.py',
  '../submission',
]);

export function assertCommandAllowed(request: SandboxCommand): void {
  if (!ALLOWED_COMMANDS.has(request.command.join('\u0000'))) {
    throw new Error('Command is not allowed by the evaluator policy');
  }
  if (request.stdin && request.stdin !== 'input.txt') throw new Error('Invalid stdin target');
  if (request.stdout && request.stdout !== 'output.txt') throw new Error('Invalid stdout target');
  if (request.stderr && request.stderr !== 'stderr.txt') throw new Error('Invalid stderr target');
}
