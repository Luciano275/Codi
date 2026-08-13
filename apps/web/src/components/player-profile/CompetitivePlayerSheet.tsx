import {
  Crown,
  Flame,
  Gem,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
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
    <div className="border-2 border-bosque-200 bg-white px-3 py-3 shadow-[0_3px_0_var(--color-bosque-200)] [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]">
      <Icon className={`h-5 w-5 ${tone}`} />
      <p className="mt-2 font-candy-beans text-2xl text-bosque-900">{value}</p>
      <p className="mt-1 font-simply-olive text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">
        {label}
      </p>
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
      icon: Sparkles,
      label: 'Intentos registrados',
      value: player.totalSubmissions,
      tone: 'text-castillo-700',
    },
  ];

  return (
    <section className="border-x-2 border-b-2 border-bosque-300 bg-white shadow-[0_6px_0_var(--color-bosque-100)]">
      <div className="border-t-4 border-bosque-600 px-5 py-4 sm:px-6">
        <p className="font-simply-olive text-xs font-bold uppercase tracking-[.2em] text-bosque-600">
          Registro de campaña
        </p>
      </div>
      <dl className="grid divide-y divide-bosque-100 md:grid-cols-3 md:divide-x md:divide-y-0">
        {record.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="flex items-center gap-4 p-5">
            <Icon className={`h-7 w-7 shrink-0 ${tone}`} />
            <div>
              <dd className="font-candy-beans text-3xl text-bosque-900">
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
  const rankBorder = rankBorderClasses[rankIndex] ?? 'border-bosque-300';

  return (
    <div className="space-y-6">
      <section
        className={`relative overflow-hidden border-4 px-5 py-7 shadow-[0_10px_0_rgba(42,36,96,.28)] sm:px-8 sm:py-9 ${banner.surfaceClass} ${banner.borderClass}`}
      >
        <RankParticles rank={player.rank} />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-center">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-left">
            <div
              className={`border-4 bg-white p-1 shadow-[0_7px_0_rgba(16,15,48,.42)] ${rankBorder} ${player.rank === 1 ? styles.topRankGlow : ''}`}
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
                className={`font-simply-olive text-xs font-bold uppercase tracking-[.25em] ${banner.ornamentClass}`}
              >
                {rankTitle}
              </p>
              <h1 className="mt-2 break-words font-super-pandora text-4xl text-white sm:text-5xl">
                {player.displayName}
              </h1>
              <p className="mt-1 font-simply-olive text-sm text-white/80">@{player.username}</p>
              <div className="mt-5 inline-flex items-center gap-2 border-2 border-castillo-300 bg-white px-3 py-2 shadow-[0_3px_0_var(--color-castillo-600)]">
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

          <div className="grid grid-cols-2 gap-3">
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
