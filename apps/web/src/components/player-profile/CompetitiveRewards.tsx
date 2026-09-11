import { Gem, Gift, LockKeyhole } from '@/components/ui/Icon';
import type { CompetitivePlayerProfile } from '@/lib/server-api';
import styles from './competitive-player.module.css';

interface CompetitiveRewardsProps {
  rewards: CompetitivePlayerProfile['rewards'];
}

function getRewardState(reward: CompetitivePlayerProfile['rewards'][number]) {
  if (reward.redemptionStatus === 'REVOKED') return 'Revocada';
  if (reward.entitlementStatus === 'ACTIVE') return 'Activa';
  if (reward.entitlementStatus === 'AVAILABLE') return 'Disponible';
  if (reward.entitlementStatus === 'USED') return 'Utilizada';
  if (reward.entitlementStatus === 'EXPIRED') return 'Vencida';
  return 'Canjeada';
}

export function CompetitiveRewards({ rewards }: CompetitiveRewardsProps) {
  return (
    <section className={`${styles.achievementCabinet} border-2 bg-white`}>
      <div className="flex items-center gap-3 px-5 pb-3 pt-5 sm:px-7 sm:pt-6">
        <div
          className={`${styles.trophySeal} grid h-11 w-11 place-items-center border-2 bg-valle-50 text-valle-700`}
        >
          <Gift className="h-6 w-6" />
        </div>
        <div>
          <h2 className={`${styles.themeInk} font-super-pandora text-xl`}>Recompensas canjeadas</h2>
          <p className="font-simply-olive text-sm text-slate-500">
            Ventajas obtenidas durante la campaña.
          </p>
        </div>
      </div>

      {rewards.length ? (
        <ul className="grid gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-7 sm:pb-7 lg:grid-cols-3">
          {rewards.map((reward) => (
            <li key={reward.id} className={`${styles.achievementMedal} flex items-start gap-3`}>
              <div
                className={`${styles.medalIcon} grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-valle-50 text-valle-700`}
              >
                <Gem className="h-5 w-5 fill-valle-300" />
              </div>
              <div className="min-w-0">
                <p className={`${styles.themeInk} truncate font-super-pandora text-sm`}>
                  {reward.rewardName}
                </p>
                <p className="mt-1 font-simply-olive text-xs text-slate-500">
                  {getRewardState(reward)}
                  {reward.trimester ? ` · ${reward.trimester}.º trimestre` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-3 px-5 py-8 text-slate-500 sm:px-7">
          <LockKeyhole className={`${styles.themeAccent} h-5 w-5`} />
          <p className="font-simply-olive text-sm">Este jugador todavía no canjeó recompensas.</p>
        </div>
      )}
    </section>
  );
}
