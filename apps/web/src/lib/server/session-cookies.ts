import 'server-only';

import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'session';
export const PLAYGROUND_SESSION_COOKIE_NAME = 'playground-session';

const PLAYGROUND_SESSION_MAX_AGE_SECONDS = 120;
const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;

export function isValidPlaygroundSessionId(sessionId: string): boolean {
  return UUID_PATTERN.test(sessionId);
}

function parseMaxAge(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 604_800;

  const value = Number.parseInt(match[1], 10);
  const multipliers = { d: 86_400, h: 3_600, m: 60, s: 1 } as const;
  return value * multipliers[match[2] as keyof typeof multipliers];
}

function secureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
}

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value;
}

export async function getPlaygroundSessionId(): Promise<string | undefined> {
  const sessionId = (await cookies()).get(PLAYGROUND_SESSION_COOKIE_NAME)?.value ?? '';
  return isValidPlaygroundSessionId(sessionId) ? sessionId : undefined;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    secureCookieOptions(parseMaxAge(process.env.JWT_EXPIRES_IN || '7d')),
  );
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', secureCookieOptions(0));
}

export function setPlaygroundSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set(
    PLAYGROUND_SESSION_COOKIE_NAME,
    sessionId,
    secureCookieOptions(PLAYGROUND_SESSION_MAX_AGE_SECONDS),
  );
}

export function clearPlaygroundSessionCookie(response: NextResponse): void {
  response.cookies.set(PLAYGROUND_SESSION_COOKIE_NAME, '', secureCookieOptions(0));
}
