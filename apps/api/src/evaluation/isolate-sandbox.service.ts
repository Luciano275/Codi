import { Injectable } from '@nestjs/common';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { BoxLeasePool } from '../sandbox/box-lease-pool.service';
import { evaluationSettings } from './evaluation.constants';
import { runProcess, type ProcessResult } from './process-runner';

export interface SandboxLimits {
  timeSeconds: number;
  wallSeconds: number;
  memoryKb: number;
  outputKb: number;
  processes: number;
}

export interface SandboxCommand {
  command: string[];
  limits: SandboxLimits;
  stdin?: string;
  stdout?: string;
  stderr?: string;
}

export interface SandboxExecution extends ProcessResult {
  metadata: ReadonlyMap<string, string>;
}

export interface IsolateSession {
  readonly boxRoot: string;
  execute(command: SandboxCommand): Promise<SandboxExecution>;
  read(filename: string): Promise<Buffer>;
}

@Injectable()
export class IsolateSandboxService {
  constructor(private readonly leases: BoxLeasePool) {}

  async use<T>(
    files: ReadonlyMap<string, Buffer>,
    operation: (session: IsolateSession) => Promise<T>,
  ) {
    const range = evaluationSettings.boxRange;
    const lease = this.leases.acquire(range.first, range.last);
    const metadataDirectory = await mkdtemp(join(tmpdir(), 'codi-eval-meta-'));
    const boxRoot = `/var/local/lib/isolate/${lease.boxId}/box`;

    try {
      await this.initialize(lease.boxId);
      await Promise.all(
        [...files].map(([filename, content]) => writeFile(join(boxRoot, filename), content)),
      );
      if (files.has('submission')) await chmod(join(boxRoot, 'submission'), 0o755);
      const session = this.createSession(lease.boxId, boxRoot, metadataDirectory);
      return await operation(session);
    } finally {
      await this.cleanup(lease.boxId);
      await rm(metadataDirectory, { recursive: true, force: true });
      lease.release();
    }
  }

  private createSession(boxId: number, boxRoot: string, metadataDirectory: string): IsolateSession {
    let executionNumber = 0;
    return {
      boxRoot,
      execute: async (command) => {
        const metadataPath = join(metadataDirectory, `meta-${executionNumber++}`);
        const result = await runProcess(
          evaluationSettings.isolateBin,
          this.buildRunArguments(boxId, metadataPath, command),
          Math.ceil(command.limits.wallSeconds * 1000) + 15_000,
        );
        return { ...result, metadata: await this.readMetadata(metadataPath) };
      },
      read: (filename) => readFile(join(boxRoot, filename)),
    };
  }

  private buildRunArguments(
    boxId: number,
    metadataPath: string,
    request: SandboxCommand,
  ): string[] {
    const { limits } = request;
    const args = [
      `--box-id=${boxId}`,
      '--run',
      '--cg',
      `--time=${limits.timeSeconds}`,
      `--wall-time=${limits.wallSeconds}`,
      `--cg-mem=${Math.ceil(limits.memoryKb)}`,
      `--fsize=${limits.outputKb}`,
      `--processes=${limits.processes}`,
      `--meta=${metadataPath}`,
    ];
    if (request.stdin) args.push(`--stdin=${request.stdin}`);
    if (request.stdout) args.push(`--stdout=${request.stdout}`);
    if (request.stderr) args.push(`--stderr=${request.stderr}`);
    return [...args, '--', ...request.command];
  }

  private async initialize(boxId: number): Promise<void> {
    const result = await runProcess(
      evaluationSettings.isolateBin,
      [`--box-id=${boxId}`, '--init', '--cg'],
      10_000,
    );
    if (result.exitCode !== 0) {
      throw new Error(`isolate init failed: ${result.stderr || result.stdout}`);
    }
  }

  private async cleanup(boxId: number): Promise<void> {
    await runProcess(
      evaluationSettings.isolateBin,
      [`--box-id=${boxId}`, '--cleanup', '--cg'],
      10_000,
    ).catch(() => undefined);
  }

  private async readMetadata(path: string): Promise<ReadonlyMap<string, string>> {
    const metadata = new Map<string, string>();
    const content = await readFile(path, 'utf8').catch(() => '');
    for (const line of content.split('\n')) {
      const separator = line.indexOf(':');
      if (separator > 0) metadata.set(line.slice(0, separator), line.slice(separator + 1));
    }
    return metadata;
  }
}
