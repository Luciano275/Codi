import { Injectable, Logger } from '@nestjs/common';
import { spawn, execSync, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import { Observable, ReplaySubject } from 'rxjs';

const ISOLATE_BIN = '/usr/local/bin/isolate';
const MAX_BOX_ID = 99;

interface PlaygroundEvent {
  type: 'stdout' | 'stderr' | 'exit' | 'timeout';
  data: string;
}

class PlaygroundSession {
  private child: ChildProcess | null = null;
  private events$ = new ReplaySubject<PlaygroundEvent>(100);
  private _ended = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private tmpDir: string;
  private srcFile: string;
  private readonly boxId: number;

  constructor(code: string, language: string, boxId: number) {
    this.boxId = boxId;
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
      execSync(
        `${ISOLATE_BIN} --box-id=${this.boxId} --init --cg`,
        { timeout: 10000, stdio: 'pipe' },
      );
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
    try {
      execSync(
        `${ISOLATE_BIN} --box-id=${this.boxId} --run --cg -- /usr/bin/g++ -std=c++17 -O2 -o a.out source.cpp -lm`,
        { timeout: 15000, stdio: 'pipe' },
      );
    } catch (err: any) {
      const msg = err.stderr?.toString() || err.message || 'Compilation failed';
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

  start(language: string) {
    if (this._ended) return;

    const cmd = language === 'python'
      ? ['/usr/bin/python3', '-u', 'source.py']
      : ['./a.out'];

    try {
      this.child = spawn(ISOLATE_BIN, [
        `--box-id=${this.boxId}`, '--run', '--cg',
        '--time=30',
        '--wall-time=61',
        '--cg-mem=262144',
        '--fsize=1024',
        '--processes=5',
        '--', ...cmd,
      ], { stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 });
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
        this.events$.next({ type: 'timeout', data: 'Execution timed out (30s limit)' });
        this.events$.complete();
        this.cleanup();
      }
    }, 30000);
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
    try { fs.rmSync(this.tmpDir, { recursive: true, force: true }); } catch { }
    try {
      execSync(
        `${ISOLATE_BIN} --box-id=${this.boxId} --cleanup --cg`,
        { timeout: 10000, stdio: 'pipe' },
      );
    } catch { }
  }
}

@Injectable()
export class PlaygroundService {
  private readonly logger = new Logger(PlaygroundService.name);
  private sessions = new Map<string, PlaygroundSession>();
  private nextBoxId = 1;

  createSession(code: string, language: string): string {
    const sessionId = crypto.randomUUID();
    const boxId = this.nextBoxId;
    this.nextBoxId = (this.nextBoxId % MAX_BOX_ID) + 1;
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
      session.stop();
      this.sessions.delete(sessionId);
    }
  }
}
