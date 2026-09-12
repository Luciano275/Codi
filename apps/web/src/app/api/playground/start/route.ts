import { NextResponse } from 'next/server';
import { fetchBackendWithSession } from '@/lib/server/backend-api';
import { rejectCrossOriginMutation } from '@/lib/server/request-security';
import {
  getPlaygroundSessionId,
  isValidPlaygroundSessionId,
  setPlaygroundSessionCookie,
} from '@/lib/server/session-cookies';

export async function POST(request: Request): Promise<Response> {
  const forbidden = rejectCrossOriginMutation(request);
  if (forbidden) return forbidden;

  const previousSessionId = await getPlaygroundSessionId();
  if (previousSessionId) {
    await fetchBackendWithSession(`/api/playground/stop/${previousSessionId}`, {
      method: 'POST',
    }).catch(() => undefined);
  }

  const backendResponse = await fetchBackendWithSession('/api/playground/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
  });
  const payload = (await backendResponse.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!backendResponse.ok) {
    return NextResponse.json(payload ?? {}, { status: backendResponse.status });
  }

  const sessionId = payload?.sessionId;
  if (typeof sessionId !== 'string' || !isValidPlaygroundSessionId(sessionId)) {
    return NextResponse.json({ message: 'Playground service failed' }, { status: 502 });
  }

  const response = NextResponse.json(
    { ok: true },
    { status: 201, headers: { 'cache-control': 'no-store' } },
  );
  setPlaygroundSessionCookie(response, sessionId);
  return response;
}
