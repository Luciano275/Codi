import { Award, LockKeyhole } from '@/components/ui/Icon';
import type { CompetitivePlayerProfile } from '@/lib/server-api';
import styles from './competitive-player.module.css';

interface CompetitiveAchievementsProps {
  achievements: CompetitivePlayerProfile['achievements'];
}

export function CompetitiveAchievements({ achievements }: CompetitiveAchievementsProps) {
  return (
    <section className={`${styles.achievementCabinet} border-2 bg-white`}>
      <div className="flex items-center gap-3 px-5 pb-3 pt-5 sm:px-7 sm:pt-6">
        <div
          className={`${styles.trophySeal} grid h-11 w-11 place-items-center border-2 bg-castillo-50 text-castillo-700`}
        >
          <Award className="h-6 w-6" />
        </div>
        <div>
          <h2 className={`${styles.themeInk} font-super-pandora text-xl`}>Vitrina de logros</h2>
          <p className="font-simply-olive text-sm text-slate-500">
            Insignias obtenidas en campaña.
          </p>
        </div>
      </div>

      {achievements.length ? (
        <ul className="grid gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-7 sm:pb-7 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <li
              key={achievement.code}
              className={`${styles.achievementMedal} flex items-start gap-3`}
            >
              <div
                className={`${styles.medalIcon} grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-desierto-50 text-desierto-700`}
              >
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className={`${styles.themeInk} truncate font-super-pandora text-sm`}>
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
        <div className="flex items-center gap-3 px-5 py-8 text-slate-500 sm:px-7">
          <LockKeyhole className={`${styles.themeAccent} h-5 w-5`} />
          <p className="font-simply-olive text-sm">Este jugador todavía no desbloqueó logros.</p>
        </div>
      )}
    </section>
  );
}
