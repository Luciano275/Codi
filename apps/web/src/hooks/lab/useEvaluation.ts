'use client';

import { useState, useCallback, useRef } from 'react';
import { apiPost, apiGet } from '@/lib/lab-api';
import type { ConsoleTab } from './types';

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Aceptado',
  WRONG_ANSWER: 'Respuesta incorrecta',
  COMPILATION_ERROR: 'Error de compilación',
  RUNTIME_ERROR: 'Error de ejecución',
  TIME_LIMIT_EXCEEDED: 'Límite de tiempo excedido',
  MEMORY_LIMIT_EXCEEDED: 'Límite de memoria excedido',
};

export function useEvaluation(addConsoleTab: (tab: ConsoleTab) => void) {
  const [evaluating, setEvaluating] = useState(false);
  const gemRewardClaimedRef = useRef(false);

  const handleEvaluate = useCallback(async (
    exercise: { id: string; title: string; gemsReward: number },
    code: string,
    language: string,
    onGemReward: (reward: { amount: number; exerciseTitle: string }) => void,
  ) => {
    if (!exercise) return;
    setEvaluating(true);
    const tabId = `eval_${Date.now()}`;
    addConsoleTab({
      id: tabId,
      label: 'Evaluación',
      type: 'evaluation',
      content: 'Enviando para evaluación...',
    });

    try {
      const result = await apiPost<any>('/api/submissions/evaluate', {
        problemId: exercise.id,
        code,
        language,
      });
      addConsoleTab({
        id: tabId,
        label: 'Evaluación',
        type: 'evaluation',
        content: 'Evaluación enviada. Esperando resultados...',
        status: 'EVALUATING',
      });

      const pollInterval = setInterval(async () => {
        try {
          const submission = await apiGet<any>(`/api/submissions/${result.id}`);
          if (
            submission.status !== 'PENDING' &&
            submission.status !== 'EVALUATING' &&
            submission.status !== 'COMPILING'
          ) {
            clearInterval(pollInterval);
            const score = submission.score ?? 0;
            const label = STATUS_LABELS[submission.status] || submission.status;
            const icon = submission.status === 'ACCEPTED' ? '✅' : '❌';
            const results = submission.cmsResults ?? [];
            const formattedResults = results.map((r: any) => {
              if (r.reason) return `  • ${r.codename}: ${r.reason}`;
              return `  • ${r.codename}: ${r.passed ? 'Aceptado' : 'Incorrecto'}`;
            }).join('\n');
            addConsoleTab({
              id: tabId,
              label: 'Evaluación',
              type: 'evaluation',
              content:
                `${icon} ${label}\n` +
                `Puntaje: ${score}/100\n\n` +
                (formattedResults ? `Resultados:\n${formattedResults}` : ''),
              score,
              status: submission.status,
            });
            setEvaluating(false);

            if (
              submission.status === 'ACCEPTED' &&
              exercise?.gemsReward &&
              exercise.gemsReward > 0 &&
              !gemRewardClaimedRef.current
            ) {
              gemRewardClaimedRef.current = true;
              onGemReward({ amount: exercise.gemsReward, exerciseTitle: exercise.title });
              window.dispatchEvent(new CustomEvent('user-updated'));
            }
          }
        } catch {
          // continue polling
        }
      }, 1500);

      setTimeout(() => {
        clearInterval(pollInterval);
        setEvaluating(false);
      }, 60000);
    } catch (err: any) {
      addConsoleTab({
        id: tabId,
        label: 'Evaluación',
        type: 'evaluation',
        content: '',
        error: err.message,
      });
      setEvaluating(false);
    }
  }, [addConsoleTab]);

  return { evaluating, handleEvaluate, gemRewardClaimedRef };
}
