import { getSandbox, type Sandbox, type TerminalOutputEvent } from '@cloudflare/sandbox';
import type {
  CreateSandboxSession,
  CreateSandboxTerminal,
  RunSandboxCommand,
  RunSandboxResponse,
  SandboxCommand,
  SandboxExecutionResponse,
  SandboxFilename,
  SandboxTerminalEvent,
} from '@codi/evaluator-contract';
import { assertCommandAllowed } from './command-policy';
import { buildRestrictedShellCommand } from './process-command';

const WORKSPACE = '/workspace/evaluation';
const CONTAINER_NAME_PREFIX = 'codi-evaluator-2';
const MAX_DIAGNOSTIC_BYTES = 1024 * 1024;

type SandboxClient = ReturnType<typeof getSandbox<Sandbox>>;

export class SandboxSessionService {
  constructor(
    private readonly namespace: DurableObjectNamespace<Sandbox>,
    private readonly userId: string,
  ) {}

  async create(request: CreateSandboxSession): Promise<string> {
    const sessionId = crypto.randomUUID();
    const sandbox = this.get();
    const workspace = this.workspaceFor(sessionId);
    try {
      await sandbox.mkdir(workspace, { recursive: true });
      await Promise.all(
        request.files.map((file) =>
          sandbox.writeFile(`${workspace}/${file.name}`, file.content, { encoding: 'base64' }),
        ),
      );
      if (request.files.some((file) => file.name === 'submission')) {
        await this.runUtility(sandbox, ['/bin/chmod', '0755', `${workspace}/submission`]);
      }
      await this.runUtility(sandbox, ['/bin/chown', '-R', 'evaluator:evaluator', workspace]);
      return sessionId;
    } catch (error) {
      await this.cleanupWorkspace(sessionId).catch(() => undefined);
      throw error;
    }
  }

  async execute(sessionId: string, request: SandboxCommand): Promise<SandboxExecutionResponse> {
    assertCommandAllowed(request);
    const startedAt = Date.now();
    const timeout = Math.ceil(request.limits.wallSeconds * 1000);
    const sandbox = this.get();
    const process = await sandbox.exec(
      ['/bin/bash', '-c', buildRestrictedShellCommand(request, { runAs: 'evaluator' })],
      { cwd: this.workspaceFor(sessionId), timeout },
    );
    const output = await process.output({
      encoding: 'utf8',
      maxBytes: MAX_DIAGNOSTIC_BYTES,
      timeout: timeout + 15_000,
    });

    return {
      exitCode: output.exitCode,
      signal: output.signal ?? null,
      stdout: output.stdout,
      stderr: output.stderr,
      timedOut: output.timedOut,
      metadata: createMetadata(output, Date.now() - startedAt),
    };
  }

  async read(sessionId: string, filename: SandboxFilename): Promise<string> {
    const file = await this.get().readFile(`${this.workspaceFor(sessionId)}/${filename}`, {
      encoding: 'base64',
    });
    return file.content;
  }

  async run(sessionId: string, request: RunSandboxCommand): Promise<RunSandboxResponse> {
    assertCommandAllowed(request);
    const sandbox = this.get();
    const boxPath = `${this.workspaceFor(sessionId)}/box-${crypto.randomUUID()}`;
    await sandbox.mkdir(boxPath, { recursive: true });

    try {
      await Promise.all(
        request.files.map((file) =>
          sandbox.writeFile(`${boxPath}/${file.name}`, file.content, { encoding: 'base64' }),
        ),
      );
      if (request.files.some((file) => file.name === 'submission')) {
        await this.runUtility(sandbox, ['/bin/chmod', '0755', `${boxPath}/submission`]);
      }

      const startedAt = Date.now();
      const timeout = Math.ceil(request.limits.wallSeconds * 1000);
      const process = await sandbox.exec(
        ['/bin/bash', '-c', buildRestrictedShellCommand(request)],
        { cwd: boxPath, timeout },
      );
      const output = await process.output({
        encoding: 'utf8',
        maxBytes: MAX_DIAGNOSTIC_BYTES,
        timeout: timeout + 15_000,
      });

      const [stdoutFile, stderrFile] = await Promise.all([
        request.stdout ? this.readBase64(sandbox, boxPath, request.stdout) : null,
        request.stderr ? this.readBase64(sandbox, boxPath, request.stderr) : null,
      ]);

      return {
        exitCode: output.exitCode,
        signal: output.signal ?? null,
        stdout: output.stdout,
        stderr: output.stderr,
        timedOut: output.timedOut,
        metadata: createMetadata(output, Date.now() - startedAt),
        box: boxPath,
        stdoutFile: stdoutFile ?? undefined,
        stderrFile: stderrFile ?? undefined,
      };
    } finally {
      await this.deleteBox(sandbox, boxPath);
    }
  }

