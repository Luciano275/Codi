import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  fetchCompetitivePlayer,
  type CompetitivePlayerProfile,
  UnauthorizedError,
} from '@/lib/server-api';
import { CompetitiveAchievements } from '@/components/player-profile/CompetitiveAchievements';
import { CompetitivePlayerSheet } from '@/components/player-profile/CompetitivePlayerSheet';
import { getPlayerBannerTheme } from '@/components/player-profile/player-banner';
import styles from '@/components/player-profile/competitive-player.module.css';

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
    <div
      className="mx-auto max-w-6xl space-y-5 pb-2"
      style={getPlayerBannerTheme(player.profileBanner)}
    >
      <Link
        href="/dashboard"
        className={`${styles.backLink} inline-flex items-center gap-2 border-b-2 border-transparent px-1 py-1 font-simply-olive text-sm font-bold text-slate-500 transition`}
      >
        <ChevronLeft className="h-4 w-4" /> Volver al ranking
      </Link>

      <CompetitivePlayerSheet player={player} successRate={successRate} />
      <CompetitiveAchievements achievements={player.achievements} />
    </div>
  );
}

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <PlayerProfile params={params} />;
}
