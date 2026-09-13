import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Crown, Medal, Zap } from '@/components/ui/Icon';
import { PlayerAvatar } from '@/components/player-profile/PlayerAvatar';
import { PodiumParticles } from './PodiumParticles';
import type { RankingEntry } from './types';
import styles from './ranking.module.css';

interface PodiumCardProps {
  student: RankingEntry;
  reduceParticleDensity: boolean;
}

const podiumThemes = {
  1: {
    card: 'border-castillo-300 bg-linear-to-b from-castillo-100 via-white to-castillo-50 shadow-[0_8px_0_#d4b43a,0_16px_35px_rgba(212,180,58,.22)]',
    medal: 'border-castillo-400 bg-castillo-400 text-castillo-900',
    pedestal: 'bg-castillo-400 text-castillo-900',
  },
  2: {
    card: 'border-slate-200 bg-linear-to-b from-slate-100 via-white to-slate-50 shadow-[0_6px_0_#94a3b8,0_13px_28px_rgba(100,116,139,.16)]',
    medal: 'border-slate-300 bg-slate-200 text-slate-700',
    pedestal: 'bg-slate-300 text-slate-800',
  },
  3: {
    card: 'border-desierto-200 bg-linear-to-b from-desierto-100 via-white to-desierto-50 shadow-[0_6px_0_#cc7800,0_13px_28px_rgba(204,120,0,.14)]',
    medal: 'border-desierto-400 bg-desierto-300 text-desierto-800',
    pedestal: 'bg-desierto-400 text-desierto-900',
  },
} as const;

const podiumEntryDelays = { 1: 140, 2: 40, 3: 220 } as const;

export function PodiumCard({ student, reduceParticleDensity }: PodiumCardProps) {
  const theme = podiumThemes[student.rank as 1 | 2 | 3];
  const champion = student.rank === 1;
  const rank = student.rank as 1 | 2 | 3;

  return (
    <Link
      href={`/dashboard/players/${student.id}`}
      className={`group relative flex min-w-0 flex-col items-center rounded-2xl border-2 px-1.5 pb-2.5 pt-4 text-center sm:rounded-[1.7rem] sm:px-3 sm:pb-4 sm:pt-6 ${styles.podiumCard} ${theme.card} ${champion ? `${styles.championCard} md:-mt-6 md:pb-6 md:pt-9` : ''}`}
      style={{ '--podium-delay': `${podiumEntryDelays[rank]}ms` } as CSSProperties}
      aria-label={`Ver perfil competitivo de ${student.displayName}`}
    >
      <PodiumParticles rank={rank} reduceDensity={reduceParticleDensity} />
      {champion ? (
        <Crown
          className={`absolute -top-4 h-8 w-8 fill-castillo-400 text-castillo-700 sm:-top-7 sm:h-12 sm:w-12 ${styles.crown}`}
          aria-hidden
        />
      ) : null}
      <span
        className={`absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full border-2 sm:left-3 sm:top-3 sm:h-9 sm:w-9 ${styles.medal} ${theme.medal}`}
      >
        <Medal className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden />
      </span>
      <PlayerAvatar
        avatarUrl={student.avatarUrl}
        displayName={student.displayName}
        rank={student.rank}
        className={`rounded-xl border-3 border-white text-base shadow-md sm:rounded-[1.1rem] sm:border-4 sm:text-xl ${champion ? 'h-13 w-13 sm:h-20 sm:w-20 md:h-24 md:w-24' : 'h-12 w-12 sm:h-17 sm:w-17 md:h-20 md:w-20'}`}
        imageSizes={
          champion
            ? '(max-width: 639px) 52px, (max-width: 767px) 80px, 96px'
            : '(max-width: 639px) 48px, (max-width: 767px) 68px, 80px'
        }
      />
      <p className="mt-2 w-full truncate font-super-pandora text-xs text-gray-800 sm:mt-3 sm:text-base lg:text-lg">
        {student.displayName}
      </p>
      <p className="font-simply-olive text-[10px] font-bold text-gray-400 sm:text-xs lg:text-sm">
        Nivel {student.level}
      </p>
      <p
        className={`mt-1 flex items-center gap-0.5 font-candy-beans text-sm text-desierto-700 sm:mt-2 sm:gap-1 sm:text-lg lg:text-xl ${styles.xp}`}
      >
        <Zap
          className="h-3 w-3 fill-desierto-400 text-desierto-500 sm:h-3.5 sm:w-3.5"
          aria-hidden
        />
        {student.xp.toLocaleString('es-AR')} <span className="hidden sm:inline">XP</span>
      </p>
      <span
        className={`mt-1.5 rounded-md px-2 py-0.5 font-candy-beans text-xs sm:mt-2 sm:rounded-lg sm:px-3 sm:py-1 sm:text-sm ${theme.pedestal}`}
      >
        #{student.rank}
      </span>
    </Link>
  );
}
