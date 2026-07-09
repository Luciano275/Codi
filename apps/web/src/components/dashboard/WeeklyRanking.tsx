import { Trophy, Zap, Gem } from 'lucide-react';
import type { RankingUser } from '@/lib/server-api';

interface WeeklyRankingProps {
  users: RankingUser[];
}

const rankIcons = ['text-castillo-500', 'text-slate-400', 'text-amber-600'];

export default function WeeklyRanking({ users }: WeeklyRankingProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-castillo-500" />
        <h3 className="font-super-pandora text-base text-gray-800">
          Ranking Global
        </h3>
      </div>

      {users.length === 0 ? (
        <p className="font-simply-olive py-4 text-center text-sm text-gray-400">
          Aún no hay estudiantes en el ranking.
        </p>
      ) : (
        <ul className="space-y-2">
          {users.map((student) => (
            <li
              key={student.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-gray-50"
            >
              {/* Position */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  student.rank <= 3
                    ? rankIcons[student.rank - 1]
                    : 'text-gray-400'
                }`}
              >
                {student.rank <= 3 ? (
                  <Trophy className="h-4 w-4" />
                ) : (
                  <span className="font-simply-olive text-xs">{student.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">
                {student.displayName.charAt(0)}
              </div>

              {/* Name */}
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-gray-800">
                  {student.displayName}
                </p>
                <p className="truncate text-xs text-gray-400">
                  Nivel {student.level}
                </p>
              </div>

              {/* XP */}
              <div className="flex shrink-0 items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" />
                <span className="font-candy-beans text-xs text-gray-600">
                  {student.xp.toLocaleString()}
                </span>
              </div>

              {/* Gems */}
              <div className="flex shrink-0 items-center gap-1">
                <Gem className="h-3 w-3 text-cyan-400" />
                <span className="font-candy-beans text-xs text-gray-500">
                  {student.gems}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
