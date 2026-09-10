import { Trophy } from 'lucide-react';
import { fetchAdminRankingRewards } from '@/lib/server-api';
import { BackToRankingButton } from './back-to-ranking-button';
import RankingRewardsAdmin from './ranking-rewards-admin';

export const metadata = { title: 'Recompensas del ranking' };

export default async function AdminRankingPage() {
  const rewards = await fetchAdminRankingRewards();
  return (
    <div className="mx-auto w-full max-w-[1800px] pb-6">
      <BackToRankingButton />
      <header className="mt-4 flex items-start gap-4 rounded-3xl bg-castillo-50 px-5 py-6 sm:px-7">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-castillo-200 text-castillo-800 shadow-sm sm:h-16 sm:w-16">
          <Trophy className="h-7 w-7 fill-castillo-400 sm:h-8 sm:w-8" aria-hidden />
        </span>
        <div>
          <h1 className="font-super-pandora text-3xl text-gray-900 lg:text-4xl">
            Recompensas del podio
          </h1>
          <p className="mt-2 font-simply-olive text-base font-medium text-gray-500 lg:text-lg">
            Definí el premio y las gemas de los tres primeros puestos del Ranking.
          </p>
        </div>
      </header>
      <RankingRewardsAdmin initialRewards={rewards} />
    </div>
  );
}
