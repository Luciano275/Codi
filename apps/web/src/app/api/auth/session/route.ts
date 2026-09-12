import { NextResponse } from 'next/server';
import { fetchBackendWithSession } from '@/lib/server/backend-api';
import { rejectCrossOriginMutation } from '@/lib/server/request-security';
import {
  clearPlaygroundSessionCookie,
  clearSessionCookie,
  getPlaygroundSessionId,
} from '@/lib/server/session-cookies';

export async function DELETE(request: Request): Promise<Response> {
  const forbidden = rejectCrossOriginMutation(request);
  if (forbidden) return forbidden;

  const playgroundSessionId = await getPlaygroundSessionId();
  if (playgroundSessionId) {
    await fetchBackendWithSession(`/api/playground/stop/${playgroundSessionId}`, {
      method: 'POST',
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  clearSessionCookie(response);
  clearPlaygroundSessionCookie(response);
  return response;
}
