import type { RankingUser } from '@/lib/server-api';

interface RankingItemProps {
  user: RankingUser;
  isTopThree: boolean;
}

const rankEmoji = ['🥇', '🥈', '🥉'];

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
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
        isTopThree ? `bg-linear-to-r ${gradientClass} border shadow-xs` : 'border border-transparent'
      }`}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center">
        {isTopThree ? (
          <span className="text-lg drop-shadow-xs">{rankEmoji[user.rank - 1]}</span>
        ) : (
          <span className="font-simply-olive text-xs font-semibold text-gray-400">
            {user.rank}
          </span>
        )}
      </div>

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${
          isTopThree ? `bg-linear-to-br ${avatarGradients[user.rank - 1]}` : 'bg-gray-200 text-gray-500'
        }`}
      >
        {user.displayName.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">{user.displayName}</p>
        <p className="truncate font-simply-olive text-xs text-gray-400">Nivel {user.level}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-amber-400 drop-shadow-xs">⚡</span>
        <span className="font-candy-beans text-xs text-gray-600">
          {user.xp.toLocaleString()}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="text-cyan-400 drop-shadow-xs">💎</span>
        <span className="font-candy-beans text-xs text-gray-500">{user.gems}</span>
      </div>
    </li>
  );
}
