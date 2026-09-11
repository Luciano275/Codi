import { Trophy, Zap, Gem } from '@/components/ui/Icon';
import Link from 'next/link';
import type { RankingUser } from '@/lib/server-api';
import { PlayerAvatar } from '@/components/player-profile/PlayerAvatar';
import styles from './ranking-item.module.css';

interface RankingItemProps {
  user: RankingUser;
  isTopThree: boolean;
}

const rankColors = [
  'text-castillo-500 drop-shadow-[0_0_9px_rgba(255,215,78,.95)]',
  'text-slate-400',
  'text-desierto-700',
];

const rankGradients = [
  'from-castillo-100 via-amber-50 to-castillo-50 border-castillo-300 shadow-[0_0_22px_rgba(255,204,71,.38)]',
  'from-slate-50 to-gray-50 border-slate-200',
  'from-desierto-50 to-amber-50 border-desierto-200',
];

export default function RankingItem({ user, isTopThree }: RankingItemProps) {
  const gradientClass = isTopThree
    ? rankGradients[user.rank - 1]
    : 'border-gray-100 hover:bg-gray-50';

  return (
    <li>
      <Link
        href={`/dashboard/players/${user.id}`}
        aria-label={`Ver perfil competitivo de ${user.displayName}`}
        className={`${styles.shimmer} flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all duration-200 md:gap-3 md:px-3 md:py-2.5 ${
          isTopThree
            ? `bg-linear-to-r ${gradientClass} border shadow-xs`
            : 'border border-transparent hover:bg-gray-50'
        }`}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center md:h-7 md:w-7">
          {isTopThree ? (
            <Trophy className={`h-4 w-4 md:h-5 md:w-5 ${rankColors[user.rank - 1]}`} />
          ) : (
            <span className="font-simply-olive text-[10px] font-semibold text-gray-400 md:text-xs">
              {user.rank}
            </span>
          )}
        </div>

        <PlayerAvatar
          avatarUrl={user.avatarUrl}
          displayName={user.displayName}
          rank={user.rank}
          className="h-7 w-7 rounded-full text-[10px] font-bold shadow-xs md:h-8 md:w-8 md:text-xs"
          imageSizes="32px"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-gray-800 md:text-sm">
            {user.displayName}
          </p>
          <p className="truncate font-simply-olive text-[10px] text-gray-400 md:text-xs">
            Nivel {user.level}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 md:gap-1.5">
          <Zap className="h-3 w-3 text-amber-400 md:h-3.5 md:w-3.5" />
          <span className="font-candy-beans text-[10px] text-gray-600 md:text-xs">
            {user.xp.toLocaleString()}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Gem className="h-3 w-3 text-cyan-400 md:h-3.5 md:w-3.5" />
          <span className="font-candy-beans text-[10px] text-gray-500 md:text-xs">{user.gems}</span>
        </div>
      </Link>
    </li>
  );
}
