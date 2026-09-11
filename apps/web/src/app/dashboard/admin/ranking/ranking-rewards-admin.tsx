'use client';

import { useState, useTransition } from 'react';
import { Gem, Medal, Save } from '@/components/ui/Icon';
import type { RankingReward } from '@/lib/server-api';
import { saveRankingRewards } from './actions';

interface RankingRewardsAdminProps {
  initialRewards: RankingReward[];
}

const cardThemes = {
  1: {
    accent: 'bg-castillo-400',
    icon: 'bg-castillo-100 text-castillo-800',
    surface: 'bg-[#fffdf5]',
  },
  2: {
    accent: 'bg-slate-400',
    icon: 'bg-slate-100 text-slate-700',
    surface: 'bg-slate-50',
  },
  3: {
    accent: 'bg-desierto-400',
    icon: 'bg-desierto-100 text-desierto-700',
    surface: 'bg-[#fff9f1]',
  },
} as const;

export default function RankingRewardsAdmin({ initialRewards }: RankingRewardsAdminProps) {
  const [rewards, setRewards] = useState(initialRewards);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateReward(position: 1 | 2 | 3, field: 'title' | 'gems', value: string) {
    setRewards((current) =>
      current.map((reward) =>
        reward.position === position
          ? { ...reward, [field]: field === 'gems' ? Math.max(0, Number(value) || 0) : value }
          : reward,
      ),
    );
  }

  function save() {
    startTransition(async () => {
      try {
        const saved = await saveRankingRewards(rewards);
        setRewards(saved);
        setNotice('Las recompensas del podio quedaron actualizadas.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.');
      }
    });
  }

  return (
    <div className="mt-7">
      <div className="grid gap-5 lg:grid-cols-3">
        {rewards.map((reward) => {
          const theme = cardThemes[reward.position];
          return (
            <section
              key={reward.position}
              className={`relative overflow-hidden rounded-3xl p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${theme.surface}`}
            >
              <span className={`absolute inset-y-0 left-0 w-1.5 ${theme.accent}`} aria-hidden />
              <div className="flex items-center justify-between">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${theme.icon}`}>
                  <Medal className="h-6 w-6" aria-hidden />
                </span>
                <span className="font-candy-beans text-3xl text-gray-700">#{reward.position}</span>
              </div>
              <label className="mt-6 block">
                <span className="font-super-pandora text-base text-gray-800">
                  Nombre del premio
                </span>
                <input
                  value={reward.title}
                  maxLength={80}
                  onChange={(event) => updateReward(reward.position, 'title', event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 font-simply-olive text-base font-bold text-gray-700 outline-none transition focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
                />
              </label>
              <label className="mt-4 block">
                <span className="font-super-pandora text-base text-gray-800">Gemas</span>
                <span className="mt-2 flex min-h-12 items-center rounded-xl border border-gray-200 bg-white px-3 transition focus-within:border-lagos-400 focus-within:ring-2 focus-within:ring-lagos-100">
                  <Gem className="h-5 w-5 shrink-0 fill-lagos-300 text-lagos-500" aria-hidden />
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={reward.gems}
                    onChange={(event) => updateReward(reward.position, 'gems', event.target.value)}
                    className="w-full bg-transparent pl-2 font-candy-beans text-xl text-gray-700 outline-none"
                  />
                </span>
              </label>
            </section>
          );
        })}
      </div>
      {notice ? (
        <p
          role="status"
          className="mt-5 rounded-2xl bg-lagos-50 px-4 py-3 font-simply-olive text-sm font-bold text-lagos-800"
        >
          {notice}
        </p>
      ) : null}
      <button
        type="button"
        disabled={isPending}
        onClick={save}
        className="mt-5 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-lagos-500 px-5 font-super-pandora text-base text-white shadow-[0_4px_0_#0082cc] transition hover:-translate-y-0.5 hover:bg-lagos-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save className="h-5 w-5" aria-hidden /> {isPending ? 'Guardando…' : 'Guardar recompensas'}
      </button>
    </div>
  );
}
