'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useState, useTransition } from 'react';
import { Gem, Lightbulb, LockKeyhole, Sparkles } from '@/components/ui/Icon';
import MarkdownRenderer from '@/components/dashboard/MarkdownRenderer';
import { unlockLessonSmartHint } from './actions';

const SmartHintCelebration = dynamic(() =>
  import('./smart-hint-celebration').then((module) => module.SmartHintCelebration),
);

interface SmartHintCardProps {
  lessonId: string;
  canUnlock: boolean;
  initialHint: string | null;
}

export function SmartHintCard({ lessonId, canUnlock, initialHint }: SmartHintCardProps) {
  const [hint, setHint] = useState<string | null>(initialHint);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const closeCelebration = useCallback(() => setShowCelebration(false), []);

  function unlockHint() {
    startTransition(async () => {
      try {
        const result = await unlockLessonSmartHint(lessonId);
        setHint(result.hint);
        setShowCelebration(true);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'No se pudo desbloquear la pista.');
      }
    });
  }

  if (hint) {
    return (
      <>
        <section className="relative mb-10 overflow-hidden rounded-[1.8rem] border-2 border-[#9fdb58] bg-[#f5ffeb] p-6 shadow-[0_5px_0_#9fdb58]">
          <div
            aria-hidden
            className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-[#d8ff9d] opacity-80"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-[#e5ffc0]"
          />
          <div className="relative flex items-center gap-4">
            <span className="grid h-15 w-15 shrink-0 place-items-center rounded-[1.5rem] border-2 border-[#b6e66c] bg-white text-[#69c507] shadow-[0_4px_0_#b6e66c]">
              <Lightbulb className="h-7 w-7 fill-[#dfff9f]" />
            </span>
            <div>
              <h2 className="font-super-pandora text-xl text-[#365b16]">¡Buena elección!</h2>
              <p className="mt-1 font-simply-olive text-sm text-[#547443]">
                Esta es la clave para seguir avanzando.
              </p>
            </div>
          </div>
          <div className="relative mt-5 rounded-2xl border-2 border-[#c7ed93] bg-white/80 p-5 shadow-sm sm:p-6">
            <MarkdownRenderer content={hint} className="prose-headings:text-[#365b16]" />
          </div>
        </section>
        <SmartHintCelebration open={showCelebration} onClose={closeCelebration} />
      </>
    );
  }

  return (
    <section className="relative mb-10 overflow-hidden rounded-[1.8rem] border-2 border-[#9fdb58] bg-[#f5ffeb] p-6 shadow-[0_5px_0_#9fdb58]">
      <div
        aria-hidden
        className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-[#d8ff9d] opacity-80"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-[#e5ffc0]"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="relative grid h-15 w-15 shrink-0 place-items-center rounded-[1.5rem] border-2 border-[#b6e66c] bg-white text-[#69c507] shadow-[0_4px_0_#b6e66c]">
            <Lightbulb className="h-7 w-7 fill-[#dfff9f]" />
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#69c507] text-white">
              <LockKeyhole className="h-3 w-3" strokeWidth={3} />
            </span>
          </span>
          <div>
            <h2 className="font-super-pandora text-xl text-[#365b16]">¿Necesitás una ayudita?</h2>
            <p className="mt-1 max-w-md font-simply-olive text-sm leading-6 text-[#547443]">
              Usá una Pista Inteligente para descubrir la clave de esta lección.
            </p>
          </div>
        </div>
        {canUnlock ? (
          <button
            type="button"
            onClick={unlockHint}
            disabled={isPending}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border-b-4 border-[#4d9705] bg-[#69c507] px-5 py-3 font-super-pandora text-sm text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#74d20a] active:translate-y-0.5 active:border-b-2 disabled:cursor-wait disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" /> {isPending ? 'Desbloqueando…' : 'Usar mi pista'}
          </button>
        ) : (
          <Link
            href="/dashboard/store"
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#4d9705] bg-[#69c507] px-5 py-3 font-super-pandora text-sm text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#74d20a] active:translate-y-0.5 active:border-b-2"
          >
            <Gem className="h-4 w-4 fill-[#dfff9f]" /> Conseguir pista
          </Link>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="relative mt-4 rounded-xl bg-red-50 px-3 py-2 font-simply-olive text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <SmartHintCelebration open={showCelebration} onClose={closeCelebration} />
    </section>
  );
}
