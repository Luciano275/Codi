'use client';

import { useState } from 'react';
import { Gift } from 'lucide-react';
import styles from './ranking.module.css';
import type { PodiumRewardClaim } from './types';

interface PodiumRewardClaimButtonProps {
  gems: number;
  onRewardClaimed: (reward: PodiumRewardClaim) => Promise<unknown>;
}

export function PodiumRewardClaimButton({ gems, onRewardClaimed }: PodiumRewardClaimButtonProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function claimReward() {
    setIsClaiming(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/proxy/api/ranking/rewards/claim', { method: 'POST' });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        reward?: PodiumRewardClaim;
      };
      if (!response.ok) throw new Error(payload.message ?? 'No pudimos reclamar tu recompensa.');
      if (!payload.reward) throw new Error('No recibimos los datos de tu recompensa.');
      window.dispatchEvent(new CustomEvent('user-updated'));
      await onRewardClaimed(payload.reward);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No pudimos reclamar tu recompensa.',
      );
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <div className={`relative mt-4 ${styles.claimRewardMotion}`}>
      <button
        type="button"
        onClick={claimReward}
        disabled={isClaiming}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-lagos-500 px-4 py-3 font-candy-beans text-base text-white shadow-[0_4px_0_#1594a3] transition hover:-translate-y-0.5 hover:bg-lagos-600 active:translate-y-0 disabled:cursor-wait disabled:opacity-70"
      >
        <Gift className="h-4 w-4" aria-hidden />
        {isClaiming ? 'Reclamando…' : `Reclamar ${gems} gemas`}
      </button>
      {errorMessage ? (
        <p role="status" className="mt-2 font-simply-olive text-xs font-bold text-rose-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
