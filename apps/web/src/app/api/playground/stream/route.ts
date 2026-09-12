import { fetchBackendWithSession } from '@/lib/server/backend-api';
import { getPlaygroundSessionId } from '@/lib/server/session-cookies';

export async function GET(): Promise<Response> {
  const sessionId = await getPlaygroundSessionId();
  if (!sessionId) return Response.json({ message: 'Session not found' }, { status: 404 });

  const backendResponse = await fetchBackendWithSession(`/api/playground/stream/${sessionId}`, {
    headers: { accept: 'text/event-stream' },
  });
  if (!backendResponse.ok || !backendResponse.body) {
    return Response.json({ message: 'Session not found' }, { status: backendResponse.status });
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: {
      'cache-control': 'no-cache, no-store',
      connection: 'keep-alive',
      'content-type': 'text/event-stream',
      'x-accel-buffering': 'no',
    },
  });
}
