import { NextResponse } from 'next/server';

function parseMaxAge(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 604800;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400, h: 3600, m: 60, s: 1 };
  return value * (multipliers[unit] || 86400);
}

const JWT_MAX_AGE = parseMaxAge(process.env.JWT_EXPIRES_IN || '7d');

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: JWT_MAX_AGE,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
