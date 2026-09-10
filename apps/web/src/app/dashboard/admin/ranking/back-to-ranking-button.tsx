'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from '@bprogress/next';

export function BackToRankingButton() {
  const router = useRouter();

  function returnToRanking() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/dashboard/ranking');
  }

  return (
    <button
      type="button"
      onClick={returnToRanking}
      className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-xl px-2 font-super-pandora text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagos-500"
    >
      <ChevronLeft className="h-5 w-5" aria-hidden />
      Volver al ranking
    </button>
  );
}
