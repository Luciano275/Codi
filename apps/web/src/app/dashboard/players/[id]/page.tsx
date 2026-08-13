import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  ChevronLeft,
  Flame,
  Gem,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import {
  fetchCompetitivePlayer,
  type CompetitivePlayerProfile,
  UnauthorizedError,
} from '@/lib/server-api';

function PlayerAvatar({ player }: { player: CompetitivePlayerProfile }) {
  if (player.avatarUrl) {
    return <img src={player.avatarUrl} alt="" className="h-full w-full object-cover" />;
  }
  return <span className="font-candy-beans text-5xl">{player.displayName.charAt(0)}</span>;
}

function CompetitiveStat({
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
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 backdrop-blur-sm">
      <Icon className={`h-5 w-5 ${tone}`} />
      <p className="mt-3 font-candy-beans text-2xl text-white">{value}</p>
      <p className="mt-1 font-simply-olive text-xs font-bold uppercase tracking-[.12em] text-white/55">
        {label}
      </p>
    </div>
  );
}

function AchievementShelf({ achievements }: { achievements: CompetitivePlayerProfile['achievements'] }) {
  if (!achievements.length) {
    return (
      <p className="font-simply-olive text-sm text-slate-400">
        Este jugador todavía no desbloqueó logros.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((achievement) => (
        <div
          key={achievement.code}
          className="group rounded-2xl border border-lagos-100 bg-white p-3 transition hover:-translate-y-0.5 hover:border-lagos-300 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-castillo-100 to-lagos-100 text-lagos-600">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-super-pandora text-sm text-slate-800">{achievement.title}</p>
              <p className="mt-0.5 line-clamp-2 font-simply-olive text-xs leading-5 text-slate-500">
                {achievement.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function PlayerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await auth();
  if (!currentUser) redirect('/');

  let player: CompetitivePlayerProfile;
  try {
    player = await fetchCompetitivePlayer(id);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect('/api/auth/logout');
    notFound();
  }

  const successRate = player.totalSubmissions
    ? Math.round((player.acceptedSubmissions / player.totalSubmissions) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl px-2 py-1 font-simply-olive text-sm font-bold text-slate-500 transition hover:bg-white hover:text-lagos-700"
      >
        <ChevronLeft className="h-4 w-4" /> Volver al ranking
      </Link>

      <section className="relative overflow-hidden rounded-[2rem] bg-[#0a1635] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.26),transparent_28%),radial-gradient(circle_at_100%_100%,rgba(139,92,246,.3),transparent_35%)]" />
        <div aria-hidden className="absolute -right-10 -top-12 text-[15rem] font-candy-beans text-white/[.04]">
          {player.rank}
        </div>
        <div className="relative grid gap-7 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="flex items-center gap-5 sm:gap-7">
            <div className="relative h-28 w-28 shrink-0 rounded-[2rem] bg-linear-to-br from-castillo-300 via-lagos-400 to-valle-500 p-1 shadow-[0_0_0_6px_rgba(255,255,255,.1),0_18px_45px_rgba(0,0,0,.35)] sm:h-36 sm:w-36">
              <div className="h-full w-full overflow-hidden rounded-[1.75rem] bg-slate-900">
                <PlayerAvatar player={player} />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-slate-950 px-3 py-1 font-candy-beans text-sm text-castillo-200 shadow-lg">
                NIVEL {player.level}
              </div>
            </div>
            <div className="min-w-0 pt-3">
              <p className="font-simply-olive text-xs font-bold uppercase tracking-[.22em] text-cyan-200">
                Perfil competitivo
              </p>
              <h1 className="mt-2 truncate font-super-pandora text-3xl sm:text-4xl">{player.displayName}</h1>
              <p className="mt-1 font-simply-olive text-sm text-white/60">@{player.username}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-castillo-100">
                <Trophy className="h-4 w-4 text-castillo-300" />
                Puesto #{player.rank} de {player.totalStudents}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <CompetitiveStat icon={Zap} label="XP total" value={player.xp.toLocaleString()} tone="text-amber-300" />
            <CompetitiveStat icon={Gem} label="Gemas" value={player.gems.toLocaleString()} tone="text-cyan-300" />
            <CompetitiveStat icon={Flame} label="Racha" value={`${player.streak} días`} tone="text-orange-300" />
            <CompetitiveStat icon={Target} label="Precisión" value={`${successRate}%`} tone="text-emerald-300" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-lagos-100 bg-white p-5 shadow-sm">
          <Swords className="h-6 w-6 text-lagos-600" />
          <p className="mt-4 font-candy-beans text-3xl text-slate-900">{player.acceptedSubmissions}</p>
          <p className="font-simply-olive text-sm text-slate-500">Problemas superados</p>
        </div>
        <div className="rounded-2xl border border-pradera-100 bg-white p-5 shadow-sm">
          <ShieldCheck className="h-6 w-6 text-pradera-600" />
          <p className="mt-4 font-candy-beans text-3xl text-slate-900">{player.completedLessons}</p>
          <p className="font-simply-olive text-sm text-slate-500">Lecciones completadas</p>
        </div>
        <div className="rounded-2xl border border-castillo-100 bg-white p-5 shadow-sm">
          <Sparkles className="h-6 w-6 text-castillo-500" />
          <p className="mt-4 font-candy-beans text-3xl text-slate-900">{player.totalSubmissions}</p>
          <p className="font-simply-olive text-sm text-slate-500">Intentos registrados</p>
        </div>
      </section>

      <section className="rounded-[1.7rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-castillo-100 text-castillo-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-super-pandora text-xl text-slate-900">Vitrina de logros</h2>
            <p className="font-simply-olive text-sm text-slate-500">Últimos logros desbloqueados.</p>
          </div>
        </div>
        <AchievementShelf achievements={player.achievements} />
      </section>
    </div>
  );
}

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <PlayerProfile params={params} />;
}
