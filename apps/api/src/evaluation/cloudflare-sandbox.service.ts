import { Injectable } from '@nestjs/common';
import {
  type RunSandboxCommand,
  type SandboxCommand,
  type SandboxExecutionResponse,
  type SandboxFilename,
} from '@codi/evaluator-contract';
import { CloudflareSandboxClientService } from '../sandbox/cloudflare-sandbox-client.service';

export interface SandboxExecution extends Omit<SandboxExecutionResponse, 'metadata'> {
  metadata: ReadonlyMap<string, string>;
}

export interface SandboxSession {
  execute(command: SandboxCommand): Promise<SandboxExecution>;
  read(filename: string): Promise<Buffer>;
}

export interface SandboxRunCommand extends Omit<RunSandboxCommand, 'files'> {}

export interface SandboxRunResult {
  execution: SandboxExecution;
  stdoutFile?: Buffer;
  stderrFile?: Buffer;
}

export type SandboxRun = (
  files: ReadonlyMap<string, Buffer>,
  command: SandboxRunCommand,
) => Promise<SandboxRunResult>;

type SandboxRunHandler<T> = (run: SandboxRun) => Promise<T>;

@Injectable()
export class CloudflareSandboxService {
  constructor(private readonly client: CloudflareSandboxClientService) {}

  async use<T>(
    userId: string,
    files: ReadonlyMap<string, Buffer>,
    operation: (session: SandboxSession) => Promise<T>,
  ): Promise<T> {
    const sessionId = await this.client.createSession(userId, files);

    try {
      return await operation(this.createSession(userId, sessionId));
    } finally {
      await this.client.destroySession(userId, sessionId).catch(() => undefined);
    }
  }

  async useReusable<T>(
    userId: string,
    baseFiles: ReadonlyMap<string, Buffer>,
    operation: SandboxRunHandler<T>,
  ): Promise<T> {
    const sessionId = await this.client.createSession(userId, baseFiles);

    try {
      return await operation((files, command) => this.run(userId, sessionId, files, command));
    } finally {
      await this.client.destroySession(userId, sessionId).catch(() => undefined);
    }
  }

  private async run(
    userId: string,
    sessionId: string,
    files: ReadonlyMap<string, Buffer>,
    command: SandboxRunCommand,
  ): Promise<SandboxRunResult> {
    const response = await this.client.run(userId, sessionId, {
      ...command,
      files: [...files].map(([name, content]) => ({
        name: name as SandboxFilename,
        content: content.toString('base64'),
      })),
    });
    const { stdoutFile, stderrFile, ...execution } = response;
    return {
      execution: toSandboxExecution(execution),
      stdoutFile: stdoutFile ? Buffer.from(stdoutFile, 'base64') : undefined,
      stderrFile: stderrFile ? Buffer.from(stderrFile, 'base64') : undefined,
    };
  }

  private createSession(userId: string, sessionId: string): SandboxSession {
    return {
      execute: (command) => this.execute(userId, sessionId, command),
      read: (filename) => this.read(userId, sessionId, filename),
    };
  }

  private async execute(
    userId: string,
    sessionId: string,
    command: SandboxCommand,
  ): Promise<SandboxExecution> {
    const execution = await this.client.execute(userId, sessionId, command);
    return toSandboxExecution(execution);
  }

  private async read(userId: string, sessionId: string, filename: string): Promise<Buffer> {
    return this.client.readFile(userId, sessionId, filename);
  }
}

function toSandboxExecution(execution: SandboxExecutionResponse): SandboxExecution {
  return { ...execution, metadata: new Map(Object.entries(execution.metadata)) };
}
