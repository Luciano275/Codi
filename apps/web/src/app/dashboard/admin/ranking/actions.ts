'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { serverFetch } from '@/lib/server-api';
import type { RankingReward } from '@/lib/server-api';

export async function saveRankingRewards(rewards: RankingReward[]) {
  const user = await auth();
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    throw new Error('No tenés permisos para configurar las recompensas del ranking.');
  }
  const settings = await serverFetch<RankingReward[]>('/api/ranking/rewards/admin', {
    method: 'PUT',
    body: JSON.stringify({ rewards }),
  });
  revalidatePath('/dashboard/ranking');
  revalidatePath('/dashboard/admin/ranking');
  return settings;
}
