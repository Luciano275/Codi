import { Award, LockKeyhole } from 'lucide-react';
import type { CompetitivePlayerProfile } from '@/lib/server-api';

interface CompetitiveAchievementsProps {
  achievements: CompetitivePlayerProfile['achievements'];
}

export function CompetitiveAchievements({ achievements }: CompetitiveAchievementsProps) {
  return (
    <section className="border-2 border-bosque-300 bg-white shadow-[0_6px_0_var(--color-bosque-100)]">
      <div className="flex items-center gap-3 border-b-2 border-bosque-100 px-5 py-4 sm:px-6">
        <div className="grid h-11 w-11 place-items-center border-2 border-castillo-300 bg-castillo-50 text-castillo-700">
          <Award className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-super-pandora text-xl text-bosque-900">Vitrina de logros</h2>
          <p className="font-simply-olive text-sm text-slate-500">
            Insignias obtenidas en campaña.
          </p>
        </div>
      </div>

      {achievements.length ? (
        <ul className="grid divide-y divide-bosque-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <li key={achievement.code} className="flex items-start gap-3 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center border border-desierto-300 bg-desierto-50 text-desierto-700">
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-super-pandora text-sm text-bosque-900">
                  {achievement.title}
                </p>
                <p className="mt-1 line-clamp-2 font-simply-olive text-xs leading-5 text-slate-500">
                  {achievement.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-3 px-5 py-8 text-slate-500 sm:px-6">
          <LockKeyhole className="h-5 w-5 text-bosque-400" />
          <p className="font-simply-olive text-sm">Este jugador todavía no desbloqueó logros.</p>
        </div>
      )}
    </section>
  );
}
