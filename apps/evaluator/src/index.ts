import { ContainerProxy, Sandbox } from '@cloudflare/sandbox';
import {
  createSandboxSessionSchema,
  createSandboxTerminalSchema,
  runSandboxCommandSchema,
  sandboxCommandSchema,
  sandboxFilenameSchema,
  sandboxTerminalInputSchema,
} from '@codi/evaluator-contract';
import { authenticate } from './http/authentication';
import { HttpError, parseJsonBody } from './http/request-body';
import { SandboxSessionService } from './sandbox/sandbox-session.service';

export { ContainerProxy };

export class EvaluatorSandbox extends Sandbox {
  enableInternet = false;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'codi-evaluator' });
    }

    const authFailure = await authenticate(request, env.WORKER_EVALUATOR_TOKEN);
    if (authFailure) return authFailure;

    try {
      return await route(request, env, url);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : 'Evaluator operation failed';
      console.error(
        JSON.stringify({
          event: 'evaluator.request.failed',
          path: url.pathname,
          error: String(error),
        }),
      );
      return Response.json({ error: message }, { status });
    }
  },
} satisfies ExportedHandler<Env>;

const USER_ID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;

async function route(request: Request, env: Env, url: URL): Promise<Response> {
  const userId = resolveUserId(request);
  const sessions = new SandboxSessionService(env.EVALUATOR_SANDBOX, userId);
  if (request.method === 'POST' && url.pathname === '/v1/sessions') {
    const body = await parseJsonBody(request, createSandboxSessionSchema);
    return Response.json({ sessionId: await sessions.create(body) }, { status: 201 });
  }

  const match = url.pathname.match(
    /^\/v1\/sessions\/([0-9a-f-]{36})(?:\/(execute|run|files|terminals)(?:\/([^/]+))?(?:\/(output|input))?)?$/,
  );
  if (!match) return Response.json({ error: 'Not found' }, { status: 404 });
  const [, sessionId, action, resourceId, terminalAction] = match;

  if (request.method === 'DELETE' && !action) {
    await sessions.destroy(sessionId);
    return new Response(null, { status: 204 });
  }
  if (request.method === 'POST' && action === 'execute' && !resourceId) {
    const command = await parseJsonBody(request, sandboxCommandSchema);
    return Response.json(await sessions.execute(sessionId, command));
  }
  if (request.method === 'POST' && action === 'run' && !resourceId) {
    const command = await parseJsonBody(request, runSandboxCommandSchema);
    return Response.json(await sessions.run(sessionId, command));
  }
  if (request.method === 'GET' && action === 'files' && resourceId) {
    const parsedFilename = sandboxFilenameSchema.safeParse(resourceId);
    if (!parsedFilename.success) throw new HttpError(400, 'Invalid sandbox filename');
    return Response.json({ content: await sessions.read(sessionId, parsedFilename.data) });
  }
  if (request.method === 'POST' && action === 'terminals' && !resourceId) {
    const terminal = await parseJsonBody(request, createSandboxTerminalSchema);
    return Response.json(
      { terminalId: await sessions.createTerminal(sessionId, terminal) },
      { status: 201 },
    );
  }
  if (
    request.method === 'GET' &&
    action === 'terminals' &&
    resourceId &&
    terminalAction === 'output'
  ) {
    return new Response(await sessions.terminalOutput(sessionId, resourceId), {
      headers: { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' },
    });
  }
  if (
    request.method === 'POST' &&
    action === 'terminals' &&
    resourceId &&
    terminalAction === 'input'
  ) {
    const input = await parseJsonBody(request, sandboxTerminalInputSchema);
    await sessions.writeTerminal(sessionId, resourceId, input.data);
    return new Response(null, { status: 204 });
  }
  if (request.method === 'DELETE' && action === 'terminals' && resourceId && !terminalAction) {
    await sessions.terminateTerminal(sessionId, resourceId);
    return new Response(null, { status: 204 });
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

function resolveUserId(request: Request): string {
  const userId = request.headers.get('x-codi-user-id')?.trim().toLowerCase() ?? '';
  if (!USER_ID_PATTERN.test(userId)) {
    throw new HttpError(400, 'Missing or invalid x-codi-user-id header');
  }
  return userId;
}
