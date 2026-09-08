import { Logger } from '@nestjs/common';
import { config } from '@codi/config';
import { spawn, execFileSync, type ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Observable, ReplaySubject } from 'rxjs';
import type { BoxLease } from '../sandbox/box-lease-pool.service';

const ISOLATE_BIN = config.eval.isolateBin;
const MAX_SOURCE_SIZE = 100 * 1024;

const COMPILE_LIMITS = {
  processes: 5,
  time: 30,
  wallTime: 60,
  cgMem: 524288,
  fsize: 102400,
} as const;

const EXECUTION_LIMITS = {
  processes: 5,
  time: 30,
  wallTime: 61,
  cgMem: 262144,
  fsize: 1024,
} as const;

export interface PlaygroundEvent {
  type: 'stdout' | 'stderr' | 'exit' | 'timeout';
  data: string;
}

export class PlaygroundSession {
  private readonly logger = new Logger(PlaygroundSession.name);
  private readonly events = new ReplaySubject<PlaygroundEvent>(100);
  private readonly temporaryDirectory: string;
  private readonly sourceFile: string;
  private child: ChildProcess | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private finished = false;
  private cleaned = false;

  constructor(
    code: string,
    language: string,
    private readonly lease: BoxLease,
    private readonly onDisposed: () => void,
  ) {
    this.validateSourceSize(code);
    this.temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'codi-playground-'));
    const extension = language === 'python' ? 'py' : 'cpp';
    this.sourceFile = path.join(this.temporaryDirectory, `source.${extension}`);
    fs.writeFileSync(this.sourceFile, code, 'utf-8');
    this.initializeSandbox();
    this.copySourceToSandbox();
    if (language === 'cpp') this.compileCpp();
  }

  get ended(): boolean {
    return this.finished;
  }

  start(language: string): void {
    if (this.finished) return;
    const command = language === 'python' ? ['/usr/bin/python3', '-u', 'source.py'] : ['./a.out'];

    try {
      this.child = spawn(ISOLATE_BIN, this.executionArguments(command), {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: EXECUTION_LIMITS.wallTime * 1000 + 60_000,
      });
      this.listenToChild();
      this.startTimeout();
    } catch (error) {
      this.fail(`Failed to start process: ${this.errorMessage(error)}`);
    }
  }

  writeStdin(data: string): void {
    if (this.child?.stdin?.writable && !this.finished) this.child.stdin.write(`${data}\n`);
  }

  onEvent(): Observable<PlaygroundEvent> {
    return this.events.asObservable();
  }

  stop(): void {
    this.finished = true;
    if (this.timer) clearTimeout(this.timer);
    this.terminateChild();
    if (!this.events.closed) this.events.complete();
    this.cleanup();
  }

  private validateSourceSize(code: string): void {
    if (Buffer.byteLength(code, 'utf-8') > MAX_SOURCE_SIZE) {
      throw new Error(`Source code exceeds ${MAX_SOURCE_SIZE} bytes`);
    }
  }

  private initializeSandbox(): void {
    try {
      execFileSync(ISOLATE_BIN, [`--box-id=${this.lease.boxId}`, '--init', '--cg'], {
        timeout: 10_000,
        stdio: 'pipe',
      });
    } catch (error) {
      this.fail(`Sandbox init error: ${this.errorMessage(error)}`);
    }
  }

  private copySourceToSandbox(): void {
    if (this.finished) return;
    const boxRoot = `/var/local/lib/isolate/${this.lease.boxId}/box`;
    fs.copyFileSync(this.sourceFile, path.join(boxRoot, path.basename(this.sourceFile)));
  }

  private compileCpp(): void {
    if (this.finished) return;
    const startedAt = Date.now();
    try {
      execFileSync(ISOLATE_BIN, this.compilationArguments(), {
        timeout: COMPILE_LIMITS.time * 1000 + 15_000,
        stdio: 'pipe',
      });
      this.logger.log(`C++ compiled in ${Date.now() - startedAt}ms [box=${this.lease.boxId}]`);
    } catch (error) {
      this.logger.error(`C++ compilation failed [box=${this.lease.boxId}]`);
      this.fail(this.processDiagnostic(error) || 'Compilation failed');
    }
  }

  private listenToChild(): void {
    this.child?.stdout?.on('data', (data: Buffer) => {
      this.events.next({ type: 'stdout', data: data.toString() });
    });
    this.child?.stderr?.on('data', (data: Buffer) => {
      this.events.next({ type: 'stderr', data: data.toString() });
    });
    this.child?.once('exit', (code) => this.finish(String(code ?? -1)));
    this.child?.once('error', (error) => this.fail(error.message));
  }

  private startTimeout(): void {
    this.timer = setTimeout(() => {
      if (this.finished) return;
      this.child?.kill('SIGKILL');
      this.finished = true;
      this.events.next({
        type: 'timeout',
        data: `Execution timed out (${EXECUTION_LIMITS.time}s limit)`,
      });
      this.events.complete();
      this.cleanup();
    }, EXECUTION_LIMITS.time * 1000);
  }

  private finish(exitCode: string): void {
    if (this.finished) return;
    this.finished = true;
    if (this.timer) clearTimeout(this.timer);
    this.events.next({ type: 'exit', data: exitCode });
    this.events.complete();
    this.cleanup();
  }

  private fail(message: string): void {
    if (this.finished) return;
    this.finished = true;
    this.events.next({ type: 'stderr', data: message });
    this.events.next({ type: 'exit', data: '1' });
    this.events.complete();
    this.cleanup();
  }

  private terminateChild(): void {
    if (!this.child || this.child.killed) return;
    this.child.kill('SIGTERM');
    const forcedTermination = setTimeout(() => this.child?.kill('SIGKILL'), 2_000);
    forcedTermination.unref();
  }

  private cleanup(): void {
    if (this.cleaned) return;
    this.cleaned = true;
    fs.rmSync(this.temporaryDirectory, { recursive: true, force: true });
    try {
      execFileSync(ISOLATE_BIN, [`--box-id=${this.lease.boxId}`, '--cleanup', '--cg'], {
        timeout: 10_000,
        stdio: 'pipe',
      });
    } catch (error) {
      this.logger.debug(
        `isolate cleanup failed [box=${this.lease.boxId}]: ${this.errorMessage(error)}`,
      );
    }
    this.lease.release();
    this.onDisposed();
  }

  private compilationArguments(): string[] {
    return [
      `--box-id=${this.lease.boxId}`,
      '--run',
      '--cg',
      `--processes=${COMPILE_LIMITS.processes}`,
      `--time=${COMPILE_LIMITS.time}`,
      `--wall-time=${COMPILE_LIMITS.wallTime}`,
      `--cg-mem=${COMPILE_LIMITS.cgMem}`,
      `--fsize=${COMPILE_LIMITS.fsize}`,
      '--',
      '/usr/bin/g++',
      '-B/usr/bin',
      '-std=c++17',
      '-O2',
      '-o',
      'a.out',
      'source.cpp',
      '-lm',
    ];
  }

  private executionArguments(command: string[]): string[] {
    return [
      `--box-id=${this.lease.boxId}`,
      '--run',
      '--cg',
      `--processes=${EXECUTION_LIMITS.processes}`,
      `--time=${EXECUTION_LIMITS.time}`,
      `--wall-time=${EXECUTION_LIMITS.wallTime}`,
      `--cg-mem=${EXECUTION_LIMITS.cgMem}`,
      `--fsize=${EXECUTION_LIMITS.fsize}`,
      '--',
      ...command,
    ];
  }

  private processDiagnostic(error: unknown): string {
    if (!(error instanceof Error)) return String(error);
    const processError = error as Error & { stderr?: Buffer };
    return processError.stderr?.toString() || processError.message;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
