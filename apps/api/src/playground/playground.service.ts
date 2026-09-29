import { BadRequestException, Injectable, OnApplicationShutdown } from '@nestjs/common';
import type { SandboxCommand } from '@codi/evaluator-contract';
import { CloudflareSandboxClientService } from '../sandbox/cloudflare-sandbox-client.service';
import { resolvePlaygroundExecutionLimits } from './playground-execution-limits';
import { PlaygroundSession } from './playground-session';
import { PlaygroundTaskLimitsService } from './playground-task-limits.service';

const FINISHED_SESSION_RETENTION_MS = 60_000;
const MAX_SOURCE_SIZE = 100 * 1024;
const MAX_COMPILER_DIAGNOSTIC_LENGTH = 16_000;
const COMPILE_LIMITS = {
  timeSeconds: 30,
  wallSeconds: 60,
  memoryKb: 524_288,
  outputKb: 1024,
  processes: 5,
} as const;
interface OwnedPlaygroundSession {
  ownerId: string;
  session: PlaygroundSession;
}

@Injectable()
export class PlaygroundService implements OnApplicationShutdown {
  private readonly sessions = new Map<string, OwnedPlaygroundSession>();

  constructor(
    private readonly sandbox: CloudflareSandboxClientService,
    private readonly taskLimits: PlaygroundTaskLimitsService,
  ) {}

  async createSession(
    userId: string,
    code: string,
    language: string,
    problemId?: string,
  ): Promise<string> {
    this.validateSource(code, language);
    const limits = resolvePlaygroundExecutionLimits(
      problemId ? await this.taskLimits.find(problemId) : undefined,
    );
    const filename = language === 'python' ? 'source.py' : 'source.cpp';
    const sandboxSessionId = await this.sandbox.createSession(
      userId,
      new Map([[filename, Buffer.from(code)]]),
    );

    try {
      if (language === 'cpp') await this.compileCpp(userId, sandboxSessionId);
      const terminalId = await this.sandbox.createTerminal(
        userId,
        sandboxSessionId,
        this.executionCommand(language, limits),
      );
      const session = new PlaygroundSession(
        this.sandbox,
        userId,
        sandboxSessionId,
        terminalId,
        limits.wallSeconds * 1000,
        () => {
          this.expireFinishedSession(sandboxSessionId);
        },
      );
      this.sessions.set(sandboxSessionId, { ownerId: userId, session });
      session.start();
      return sandboxSessionId;
    } catch (error) {
      await this.sandbox.destroySession(userId, sandboxSessionId).catch(() => undefined);
      throw error;
    }
  }

  getSession(userId: string, sessionId: string): PlaygroundSession | undefined {
    const ownedSession = this.sessions.get(sessionId);
    return ownedSession?.ownerId === userId ? ownedSession.session : undefined;
  }

  stopSession(userId: string, sessionId: string): void {
    const session = this.getSession(userId, sessionId);
    if (!session) return;
    session.stop();
    this.sessions.delete(sessionId);
  }

  onApplicationShutdown(): void {
    for (const { session } of this.sessions.values()) session.stop();
    this.sessions.clear();
  }

  private async compileCpp(userId: string, sessionId: string): Promise<void> {
    const result = await this.sandbox.execute(userId, sessionId, {
      command: [
        '/usr/bin/g++',
        '-B/usr/bin',
        '-std=c++17',
        '-O2',
        '-o',
        'a.out',
        'source.cpp',
        '-lm',
      ],
      limits: COMPILE_LIMITS,
    });
    if (result.timedOut || result.exitCode !== 0) {
      throw new BadRequestException(this.compilerDiagnostic(result.stderr, result.timedOut));
    }
  }

  private executionCommand(language: string, limits: SandboxCommand['limits']): SandboxCommand {
    return {
      command: language === 'python' ? ['/usr/bin/python3', '-u', 'source.py'] : ['./a.out'],
      limits,
    };
  }

  private validateSource(code: string, language: string): void {
    if (language !== 'python' && language !== 'cpp') throw new Error('Unsupported language');
    if (Buffer.byteLength(code, 'utf8') > MAX_SOURCE_SIZE) {
      throw new Error(`Source code exceeds ${MAX_SOURCE_SIZE} bytes`);
    }
  }

  private compilerDiagnostic(stderr: string, timedOut: boolean): string {
    if (timedOut) return 'La compilación excedió el tiempo permitido.';

    const diagnostic = stderr.trim();
    if (!diagnostic) return 'La compilación de C++ falló sin diagnóstico.';

    return diagnostic.slice(0, MAX_COMPILER_DIAGNOSTIC_LENGTH);
  }

  private expireFinishedSession(sessionId: string): void {
    const expiration = setTimeout(
      () => this.sessions.delete(sessionId),
      FINISHED_SESSION_RETENTION_MS,
    );
    expiration.unref();
  }
}
