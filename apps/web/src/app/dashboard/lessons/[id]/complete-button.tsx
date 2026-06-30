'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Zap, Award, RotateCcw } from 'lucide-react';
import { completeLesson, uncompleteLesson } from './actions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('codi_token');
}

export default function LessonCompleteButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const [displayXp, setDisplayXp] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  const fetchStatus = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/lessons/${lessonId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompleted(data.completed);
        setCompletedAt(data.completedAt);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleComplete = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const data = await completeLesson(lessonId);
      setCompleted(true);
      setCompletedAt(new Date().toISOString());
      setXpAwarded(data.xpAwarded);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const target = xpAwarded ?? 0;
    if (target <= 0) return;

    const duration = 1500;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXp(Math.round(eased * target));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [xpAwarded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="rounded-2xl border border-pradera-200 bg-pradera-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pradera-200">
          <Check className="h-6 w-6 text-pradera-700" />
        </div>
        <p className="font-super-pandora text-lg text-pradera-800">
          ¡Lección completada!
        </p>
        {xpAwarded && (
          <p className="mt-1 flex items-center justify-center gap-1.5 font-candy-beans text-lg text-amber-600">
            <Zap className="h-5 w-5" />
            +{displayXp} XP
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
                await uncompleteLesson(lessonId);
                setCompleted(false);
                setCompletedAt(null);
                setXpAwarded(null);
              } catch {}
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-red-300 hover:text-red-500"
          >
            <RotateCcw className="h-3 w-3" />
            Descompletar lección (dev)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
      <p className="mb-3 font-simply-olive text-sm text-gray-500">
        ¿Terminaste la lección?
      </p>
      <button
        onClick={handleComplete}
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-xl bg-pradera-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pradera-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Award className="h-4 w-4" />
        )}
        {submitting ? 'Completando...' : 'Marcar como completada'}
      </button>
    </div>
  );
}
