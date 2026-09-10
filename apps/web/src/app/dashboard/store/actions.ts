'use server';

import { revalidatePath } from 'next/cache';
import type {
  AdminReward,
  AdminRewardRedemptionsPage,
  RewardEditorInput,
  RewardsStoreData,
} from '@codi/types';
import { auth } from '@/lib/auth';
import { serverFetch } from '@/lib/server-api';

const STORE_PATH = '/dashboard/store';

async function requireAuthenticatedUser() {
  const user = await auth();
  if (!user) throw new Error('Tu sesión expiró. Volvé a iniciar sesión.');
  return user;
}

async function requireCatalogManager() {
  const user = await requireAuthenticatedUser();
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    throw new Error('No tenés permisos para administrar la tienda.');
  }
}

export async function redeemReward(input: { rewardId: string; trimester?: number }) {
  await requireAuthenticatedUser();
  await serverFetch(`/api/rewards/${input.rewardId}/redeem`, {
    method: 'POST',
    body: JSON.stringify({ requestId: crypto.randomUUID(), trimester: input.trimester }),
  });
  revalidatePath(STORE_PATH);
  return serverFetch<RewardsStoreData>('/api/rewards/store');
}

export async function createReward(input: RewardEditorInput) {
  await requireCatalogManager();
  const reward = await serverFetch<AdminReward>('/api/rewards/admin', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  revalidatePath(STORE_PATH);
  return reward;
}

export async function updateReward(input: RewardEditorInput & { id: string }) {
  await requireCatalogManager();
  const { id, ...payload } = input;
  const reward = await serverFetch<AdminReward>(`/api/rewards/admin/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  revalidatePath(STORE_PATH);
  return reward;
}

export async function deleteReward(id: string) {
  await requireCatalogManager();
  await serverFetch<{ removed: true }>(`/api/rewards/admin/${id}`, { method: 'DELETE' });
  revalidatePath(STORE_PATH);
  return id;
}

export async function getAdminRewardRedemptions(page: number) {
  await requireCatalogManager();
  return serverFetch<AdminRewardRedemptionsPage>(`/api/rewards/admin/redemptions?page=${page}`);
}

export async function revokeRewardRedemption(id: string) {
  await requireCatalogManager();
  const result = await serverFetch<{ revoked: true; id: string; userId: string }>(
    `/api/rewards/admin/redemptions/${id}`,
    { method: 'DELETE' },
  );
  revalidatePath(STORE_PATH);
  revalidatePath(`/dashboard/players/${result.userId}`);
  return result;
}
