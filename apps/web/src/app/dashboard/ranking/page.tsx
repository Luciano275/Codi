import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { fetchRankingPage, UnauthorizedError } from '@/lib/server-api';
import { RankingClient } from '@/components/ranking/RankingClient';

export const metadata = { title: 'Ranking' };

export default async function RankingPage() {
  try {
    const user = await auth();
    if (!user) redirect('/api/auth/logout');
    const initialRanking = await fetchRankingPage();
    return (
      <RankingClient
        initialRanking={initialRanking}
        currentUserId={user.id}
        canManageRewards={user.role === 'TEACHER' || user.role === 'ADMIN'}
        canClaimPodiumRewards={user.role === 'STUDENT'}
      />
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect('/api/auth/logout');
    throw error;
  }
}
