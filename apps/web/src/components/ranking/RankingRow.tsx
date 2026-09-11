import Link from 'next/link';
import { BookOpenCheck, Flame, Zap } from '@/components/ui/Icon';
import { PlayerAvatar } from '@/components/player-profile/PlayerAvatar';
import type { RankingEntry } from './types';

interface RankingRowProps {
  student: RankingEntry;
  isCurrentUser: boolean;
}

export function RankingRow({ student, isCurrentUser }: RankingRowProps) {
  return (
    <Link
      href={`/dashboard/players/${student.id}`}
      className={`ranking-row grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-2 gap-y-3 rounded-2xl border px-3 py-3.5 transition duration-200 hover:-translate-y-1 hover:shadow-md md:grid-cols-[3.5rem_minmax(12rem,1.8fr)_minmax(5rem,.65fr)_minmax(6rem,.75fr)_minmax(6rem,.8fr)_minmax(5rem,.65fr)] md:gap-3 md:px-5 lg:py-4 ${
        isCurrentUser
          ? 'border-2 border-pradera-400 bg-pradera-50 shadow-[0_3px_0_#9bdf40]'
          : 'border-gray-100 bg-white hover:border-lagos-200'
      }`}
      aria-label={`Ver perfil competitivo de ${student.displayName}`}
    >
      <span className="row-span-2 self-start font-candy-beans text-xl text-gray-500 lg:text-2xl">
        #{student.rank}
      </span>
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar
          avatarUrl={student.avatarUrl}
          displayName={student.displayName}
          rank={student.rank}
          className="h-11 w-11 rounded-2xl text-base shadow-xs lg:h-12 lg:w-12"
          imageSizes="48px"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-super-pandora text-base text-gray-800 lg:text-lg">
              {student.displayName}
            </p>
            {isCurrentUser ? (
              <span className="rounded-full bg-pradera-500 px-2 py-0.5 font-simply-olive text-[11px] font-bold text-white">
                Vos
              </span>
            ) : null}
          </div>
          <p className="font-simply-olive text-sm text-gray-400">Nivel {student.level}</p>
        </div>
      </div>
      <p className="hidden font-candy-beans text-lg text-bosque-700 md:block">
        Nv. {student.level}
      </p>
      <div className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 md:contents">
        <p className="flex items-center gap-1 font-candy-beans text-lg text-desierto-700">
          <Zap className="h-4 w-4 fill-desierto-400 text-desierto-500" aria-hidden />
          {student.xp.toLocaleString('es-AR')}
        </p>
        <p className="flex items-center gap-1 font-candy-beans text-base text-lagos-700">
          <BookOpenCheck className="h-4 w-4" aria-hidden />
          {student.completedLessons}
        </p>
        <p className="flex items-center gap-1 font-candy-beans text-base text-volcan-600">
          <Flame className="h-4 w-4 fill-volcan-400" aria-hidden />
          {student.streak}d
        </p>
      </div>
    </Link>
  );
}
