import { Trophy, ClipboardList } from '@/components/ui/Icon';
import type { RankingUser } from '@/lib/server-api';
import RankingItem from '@/components/ui/RankingItem';

interface WeeklyRankingProps {
  users: RankingUser[];
}

export default function WeeklyRanking({ users }: WeeklyRankingProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition-all duration-300 hover:shadow-md">
      <div className="bg-linear-to-r from-castillo-500 to-castillo-400 px-4 py-2.5 md:px-5 md:py-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-white drop-shadow-xs shrink-0" />
          <h3 className="font-super-pandora text-sm text-white drop-shadow-xs md:text-base">
            Ranking Global
          </h3>
        </div>
      </div>

      <div className="p-3 md:p-4">
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 md:py-8">
            <ClipboardList className="h-8 w-8 text-gray-300 md:h-10 md:w-10" />
            <p className="font-simply-olive text-center text-xs text-gray-400 md:text-sm">
              Aún no hay estudiantes en el ranking.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5 md:space-y-2">
            {users.map((student) => (
              <RankingItem key={student.id} user={student} isTopThree={student.rank <= 3} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
