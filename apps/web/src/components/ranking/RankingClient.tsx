'use client';

import { startTransition, useCallback, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { RankingPageData } from '@/lib/server-api';
import { CurrentPositionCard } from './CurrentPositionCard';
import { MotivationCard } from './MotivationCard';
import { Podium } from './Podium';
import { RankingFilters } from './RankingFilters';
import { RankingHeader } from './RankingHeader';
import { RankingRewards } from './RankingRewards';
import { RankingTable } from './RankingTable';
import { RewardRedemptionCelebration } from '@/components/ui/RewardRedemptionCelebration';
import styles from './ranking.module.css';
import type { PodiumRewardClaim, RankingScope } from './types';

interface RankingClientProps {
  initialRanking: RankingPageData;
  currentUserId: string;
  canManageRewards: boolean;
  canClaimPodiumRewards: boolean;
}

async function fetchRankingPage(page: number, scope: RankingScope) {
  const params = new URLSearchParams({ page: String(page), period: 'ALL_TIME', scope });
  const response = await fetch(`/api/proxy/api/ranking/global?${params}`);
  if (!response.ok) throw new Error('No pudimos actualizar el ranking.');
  return response.json() as Promise<RankingPageData>;
}

export function RankingClient({
  initialRanking,
  currentUserId,
  canManageRewards,
  canClaimPodiumRewards,
}: RankingClientProps) {
  const [scope, setScope] = useState<RankingScope>('GLOBAL');
  const [page, setPage] = useState(1);
  const [claimedReward, setClaimedReward] = useState<PodiumRewardClaim | null>(null);
  const isInitialView = scope === 'GLOBAL' && page === 1;
  const {
    data = initialRanking,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['ranking', page, scope],
    queryFn: () => fetchRankingPage(page, scope),
    initialData: isInitialView ? initialRanking : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const changeScope = useCallback((nextScope: RankingScope) => {
    startTransition(() => {
      setScope(nextScope);
      setPage(1);
    });
  }, []);

  const changePage = useCallback((nextPage: number) => {
    startTransition(() => setPage(nextPage));
  }, []);

  const handlePodiumRewardClaim = useCallback(
    async (reward: PodiumRewardClaim) => {
      setClaimedReward(reward);
      await refetch();
    },
    [refetch],
  );

  return (
    <div className={`mx-auto w-full max-w-[2400px] pb-5 ${styles.scene}`}>
      <div className={styles.heroEnter}>
        <RankingHeader />
      </div>
      <div
        className={`mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.36fr)] lg:items-start ${styles.contentEnter}`}
      >
        <div className="min-w-0 space-y-5">
          <RankingFilters
            scope={scope}
            onScopeChange={changeScope}
            canManageRewards={canManageRewards}
          />
          <Podium students={data.podium} />
          <div className="lg:hidden">
            <CurrentPositionCard position={data.currentUser} totalStudents={data.totalStudents} />
          </div>
          <RankingTable
            students={data.items}
            currentUserId={currentUserId}
            page={data.page}
            totalPages={data.totalPages}
            isLoading={isFetching}
            onPageChange={changePage}
          />
        </div>
        <aside className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <div className="hidden lg:block">
            <CurrentPositionCard position={data.currentUser} totalStudents={data.totalStudents} />
          </div>
          <RankingRewards
            rewards={data.rewards}
            currentPosition={data.currentUser?.rank ?? null}
            canClaimPodiumRewards={canClaimPodiumRewards}
            scope={scope}
            onRewardClaimed={handlePodiumRewardClaim}
          />
          <div className="sm:col-span-2 lg:col-span-1">
            <MotivationCard />
          </div>
        </aside>
      </div>
      <RewardRedemptionCelebration
        reward={
          claimedReward
            ? {
                name: claimedReward.title,
                description: `Reclamaste ${claimedReward.title} por terminar en el puesto ${claimedReward.position}.º. Tus gemas ya están en tu cuenta.`,
                gems: claimedReward.gems,
                amountPrefix: '+',
                eyebrow: '¡PODIO ALCANZADO!',
                glbLabel: claimedReward.title,
              }
            : null
        }
        onClose={() => setClaimedReward(null)}
      />
    </div>
  );
}
