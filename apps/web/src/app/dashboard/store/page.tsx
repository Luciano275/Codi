import { redirect } from 'next/navigation';
import type { AdminReward, AdminRewardRedemptionsPage, RewardsStoreData } from '@codi/types';
import { auth } from '@/lib/auth';
import { UnauthorizedError, serverFetch } from '@/lib/server-api';
import StoreClient from './store-client';

export const metadata = { title: 'Tienda de canjes' };

export default async function StorePage() {
  try {
    const user = await auth();
    const canManageCatalog = user?.role === 'TEACHER' || user?.role === 'ADMIN';
    const [initialStore, initialCatalog, initialAdminRedemptions] = await Promise.all([
      serverFetch<RewardsStoreData>('/api/rewards/store'),
      canManageCatalog ? serverFetch<AdminReward[]>('/api/rewards/admin') : Promise.resolve([]),
      canManageCatalog
        ? serverFetch<AdminRewardRedemptionsPage>('/api/rewards/admin/redemptions?page=1')
        : Promise.resolve(null),
    ]);
    return (
      <StoreClient
        initialCatalog={initialCatalog}
        initialAdminRedemptions={initialAdminRedemptions}
        initialStore={initialStore}
        canManageCatalog={canManageCatalog}
      />
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect('/api/auth/logout');
    throw error;
  }
}
