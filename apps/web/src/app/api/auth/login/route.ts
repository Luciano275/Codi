import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/server/backend-api';
import { rejectCrossOriginMutation } from '@/lib/server/request-security';
import { setSessionCookie } from '@/lib/server/session-cookies';

interface LoginPayload {
  token?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  const forbidden = rejectCrossOriginMutation(request);
  if (forbidden) return forbidden;

  const credentials = await request.json().catch(() => null);
  if (!isValidCredentials(credentials)) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
  }

  const backendResponse = await fetchBackend('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const payload = (await backendResponse.json().catch(() => null)) as LoginPayload | null;

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: readErrorMessage(payload, backendResponse.statusText) },
      { status: backendResponse.status },
    );
  }
  if (typeof payload?.token !== 'string' || !payload.token) {
    return NextResponse.json({ message: 'Authentication service failed' }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  setSessionCookie(response, payload.token);
  return response;
}

function isValidCredentials(value: unknown): value is { username: string; password: string } {
  if (!value || typeof value !== 'object') return false;
  const credentials = value as Record<string, unknown>;
  return (
    typeof credentials.username === 'string' &&
    credentials.username.length >= 1 &&
    credentials.username.length <= 255 &&
    typeof credentials.password === 'string' &&
    credentials.password.length >= 1 &&
    credentials.password.length <= 255
  );
}

function readErrorMessage(payload: LoginPayload | null, fallback: string): string {
  const message = (payload as { message?: unknown } | null)?.message;
  return typeof message === 'string' ? message : fallback || 'Authentication failed';
}
