import Image from 'next/image';
import { Gem, Medal } from 'lucide-react';
import chestImage from '@/assets/diamonds_chest.webp';
import type { RankingRewardForViewer } from '@/lib/server-api';
import styles from './ranking.module.css';
import { PodiumRewardClaimButton } from './PodiumRewardClaimButton';
import type { PodiumRewardClaim, RankingScope } from './types';

const rewardThemes = {
  1: 'bg-castillo-100 text-desierto-700',
  2: 'bg-slate-100 text-slate-700',
  3: 'bg-desierto-50 text-desierto-700',
} as const;

interface RankingRewardsProps {
  rewards: RankingRewardForViewer[];
  currentPosition: number | null;
  canClaimPodiumRewards: boolean;
  scope: RankingScope;
  onRewardClaimed: (reward: PodiumRewardClaim) => Promise<unknown>;
}

export function RankingRewards({
  rewards,
  currentPosition,
  canClaimPodiumRewards,
  scope,
  onRewardClaimed,
}: RankingRewardsProps) {
  const reward = rewards.find((item) => item.position === currentPosition);
  const canClaim =
    canClaimPodiumRewards &&
    scope === 'GLOBAL' &&
    reward &&
    !reward.claimed &&
    currentPosition !== null;
  const hasClaimedCurrentReward =
    canClaimPodiumRewards && scope === 'GLOBAL' && reward?.claimed && currentPosition !== null;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-lagos-100 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-md lg:p-6">
      <Image
        src={chestImage}
        alt="Cofre de gemas"
        width={120}
        height={120}
        className={`pointer-events-none absolute -right-7 -top-5 h-32 w-32 rotate-8 object-contain ${styles.chest}`}
      />
      <div className="relative pr-20">
        <h2 className="font-super-pandora text-xl text-gray-900 lg:text-2xl">
          Recompensas por posición
        </h2>
      </div>
      <ul className="relative mt-4 space-y-2">
        {rewards.map((reward) => (
          <li
            key={reward.position}
            className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 transition duration-200 hover:translate-x-1 hover:bg-lagos-50"
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${rewardThemes[reward.position]}`}
            >
              <Medal className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 font-simply-olive text-sm font-bold text-gray-600">
              {reward.position}.º · {reward.title}
            </span>
            <span className="flex items-center gap-1 font-candy-beans text-base text-lagos-700">
              <Gem className="h-3.5 w-3.5 fill-lagos-300" aria-hidden />
              {reward.gems}
            </span>
          </li>
        ))}
      </ul>
      {canClaim ? (
        <PodiumRewardClaimButton gems={reward.gems} onRewardClaimed={onRewardClaimed} />
      ) : null}
      {hasClaimedCurrentReward ? (
        <p className="relative mt-4 rounded-2xl bg-lagos-50 px-4 py-3 text-center font-simply-olive text-sm font-bold text-lagos-700">
          Recompensa reclamada este mes.
        </p>
      ) : null}
    </section>
  );
}
