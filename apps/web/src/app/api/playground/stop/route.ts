import { NextResponse } from 'next/server';
import { fetchBackendWithSession } from '@/lib/server/backend-api';
import { rejectCrossOriginMutation } from '@/lib/server/request-security';
import { clearPlaygroundSessionCookie, getPlaygroundSessionId } from '@/lib/server/session-cookies';

export async function POST(request: Request): Promise<Response> {
  const forbidden = rejectCrossOriginMutation(request);
  if (forbidden) return forbidden;

  const sessionId = await getPlaygroundSessionId();
  const backendResponse = sessionId
    ? await fetchBackendWithSession(`/api/playground/stop/${sessionId}`, { method: 'POST' })
    : null;
  const response = NextResponse.json(
    { ok: !backendResponse || backendResponse.ok },
    {
      status: backendResponse?.status ?? 200,
      headers: { 'cache-control': 'no-store' },
    },
  );
  clearPlaygroundSessionCookie(response);
  return response;
}
