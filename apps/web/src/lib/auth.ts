import { cache } from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import type { UserProfile } from './auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production',
);

export const auth = cache(async (): Promise<UserProfile | null> => {
  const token = (await cookies()).get('session')?.value;

  if (!token) return null;

  try {
    await jwtVerify(token, secret);
  } catch {
    return null;
  }

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.user as UserProfile;
});
