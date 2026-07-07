import { cache } from 'react';
import { cookies } from 'next/headers';

export interface UserProfile {
  id: string;
  cmsUserId: number;
  cmsSource: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  role: string;
  xp: number;
  gems: number;
  level: number;
  streak: number;
}

const API_URL = process.env.API_URL || 'http://localhost:4000';

export const auth = cache(async (): Promise<UserProfile | null> => {
  const token = (await cookies()).get('session')?.value;

  if (!token) return null;

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.user as UserProfile;
});
