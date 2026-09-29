import { ReplaySubject, type Observable } from 'rxjs';
import { CloudflareSandboxClientService } from '../sandbox/cloudflare-sandbox-client.service';

const MAX_OUTPUT_BYTES = 1024 * 1024;

export interface PlaygroundEvent {
  type: 'stdout' | 'stderr' | 'exit' | 'timeout';
  data: string;
}

export class PlaygroundSession {
  private readonly events = new ReplaySubject<PlaygroundEvent>(100);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private outputBytes = 0;
  private finished = false;

  constructor(
    private readonly client: CloudflareSandboxClientService,
    private readonly userId: string,
    private readonly sandboxSessionId: string,
    private readonly terminalId: string,
    private readonly executionTimeoutMs: number,
    private readonly onDisposed: () => void,
  ) {}

  get ended(): boolean {
    return this.finished;
  }

  start(): void {
    this.timer = setTimeout(() => this.timeout(), this.executionTimeoutMs);
    void this.consumeOutput().catch((error: unknown) => this.fail(this.errorMessage(error)));
  }

  writeStdin(data: string): void {
    if (this.finished) return;
    void this.client
      .writeTerminal(this.userId, this.sandboxSessionId, this.terminalId, data)
      .catch((error: unknown) => this.fail(this.errorMessage(error)));
  }

  onEvent(): Observable<PlaygroundEvent> {
    return this.events.asObservable();
  }

  stop(): void {
    if (this.finished) return;
    this.finished = true;
    this.complete();
  }

  private async consumeOutput(): Promise<void> {
    for await (const event of this.client.streamTerminal(
      this.userId,
      this.sandboxSessionId,
      this.terminalId,
    )) {
      if (this.finished) return;
      if (event.type === 'data') {
        const output = Buffer.from(event.content, 'base64');
        this.outputBytes += output.byteLength;
        if (this.outputBytes > MAX_OUTPUT_BYTES) return this.fail('Output limit exceeded');
        this.events.next({ type: 'stdout', data: output.toString('utf8') });
      } else if (event.type === 'truncated') {
        this.events.next({ type: 'stderr', data: 'Terminal output was truncated' });
      } else if (event.type === 'error') {
        return this.fail(event.message);
      } else if (event.timedOut) {
        return this.timeout();
      } else {
        return this.finish(String(event.code));
      }
    }
  }

  private timeout(): void {
    if (this.finished) return;
    this.finished = true;
    this.events.next({
      type: 'timeout',
      data: `La ejecución excedió el límite de ${this.executionTimeoutMs / 1000} segundos.`,
    });
    this.complete();
  }

  private finish(exitCode: string): void {
    if (this.finished) return;
    this.finished = true;
    this.events.next({ type: 'exit', data: exitCode });
    this.complete();
  }

  private fail(message: string): void {
    if (this.finished) return;
    this.finished = true;
    this.events.next({ type: 'stderr', data: message });
    this.events.next({ type: 'exit', data: '1' });
    this.complete();
  }

  private complete(): void {
    if (this.timer) clearTimeout(this.timer);
    this.events.complete();
    void this.disposeRemote();
    this.onDisposed();
  }

  private async disposeRemote(): Promise<void> {
    await this.client
      .terminateTerminal(this.userId, this.sandboxSessionId, this.terminalId)
      .catch(() => undefined);
    await this.client.destroySession(this.userId, this.sandboxSessionId).catch(() => undefined);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
