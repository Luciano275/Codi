import { Injectable, Logger } from '@nestjs/common';
import { spawn, execSync, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Subject, Observable, ReplaySubject } from 'rxjs';

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

  constructor(code: string, language: string) {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codi_'));
    this.srcFile = path.join(this.tmpDir, `source.${language === 'python' ? 'py' : 'cpp'}`);
    fs.writeFileSync(this.srcFile, code, 'utf-8');
  }

  get ended() { return this._ended; }

  start(language: string) {
    if (language === 'python') {
      this.spawn('python3', [this.srcFile]);
    } else {
      try {
        const outFile = path.join(this.tmpDir, 'a.out');
        execSync(`g++ -std=c++17 -O2 -o "${outFile}" "${this.srcFile}" -lm`, { timeout: 10000 });
        this.spawn(outFile, []);
      } catch (err: any) {
        this.events$.next({ type: 'stderr', data: err.stderr?.toString() || err.message });
        this.events$.next({ type: 'exit', data: '1' });
        this.events$.complete();
        this.cleanup();
      }
    }
  }

  private spawn(cmd: string, args: string[]) {
    this.child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

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
        this.child?.kill();
        this._ended = true;
        this.events$.next({ type: 'timeout', data: 'Execution timed out (30s limit)' });
        this.events$.complete();
        this.cleanup();
      }
    }, 30000);
  }

  writeStdin(data: string) {
    if (this.child?.stdin?.writable) {
      this.child.stdin.write(data + '\n');
    }
  }

  closeStdin() {
    if (this.child?.stdin?.writable) {
      this.child.stdin.end();
    }
  }

  onEvent(): Observable<PlaygroundEvent> {
    return this.events$.asObservable();
  }

  stop() {
    this._ended = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.child && !this.child.killed) {
      this.child.kill('SIGTERM');
      setTimeout(() => {
        if (this.child && !this.child.killed) this.child.kill('SIGKILL');
      }, 2000);
    }
    if (!this.events$.closed) {
      this.events$.complete();
    }
    this.cleanup();
  }

  private cleanup() {
    try { fs.rmSync(this.tmpDir, { recursive: true, force: true }); } catch {}
  }
}

@Injectable()
export class PlaygroundService {
  private readonly logger = new Logger(PlaygroundService.name);
  private sessions = new Map<string, PlaygroundSession>();

  createSession(code: string, language: string): string {
    const sessionId = Math.random().toString(36).substring(2, 10);
    const session = new PlaygroundSession(code, language);
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
