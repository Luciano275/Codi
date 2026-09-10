'use client';

import Link from 'next/link';
import { Globe2, Trophy, UsersRound } from 'lucide-react';
import type { RankingScope } from './types';

interface RankingFiltersProps {
  scope: RankingScope;
  onScopeChange: (scope: RankingScope) => void;
  canManageRewards: boolean;
}

const filters = [
  { value: 'GLOBAL', label: 'Global', icon: Globe2 },
  { value: 'FRIENDS', label: 'Amigos', icon: UsersRound },
] as const;

export function RankingFilters({ scope, onScopeChange, canManageRewards }: RankingFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 pb-2">
      <nav aria-label="Alcance del ranking" className="flex gap-2.5 overflow-x-auto">
        {filters.map(({ value, label, icon: Icon }) => {
          const active = scope === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onScopeChange(value)}
              aria-pressed={active}
              className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-2xl border-2 px-4 py-2 font-super-pandora text-sm transition-all duration-200 ${
                active
                  ? 'border-pradera-500 bg-pradera-500 text-white shadow-[0_3px_0_#3fa002] hover:-translate-y-0.5'
                  : 'border-white bg-white text-gray-500 shadow-xs hover:-translate-y-0.5 hover:border-pradera-200 hover:text-pradera-700'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </nav>
      {canManageRewards ? (
        <Link
          href="/dashboard/admin/ranking"
          className="flex min-h-11 items-center gap-2 rounded-2xl bg-castillo-100 px-4 py-2 font-super-pandora text-sm text-castillo-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-castillo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-castillo-500"
        >
          <Trophy className="h-4 w-4 fill-castillo-400 text-castillo-700" aria-hidden />
          Administrar recompensas
        </Link>
      ) : null}
    </div>
  );
}
