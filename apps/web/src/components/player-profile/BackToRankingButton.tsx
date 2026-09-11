'use client';

import { useRouter } from '@bprogress/next';
import { ChevronLeft } from '@/components/ui/Icon';
import styles from './competitive-player.module.css';

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
      className={`${styles.backLink} inline-flex cursor-pointer items-center gap-2 border-b-2 border-transparent px-1 py-1 font-simply-olive text-sm font-bold text-slate-500 transition`}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden /> Volver al ranking
    </button>
  );
}
