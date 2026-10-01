import { NextResponse } from 'next/server';
import { clearPlaygroundSessionCookie, clearSessionCookie } from '@/lib/server/session-cookies';

export async function GET(request: Request): Promise<Response> {
  const response = NextResponse.redirect(new URL('/', request.url), {
    status: 303,
    headers: { 'cache-control': 'no-store' },
  });
  clearSessionCookie(response);
  clearPlaygroundSessionCookie(response);
  return response;
}
