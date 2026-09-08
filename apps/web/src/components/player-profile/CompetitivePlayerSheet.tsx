import { Crown, Flame, Gem, ShieldCheck, Swords, Target, Trophy, Zap } from 'lucide-react';
import type { CompetitivePlayerProfile } from '@/lib/server-api';
import { getPlayerBanner } from './player-banner';
import { PlayerAvatar } from './PlayerAvatar';
import { RankParticles } from './RankParticles';
import styles from './competitive-player.module.css';

interface CompetitivePlayerSheetProps {
  player: CompetitivePlayerProfile;
  successRate: number;
}

const rankTitles = ['Campeón del ranking', 'Subcampeón del ranking', 'Tercer puesto del ranking'];
const rankBorderClasses = ['border-castillo-300', 'border-slate-300', 'border-desierto-400'];

function CombatStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className={`${styles.statRune} border-2 bg-white`}>
      <div className={`${styles.runeIcon} grid h-10 w-10 place-items-center rounded-full ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className={`${styles.themeInk} font-candy-beans text-2xl`}>{value}</p>
        <p className="mt-0.5 font-simply-olive text-[11px] font-bold uppercase text-slate-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function CampaignRecord({ player }: { player: CompetitivePlayerProfile }) {
  const record = [
    {
      icon: Swords,
      label: 'Problemas superados',
      value: player.acceptedSubmissions,
      tone: 'text-desierto-700',
    },
    {
      icon: ShieldCheck,
      label: 'Lecciones completadas',
      value: player.completedLessons,
      tone: 'text-pradera-700',
    },
    {
      icon: Target,
      label: 'Intentos registrados',
      value: player.totalSubmissions,
      tone: 'text-castillo-700',
    },
  ];

  return (
    <section className={`${styles.campaignRecord} border-2 bg-white`}>
      <div className={styles.recordHeading}>
        <p className={`${styles.themeInk} font-simply-olive text-xs font-bold uppercase`}>
          Registro de campaña
        </p>
      </div>
      <dl className="grid gap-2 px-4 pb-5 sm:px-6 md:grid-cols-3 md:gap-4">
        {record.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className={styles.campaignStat}>
            <div
              className={`${styles.runeIcon} grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <dd className={`${styles.themeInk} font-candy-beans text-3xl`}>
                {value.toLocaleString()}
              </dd>
              <dt className="font-simply-olive text-sm text-slate-500">{label}</dt>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CompetitivePlayerSheet({ player, successRate }: CompetitivePlayerSheetProps) {
  const banner = getPlayerBanner(player.profileBanner);
  const rankIndex = player.rank ? player.rank - 1 : -1;
  const isPodium = player.rank !== null && player.rank <= 3;
  const rankTitle = player.isRanked
    ? (rankTitles[rankIndex] ?? 'Jugador del ranking')
    : 'Perfil competitivo personal';
  const rankBorder = rankBorderClasses[rankIndex] ?? styles.themeBorder;

  return (
    <div className="space-y-6">
      <section
        className={`${styles.heroSheet} relative overflow-hidden border-4 px-5 py-8 sm:px-8 sm:py-10 ${banner.surfaceClass} ${banner.borderClass}`}
      >
        <RankParticles rank={player.rank} />
        <div aria-hidden className={styles.heroStitching} />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-center">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-left">
            <div
              className={`${styles.avatarFrame} border-4 bg-white p-1 ${rankBorder} ${player.rank === 1 ? styles.topRankGlow : ''}`}
            >
              <PlayerAvatar
                avatarUrl={player.avatarUrl}
                displayName={player.displayName}
                rank={player.rank ?? undefined}
                className="h-30 w-30 text-5xl sm:h-36 sm:w-36"
              />
            </div>
            <div className="min-w-0">
              <p
                className={`font-simply-olive text-xs font-bold uppercase ${banner.ornamentClass}`}
              >
                {rankTitle}
              </p>
              <h1 className="mt-2 break-words font-super-pandora text-4xl text-white sm:text-5xl">
                {player.displayName}
              </h1>
              <p className="mt-1 font-simply-olive text-sm text-white/80">@{player.username}</p>
              <div className={`${styles.rankRibbon} mt-5 border-2 bg-white`}>
                {isPodium ? (
                  <Crown className="h-4 w-4 text-castillo-600" />
                ) : (
                  <Trophy className="h-4 w-4 text-castillo-600" />
                )}
                <span className="font-candy-beans text-sm text-desierto-800">
                  {player.isRanked
                    ? `Puesto #${player.rank} de ${player.totalStudents}`
                    : 'Ficha personal'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <CombatStat
              icon={Zap}
              label="XP total"
              value={player.xp.toLocaleString()}
              tone="text-desierto-500"
            />
            <CombatStat
              icon={Gem}
              label="Gemas"
              value={player.gems.toLocaleString()}
              tone="text-valle-500"
            />
            <CombatStat
              icon={Flame}
              label="Racha"
              value={`${player.streak} días`}
              tone="text-desierto-600"
            />
            <CombatStat
              icon={Target}
              label="Precisión"
              value={`${successRate}%`}
              tone="text-pradera-600"
            />
          </div>
        </div>
      </section>

      <CampaignRecord player={player} />
    </div>
  );
}
