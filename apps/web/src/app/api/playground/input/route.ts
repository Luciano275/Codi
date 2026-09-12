import { fetchBackendWithSession } from '@/lib/server/backend-api';
import { rejectCrossOriginMutation } from '@/lib/server/request-security';
import { getPlaygroundSessionId } from '@/lib/server/session-cookies';

export async function POST(request: Request): Promise<Response> {
  const forbidden = rejectCrossOriginMutation(request);
  if (forbidden) return forbidden;

  const sessionId = await getPlaygroundSessionId();
  if (!sessionId) return Response.json({ message: 'Session not found' }, { status: 404 });

  const backendResponse = await fetchBackendWithSession(`/api/playground/input/${sessionId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
  });
  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: { 'content-type': backendResponse.headers.get('content-type') || 'application/json' },
  });
}
