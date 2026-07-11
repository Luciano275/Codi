import { Injectable, Logger } from '@nestjs/common';
import { spawn, execFileSync, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import { Observable, ReplaySubject } from 'rxjs';

const ISOLATE_BIN = '/usr/local/bin/isolate';
const MAX_BOX_ID = 99;

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

const MAX_SOURCE_SIZE = 100 * 1024;

interface PlaygroundEvent {
  type: 'stdout' | 'stderr' | 'exit' | 'timeout';
  data: string;
}

class PlaygroundSession {
  private readonly logger = new Logger('PlaygroundSession');
  private child: ChildProcess | null = null;
  private events$ = new ReplaySubject<PlaygroundEvent>(100);
  private _ended = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private tmpDir: string;
  private srcFile: string;
  private readonly boxId: number;

  constructor(code: string, language: string, boxId: number) {
    this.boxId = boxId;
    if (Buffer.byteLength(code, 'utf-8') > MAX_SOURCE_SIZE) {
      throw new Error(`Source code exceeds ${MAX_SOURCE_SIZE} bytes`);
    }
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codi_'));
    const ext = language === 'python' ? 'py' : 'cpp';
    this.srcFile = path.join(this.tmpDir, `source.${ext}`);
    fs.writeFileSync(this.srcFile, code, 'utf-8');
    this.initIsolate();
    this.copyToBox();
    if (language !== 'python') {
      this.compileCpp();
    }
  }

  private initIsolate() {
    try {
      execFileSync(ISOLATE_BIN, [
        `--box-id=${this.boxId}`, '--init', '--cg',
      ], { timeout: 10000, stdio: 'pipe' });
    } catch (err: any) {
      this.events$.next({ type: 'stderr', data: `Sandbox init error: ${err.stderr?.toString() || err.message}` });
      this.events$.next({ type: 'exit', data: '1' });
      this.events$.complete();
      this._ended = true;
      this.cleanup();
    }
  }

  private copyToBox() {
    const boxRoot = `/var/local/lib/isolate/${this.boxId}/box`;
    if (!fs.existsSync(boxRoot)) return;
    const files = fs.readdirSync(this.tmpDir);
    for (const f of files) {
      try {
        fs.cpSync(path.join(this.tmpDir, f), path.join(boxRoot, f), { recursive: true });
      } catch { }
    }
  }

  private compileCpp() {
    const start = Date.now();
    try {
      execFileSync(ISOLATE_BIN, [
        `--box-id=${this.boxId}`, '--run', '--cg',
        `--processes=${COMPILE_LIMITS.processes}`,
        `--time=${COMPILE_LIMITS.time}`,
        `--wall-time=${COMPILE_LIMITS.wallTime}`,
        `--cg-mem=${COMPILE_LIMITS.cgMem}`,
        `--fsize=${COMPILE_LIMITS.fsize}`,
        '--', '/usr/bin/g++', '-B/usr/bin', '-std=c++17', '-O2', '-o', 'a.out', 'source.cpp', '-lm',
      ], { timeout: COMPILE_LIMITS.time * 1000 + 15000, stdio: 'pipe' });
      this.logger.log(`C++ compiled in ${Date.now() - start}ms [box=${this.boxId}]`);
    } catch (err: any) {
      const stderr = err.stderr?.toString() || '';
      const stdout = err.stdout?.toString() || '';
      const msg = stderr || err.message || 'Compilation failed';
      this.logger.error(
        `C++ compilation failed [box=${this.boxId} status=${err.status} signal=${err.signal} ` +
        `elapsed=${Date.now() - start}ms]: ${msg}` +
        (stdout ? `\nstdout: ${stdout}` : ''),
      );
      this.events$.next({ type: 'stderr', data: msg });
      this.events$.next({ type: 'exit', data: '1' });
      this.events$.complete();
      this._ended = true;
      this.cleanup();
    }
  }

  get ended() {
    return this._ended;
  }

  get id() {
    return this.boxId;
  }

  start(language: string) {
    if (this._ended) return;

    const cmd = language === 'python'
      ? ['/usr/bin/python3', '-u', 'source.py']
      : ['./a.out'];

    try {
      this.child = spawn(ISOLATE_BIN, [
        `--box-id=${this.boxId}`, '--run', '--cg',
        `--processes=${EXECUTION_LIMITS.processes}`,
        `--time=${EXECUTION_LIMITS.time}`,
        `--wall-time=${EXECUTION_LIMITS.wallTime}`,
        `--cg-mem=${EXECUTION_LIMITS.cgMem}`,
        `--fsize=${EXECUTION_LIMITS.fsize}`,
        '--', ...cmd,
      ], { stdio: ['pipe', 'pipe', 'pipe'], timeout: EXECUTION_LIMITS.wallTime * 1000 + 60000 });
    } catch (err: any) {
      this.events$.next({ type: 'stderr', data: `Failed to start process: ${err.message}` });
      this.events$.next({ type: 'exit', data: '-1' });
      this.events$.complete();
      this._ended = true;
      this.cleanup();
      return;
    }

    this.child.stdout!.on('data', (data: Buffer) => {
      this.events$.next({ type: 'stdout', data: data.toString() });
    });

    this.child.stderr!.on('data', (data: Buffer) => {
      this.events$.next({ type: 'stderr', data: data.toString() });
    });

    this.child.on('exit', (code) => {
      this._ended = true;
      if (this.timer) clearTimeout(this.timer);
      this.events$.next({ type: 'exit', data: String(code ?? -1) });
      this.events$.complete();
      this.cleanup();
    });

    this.child.on('error', (err) => {
      this._ended = true;
      if (this.timer) clearTimeout(this.timer);
      this.events$.next({ type: 'stderr', data: err.message });
      this.events$.next({ type: 'exit', data: '-1' });
      this.events$.complete();
      this.cleanup();
    });

    this.timer = setTimeout(() => {
      if (!this._ended) {
        this.child?.kill('SIGKILL');
        this._ended = true;
        this.events$.next({ type: 'timeout', data: `Execution timed out (${EXECUTION_LIMITS.time}s limit)` });
        this.events$.complete();
        this.cleanup();
      }
    }, EXECUTION_LIMITS.time * 1000);
  }

  writeStdin(data: string) {
    if (this.child?.stdin?.writable && !this._ended) {
      this.child.stdin.write(data + '\n');
    }
  }

  onEvent(): Observable<PlaygroundEvent> {
    return this.events$.asObservable();
  }

  stop() {
    this._ended = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.child && !this.child.killed) {
      try {
        this.child.kill('SIGTERM');
        setTimeout(() => {
          if (this.child && !this.child.killed) this.child.kill('SIGKILL');
        }, 2000);
      } catch { }
    }
    if (!this.events$.closed) {
      this.events$.complete();
    }
    this.cleanup();
  }

  private cleanup() {
    try {
      fs.rmSync(this.tmpDir, { recursive: true, force: true });
    } catch (err: any) {
      this.logger.debug(`tmp cleanup failed [box=${this.boxId}]: ${err.message}`);
    }
    try {
      execFileSync(ISOLATE_BIN, [
        `--box-id=${this.boxId}`, '--cleanup', '--cg',
      ], { timeout: 10000, stdio: 'pipe' });
    } catch (err: any) {
      this.logger.debug(`isolate cleanup failed [box=${this.boxId}]: ${err.message}`);
    }
  }
}

@Injectable()
export class PlaygroundService {
  private readonly logger = new Logger(PlaygroundService.name);
  private sessions = new Map<string, PlaygroundSession>();
  private usedBoxIds = new Set<number>();

  private allocateBoxId(): number {
    for (let id = 1; id <= MAX_BOX_ID; id++) {
      if (!this.usedBoxIds.has(id)) {
        this.usedBoxIds.add(id);
        return id;
      }
    }
    throw new Error('No available box IDs (all 99 in use)');
  }

  private releaseBoxId(boxId: number) {
    this.usedBoxIds.delete(boxId);
  }

  createSession(code: string, language: string): string {
    const sessionId = crypto.randomUUID();
    const boxId = this.allocateBoxId();
    const session = new PlaygroundSession(code, language, boxId);
    this.sessions.set(sessionId, session);
    session.start(language);
    return sessionId;
  }

  getSession(sessionId: string): PlaygroundSession | undefined {
    return this.sessions.get(sessionId);
  }

  stopSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.releaseBoxId(session.id);
      session.stop();
      this.sessions.delete(sessionId);
    }
  }
}
