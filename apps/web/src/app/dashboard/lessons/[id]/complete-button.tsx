'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Zap, Award, RotateCcw } from 'lucide-react';
import {
  useLessonStatus,
  useCompleteLesson,
  useUncompleteLesson,
} from '@/hooks/queries/useLessonStatus';
import { RewardCelebration } from '@/components/ui/RewardCelebration';

export default function LessonCompleteButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const { data, isLoading } = useLessonStatus(lessonId);
  const completeMutation = useCompleteLesson(lessonId);
  const uncompleteMutation = useUncompleteLesson(lessonId);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const [showXpCelebration, setShowXpCelebration] = useState(false);
  const [error, setError] = useState('');

  const completed = data?.completed ?? false;
  const completedAt = data?.completedAt ?? null;

  const handleComplete = async () => {
    if (completeMutation.isPending) return;
    setError('');
    try {
      const result = await completeMutation.mutateAsync();
      setXpAwarded(result.xpAwarded);
      setShowXpCelebration(result.xpAwarded > 0);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error al completar la lección');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (completed) {
    return (
      <>
        <div className="rounded-2xl border border-pradera-200 bg-pradera-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pradera-200">
            <Check className="h-6 w-6 text-pradera-700" />
          </div>
          <p className="font-super-pandora text-lg text-pradera-800">¡Lección completada!</p>
          {xpAwarded !== null && xpAwarded > 0 && (
            <p className="mt-1 flex items-center justify-center gap-1.5 font-candy-beans text-lg text-amber-600">
              <Zap className="h-5 w-5" />+{xpAwarded} XP
            </p>
          )}
          {completedAt && (
            <p className="mt-1 text-xs text-pradera-500">
              Completado el {new Date(completedAt).toLocaleDateString('es-AR')}
            </p>
          )}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={async () => {
                try {
                  await uncompleteMutation.mutateAsync();
                  setXpAwarded(null);
                  setShowXpCelebration(false);
                } catch {}
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-red-300 hover:text-red-500"
            >
              <RotateCcw className="h-3 w-3" />
              Descompletar lección (dev)
            </button>
          )}
        </div>
        <RewardCelebration
          reward={
            showXpCelebration && xpAwarded && xpAwarded > 0
              ? {
                  kind: 'xp',
                  amount: xpAwarded,
                  title: '¡Lección completada!',
                  detail: 'Tu progreso acaba de subir de nivel.',
                }
              : null
          }
          onDismiss={() => setShowXpCelebration(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
        <p className="mb-3 font-simply-olive text-sm text-gray-500">¿Terminaste la lección?</p>
        {error && (
          <p className="mb-3 rounded-lg bg-volcan-50 px-3 py-2 text-xs font-medium text-volcan-600">
            {error}
          </p>
        )}
        <button
          onClick={handleComplete}
          disabled={completeMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-pradera-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pradera-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {completeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Award className="h-4 w-4" />
          )}
          {completeMutation.isPending ? 'Completando...' : 'Marcar como completada'}
        </button>
      </div>
      <RewardCelebration
        reward={
          showXpCelebration && xpAwarded && xpAwarded > 0
            ? {
                kind: 'xp',
                amount: xpAwarded,
                title: '¡Lección completada!',
                detail: 'Tu progreso acaba de subir de nivel.',
              }
            : null
        }
        onDismiss={() => setShowXpCelebration(false)}
      />
    </>
  );
}
