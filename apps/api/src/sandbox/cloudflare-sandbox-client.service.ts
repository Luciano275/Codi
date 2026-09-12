import { Injectable } from '@nestjs/common';
import {
  createSandboxSessionSchema,
  createSandboxTerminalSchema,
  runSandboxCommandSchema,
  runSandboxResponseSchema,
  sandboxCommandSchema,
  sandboxExecutionSchema,
  sandboxFileSchema,
  sandboxFilenameSchema,
  sandboxSessionSchema,
  sandboxTerminalEventSchema,
  sandboxTerminalInputSchema,
  sandboxTerminalSchema,
  type RunSandboxCommand,
  type RunSandboxResponse,
  type SandboxCommand,
  type SandboxExecutionResponse,
  type SandboxTerminalEvent,
} from '@codi/evaluator-contract';
import { sandboxSettings } from './sandbox.constants';

@Injectable()
export class CloudflareSandboxClientService {
  async createSession(userId: string, files: ReadonlyMap<string, Buffer>): Promise<string> {
    const payload = createSandboxSessionSchema.parse({
      files: [...files].map(([name, content]) => ({ name, content: content.toString('base64') })),
    });
    const response = await this.request(userId, '/v1/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return sandboxSessionSchema.parse(await response.json()).sessionId;
  }

  async execute(
    userId: string,
    sessionId: string,
    command: SandboxCommand,
  ): Promise<SandboxExecutionResponse> {
    const payload = sandboxCommandSchema.parse(command);
    const timeout = Math.max(
      sandboxSettings.serviceRequestTimeoutMs,
      Math.ceil(payload.limits.wallSeconds * 1000) + 15_000,
    );
    const response = await this.request(
      userId,
      `/v1/sessions/${sessionId}/execute`,
      { method: 'POST', body: JSON.stringify(payload) },
      timeout,
    );
    return sandboxExecutionSchema.parse(await response.json());
  }

  async run(
    userId: string,
    sessionId: string,
    command: RunSandboxCommand,
  ): Promise<RunSandboxResponse> {
    const payload = runSandboxCommandSchema.parse(command);
    const timeout = Math.max(
      sandboxSettings.serviceRequestTimeoutMs,
      Math.ceil(payload.limits.wallSeconds * 1000) + 15_000,
    );
    const response = await this.request(
      userId,
      `/v1/sessions/${sessionId}/run`,
      { method: 'POST', body: JSON.stringify(payload) },
      timeout,
    );
    return runSandboxResponseSchema.parse(await response.json());
  }

  async readFile(userId: string, sessionId: string, filename: string): Promise<Buffer> {
    const safeFilename = sandboxFilenameSchema.parse(filename);
    const response = await this.request(
      userId,
      `/v1/sessions/${sessionId}/files/${encodeURIComponent(safeFilename)}`,
      { method: 'GET' },
    );
    const file = sandboxFileSchema.parse(await response.json());
    return Buffer.from(file.content, 'base64');
  }

  async createTerminal(
    userId: string,
    sessionId: string,
    command: SandboxCommand,
  ): Promise<string> {
    const payload = createSandboxTerminalSchema.parse(command);
    const response = await this.request(userId, `/v1/sessions/${sessionId}/terminals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return sandboxTerminalSchema.parse(await response.json()).terminalId;
  }

  async *streamTerminal(
    userId: string,
    sessionId: string,
    terminalId: string,
  ): AsyncGenerator<SandboxTerminalEvent> {
    const response = await this.request(
      userId,
      `/v1/sessions/${sessionId}/terminals/${encodeURIComponent(terminalId)}/output`,
      { method: 'GET' },
      75_000,
    );
    if (!response.body) throw new Error('Evaluator returned an empty terminal stream');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        for (const line of lines) {
          if (line) yield sandboxTerminalEventSchema.parse(JSON.parse(line));
        }
        if (done) break;
      }
      if (pending) yield sandboxTerminalEventSchema.parse(JSON.parse(pending));
    } finally {
      await reader.cancel().catch(() => undefined);
    }
  }

  async writeTerminal(
    userId: string,
    sessionId: string,
    terminalId: string,
    data: string,
  ): Promise<void> {
    const payload = sandboxTerminalInputSchema.parse({ data });
    await this.request(
      userId,
      `/v1/sessions/${sessionId}/terminals/${encodeURIComponent(terminalId)}/input`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
  }

  async terminateTerminal(userId: string, sessionId: string, terminalId: string): Promise<void> {
    await this.request(
      userId,
      `/v1/sessions/${sessionId}/terminals/${encodeURIComponent(terminalId)}`,
      { method: 'DELETE' },
      15_000,
    );
  }

  async destroySession(userId: string, sessionId: string): Promise<void> {
    await this.request(userId, `/v1/sessions/${sessionId}`, { method: 'DELETE' }, 15_000);
  }

  private async request(
    userId: string,
    path: string,
    init: RequestInit,
    timeout = sandboxSettings.serviceRequestTimeoutMs,
  ) {
    if (!sandboxSettings.serviceToken) throw new Error('WORKER_EVALUATOR_TOKEN is not configured');

    const response = await fetch(`${sandboxSettings.serviceUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      signal: AbortSignal.timeout(timeout),
      headers: {
        authorization: `Bearer ${sandboxSettings.serviceToken}`,
        'x-codi-user-id': userId,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
    });
    if (response.ok) return response;

    const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
    const message = typeof body?.error === 'string' ? body.error : response.statusText;
    throw new Error(`Evaluator request failed (${response.status}): ${message}`);
  }
}
