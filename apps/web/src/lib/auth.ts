import 'server-only';

import { cache } from 'react';
import { fetchBackendWithSession } from './server/backend-api';

export interface UserProfile {
  id: string;
  cmsUserId: number;
  cmsSource: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  profileBanner: string;
  role: string;
  xp: number;
  gems: number;
  level: number;
  streak: number;
}

export const auth = cache(async (): Promise<UserProfile | null> => {
  const res = await fetchBackendWithSession('/api/auth/me');

  if (!res.ok) return null;

  const data = await res.json();
  return data.user as UserProfile;
});
