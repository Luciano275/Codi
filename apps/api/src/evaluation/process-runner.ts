import { spawn } from 'child_process';

const MAX_DIAGNOSTIC_BYTES = 1024 * 1024;

export interface ProcessResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export function runProcess(
  executable: string,
  args: string[],
  timeoutMs: number,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes = appendBounded(stdout, chunk, stdoutBytes);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes = appendBounded(stderr, chunk, stderrBytes);
    });
    child.once('error', reject);

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.once('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        exitCode,
        signal,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
        timedOut,
      });
    });
  });
}

function appendBounded(chunks: Buffer[], chunk: Buffer, byteCount: number): number {
  const remaining = MAX_DIAGNOSTIC_BYTES - byteCount;
  if (remaining <= 0) return byteCount;
  const boundedChunk = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
  chunks.push(boundedChunk);
  return byteCount + boundedChunk.length;
}
