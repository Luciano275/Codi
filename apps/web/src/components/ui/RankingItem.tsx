import { Trophy, Zap, Gem } from 'lucide-react';
import type { RankingUser } from '@/lib/server-api';

interface RankingItemProps {
  user: RankingUser;
  isTopThree: boolean;
}

const rankColors = ['text-castillo-500', 'text-slate-400', 'text-amber-600'];

const rankGradients = [
  'from-castillo-50 to-amber-50 border-castillo-200',
  'from-slate-50 to-gray-50 border-slate-200',
  'from-amber-50 to-desierto-50 border-amber-200',
];

const avatarGradients = [
  'from-castillo-400 to-castillo-500',
  'from-slate-400 to-slate-500',
  'from-amber-500 to-desierto-500',
];

export default function RankingItem({ user, isTopThree }: RankingItemProps) {
  const gradientClass = isTopThree ? rankGradients[user.rank - 1] : 'border-gray-100 hover:bg-gray-50';

  return (
    <li
      className={`flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all duration-200 md:gap-3 md:px-3 md:py-2.5 ${
        isTopThree ? `bg-linear-to-r ${gradientClass} border shadow-xs` : 'border border-transparent'
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

      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs md:h-8 md:w-8 md:text-xs ${
          isTopThree ? `bg-linear-to-br ${avatarGradients[user.rank - 1]}` : 'bg-gray-200 text-gray-500'
        }`}
      >
        {user.displayName.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-gray-800 md:text-sm">{user.displayName}</p>
        <p className="truncate font-simply-olive text-[10px] text-gray-400 md:text-xs">Nivel {user.level}</p>
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
    </li>
  );
}
