'use client';

import { ChevronUp, FlagTriangleRight } from 'lucide-react';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import type { CurrentRankingPosition } from './types';
import styles from './ranking.module.css';

interface CurrentPositionCardProps {
  position: CurrentRankingPosition;
  totalStudents: number;
}

export function CurrentPositionCard({ position, totalStudents }: CurrentPositionCardProps) {
  const animatedXp = useAnimatedValue(position?.xp ?? 0, 750, 0);
  if (!position) return null;
  const progress = position.xpToNextRank
    ? Math.round((position.xp / (position.xp + position.xpToNextRank)) * 100)
    : 100;

  return (
    <section
      className={`overflow-hidden rounded-[2rem] border-2 border-pradera-200 bg-linear-to-br from-pradera-50 via-white to-lagos-50 p-5 shadow-[0_5px_0_#bceb78] lg:p-6 ${styles.currentCard}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-super-pandora text-xl text-gray-900 lg:text-2xl">
            Tu posición actual
          </h2>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-pradera-500 text-white shadow-[0_4px_0_#3fa002]">
          <FlagTriangleRight className="h-6 w-6 fill-pradera-300" aria-hidden />
        </span>
      </div>
      <div className="mt-4 flex items-end gap-3">
        <span className="font-candy-beans text-6xl leading-none text-pradera-700 lg:text-7xl">
          #{position.rank}
        </span>
        <span className="pb-1 font-simply-olive text-base font-bold text-gray-500">
          entre {totalStudents} estudiantes
        </span>
      </div>
      <div className="mt-5 rounded-2xl bg-white/85 p-4">
        <div className="mb-2 flex items-center justify-between gap-2 font-simply-olive text-sm font-bold text-gray-500">
          <span>Camino al puesto #{Math.max(1, position.rank - 1)}</span>
          <span>
            {position.xpToNextRank ? `${position.xpToNextRank} XP` : '¡Llegaste a la cima!'}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-pradera-100">
          <div
            className={`h-full rounded-full bg-linear-to-r from-pradera-500 to-lagos-400 transition-[width] duration-500 ${styles.progressFill}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="mt-4 font-candy-beans text-lg text-lagos-700">
        {animatedXp.toLocaleString('es-AR')} XP
      </p>
      <p className="mt-2 flex items-center gap-1.5 font-super-pandora text-base text-pradera-800">
        <ChevronUp className="h-4 w-4" aria-hidden /> ¡Vamos por más!
      </p>
    </section>
  );
}
