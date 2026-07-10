import type { RankingUser } from '@/lib/server-api';
import RankingItem from '@/components/ui/RankingItem';

interface WeeklyRankingProps {
  users: RankingUser[];
}

export default function WeeklyRanking({ users }: WeeklyRankingProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition-all duration-300 hover:shadow-md">
      <div className="bg-linear-to-r from-castillo-500 to-castillo-400 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg drop-shadow-xs">🏆</span>
          <h3 className="font-super-pandora text-base text-white drop-shadow-xs">
            Ranking Global
          </h3>
        </div>
      </div>

      <div className="p-4">
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <span className="text-3xl">📋</span>
            <p className="font-simply-olive text-center text-sm text-gray-400">
              Aún no hay estudiantes en el ranking.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {users.map((student) => (
              <RankingItem
                key={student.id}
                user={student}
                isTopThree={student.rank <= 3}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