  destroy(sessionId: string): Promise<void> {
    return this.cleanupWorkspace(sessionId);
  }

  async createTerminal(sessionId: string, request: CreateSandboxTerminal): Promise<string> {
    assertCommandAllowed(request);
    const terminal = await this.get().createTerminal({
      command: [
        '/bin/bash',
        '-c',
        buildRestrictedShellCommand(request, { disableInputEcho: true }),
      ],
      cwd: this.workspaceFor(sessionId),
      cols: 120,
      rows: 40,
      bufferSize: 1024 * 1024,
    });
    return terminal.id;
  }

  async terminalOutput(sessionId: string, terminalId: string): Promise<ReadableStream<Uint8Array>> {
    const terminal = await this.getTerminal(sessionId, terminalId);
    const output = await terminal.output({ replay: true, follow: true });
    return output.pipeThrough(
      new TransformStream<TerminalOutputEvent, Uint8Array>({
        transform(event, controller) {
          controller.enqueue(
            new TextEncoder().encode(`${JSON.stringify(toTerminalEvent(event))}\n`),
          );
        },
      }),
    );
  }

  async writeTerminal(sessionId: string, terminalId: string, data: string): Promise<void> {
    const terminal = await this.getTerminal(sessionId, terminalId);
    await terminal.write(new TextEncoder().encode(`${data}\n`));
  }

  async terminateTerminal(sessionId: string, terminalId: string): Promise<void> {
    const terminal = await this.get().getTerminal(terminalId);
    if (terminal) await terminal.terminate();
  }

  private get(): SandboxClient {
    return getSandbox(this.namespace, `${CONTAINER_NAME_PREFIX}-${this.userId}`, {
      containerTimeouts: { instanceGetTimeoutMS: 180_000, portReadyTimeoutMS: 180_000 },
    });
  }

  private workspaceFor(sessionId: string): string {
    return `${WORKSPACE}/${sessionId}`;
  }

  private async runUtility(
    sandbox: SandboxClient,
    command: readonly [string, ...string[]],
  ): Promise<void> {
    const process = await sandbox.exec(command, { timeout: 10_000 });
    const output = await process.output({ encoding: 'utf8', timeout: 15_000 });
    if (output.exitCode !== 0) throw new Error(output.stderr || 'Sandbox utility failed');
  }

  private async getTerminal(sessionId: string, terminalId: string) {
    const terminal = await this.get().getTerminal(terminalId);
    if (!terminal) throw new Error('Sandbox terminal was not found');
    return terminal;
  }

  private async cleanupWorkspace(sessionId: string): Promise<void> {
    const workspace = this.workspaceFor(sessionId);
    await this.get()
      .exec(['/bin/rm', '-rf', '--', workspace], { timeout: 15_000 })
      .then((process) => process.output({ encoding: 'utf8', timeout: 15_000 }))
      .catch(() => {
        console.error(JSON.stringify({ event: 'evaluator.session.cleanup.failed', sessionId }));
      });
  }

  private async readBase64(
    sandbox: SandboxClient,
    directory: string,
    filename: SandboxFilename,
  ): Promise<string | null> {
    const file = await sandbox.readFile(`${directory}/${filename}`, { encoding: 'base64' });
    if (!file.success) return null;
    return file.content;
  }

  private async deleteBox(sandbox: SandboxClient, boxPath: string): Promise<void> {
    await sandbox.exec(['/bin/rm', '-rf', '--', boxPath], { timeout: 15_000 }).catch(() => {
      console.error(JSON.stringify({ event: 'evaluator.box.cleanup.failed', box: boxPath }));
    });
  }
}

function createMetadata(
  output: { exitCode: number; signal?: number; timedOut: boolean; truncated: boolean },
  wallMs: number,
): Record<string, string> {
  const metadata: Record<string, string> = { 'time-wall': (wallMs / 1000).toString() };
  if (output.timedOut) metadata.status = 'TO';
  else if (output.signal !== undefined) {
    metadata.status = 'SG';
    metadata.exitsig = String(output.signal);
    if (output.signal === 9) metadata['cg-oom-killed'] = '1';
  } else if (output.exitCode !== 0) metadata.status = 'RE';
  if (output.truncated) metadata.message = 'Sandbox diagnostics were truncated';
  return metadata;
}

function toTerminalEvent(event: TerminalOutputEvent): SandboxTerminalEvent {
  if (event.type === 'data') return { type: 'data', content: bytesToBase64(event.data) };
  if (event.type === 'truncated') return { type: 'truncated' };
  if (event.state === 'error') return { type: 'error', message: event.error.message };
  return {
    type: 'exit',
    code: event.exit.code,
    signal: event.exit.signal ?? null,
    timedOut: event.exit.timedOut,
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
  }
  return btoa(binary);
}
