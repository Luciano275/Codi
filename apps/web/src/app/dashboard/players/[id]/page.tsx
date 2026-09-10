import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  fetchCompetitivePlayer,
  type CompetitivePlayerProfile,
  UnauthorizedError,
} from '@/lib/server-api';
import { CompetitiveAchievements } from '@/components/player-profile/CompetitiveAchievements';
import { CompetitivePlayerSheet } from '@/components/player-profile/CompetitivePlayerSheet';
import { CompetitiveRewards } from '@/components/player-profile/CompetitiveRewards';
import { BackToRankingButton } from '@/components/player-profile/BackToRankingButton';
import { getPlayerBannerTheme } from '@/components/player-profile/player-banner';

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
      <BackToRankingButton />

      <CompetitivePlayerSheet player={player} successRate={successRate} />
      <CompetitiveAchievements achievements={player.achievements} />
      <CompetitiveRewards rewards={player.rewards} />
    </div>
  );
}

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <PlayerProfile params={params} />;
}
