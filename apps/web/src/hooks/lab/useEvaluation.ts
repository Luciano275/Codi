'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

const PENDING_STATUSES = new Set(['PENDING', 'EVALUATING', 'COMPILING']);

interface EvaluationResult {
  codename: string;
  passed: boolean;
  reason?: string;
}

interface EvaluationSubmission {
  status: string;
  score: number | null;
  gemsAwarded: boolean;
  cmsResults: EvaluationResult[] | { error?: string } | null;
}

export interface EvaluationOutcome {
  score: number;
  status: string;
}

function formatEvaluationResults(cmsResults: EvaluationSubmission['cmsResults']) {
  if (Array.isArray(cmsResults)) {
    const results = cmsResults
      .map((result) => {
        if (result.reason) return `  • ${result.codename}: ${result.reason}`;
        return `  • ${result.codename}: ${result.passed ? 'Aceptado' : 'Incorrecto'}`;
      })
      .join('\n');

    return results ? `Resultados:\n${results}` : '';
  }

  if (cmsResults?.error) return `Detalle:\n  • ${cmsResults.error}`;

  return '';
}

function formatEvaluationContent(submission: EvaluationSubmission) {
  const score = submission.score ?? 0;
  const label = STATUS_LABELS[submission.status] || submission.status;
  const icon = submission.status === 'ACCEPTED' ? '✅' : '❌';
  const results = formatEvaluationResults(submission.cmsResults);

  return {
    score,
    content: `${icon} ${label}\n` + `Puntaje: ${score}/100\n\n` + results,
  };
}

export function useEvaluation(addConsoleTab: (tab: ConsoleTab) => void) {
  const [evaluating, setEvaluating] = useState(false);
  const evaluatingRef = useRef(false);
  const pollIntervalsRef = useRef<Set<number>>(new Set());
  const pollTimeoutsRef = useRef<Set<number>>(new Set());

  const clearPolling = useCallback(() => {
    pollIntervalsRef.current.forEach((interval) => window.clearInterval(interval));
    pollTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    pollIntervalsRef.current.clear();
    pollTimeoutsRef.current.clear();
  }, []);

  useEffect(() => clearPolling, [clearPolling]);

  const handleEvaluate = useCallback(
    async (
      exercise: { id: string; title: string; gemsReward: number },
      code: string,
      language: string,
      onGemReward: (reward: { amount: number; exerciseTitle: string }) => void,
      onEvaluationComplete: (outcome: EvaluationOutcome) => void,
    ) => {
      if (!exercise || evaluatingRef.current) return;
      evaluatingRef.current = true;
      clearPolling();
      setEvaluating(true);
      const tabId = `eval_${Date.now()}`;
      addConsoleTab({
        id: tabId,
        label: 'Evaluación',
        type: 'evaluation',
        content: 'Enviando para evaluación...',
      });

      try {
        const result = await apiPost<{ id: string }>('/api/submissions/evaluate', {
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

        const stopCurrentPolling = (pollInterval: number, pollTimeout: number) => {
          window.clearInterval(pollInterval);
          window.clearTimeout(pollTimeout);
          pollIntervalsRef.current.delete(pollInterval);
          pollTimeoutsRef.current.delete(pollTimeout);
        };

        let polling = false;
        let active = true;
        const pollInterval = window.setInterval(async () => {
          if (polling || !active) return;
          polling = true;
          try {
            const submission = await apiGet<EvaluationSubmission>(`/api/submissions/${result.id}`);
            if (!active) return;
            if (!PENDING_STATUSES.has(submission.status)) {
              active = false;
              stopCurrentPolling(pollInterval, pollTimeout);
              try {
                const { score, content } = formatEvaluationContent(submission);
                addConsoleTab({
                  id: tabId,
                  label: 'Evaluación',
                  type: 'evaluation',
                  content,
                  score,
                  status: submission.status,
                });
                onEvaluationComplete({ score, status: submission.status });

                if (submission.status === 'ACCEPTED') {
                  window.dispatchEvent(new CustomEvent('user-updated'));
                }

                if (
                  submission.status === 'ACCEPTED' &&
                  score >= 99.999 &&
                  submission.gemsAwarded &&
                  exercise.gemsReward > 0
                ) {
                  onGemReward({ amount: exercise.gemsReward, exerciseTitle: exercise.title });
                }
              } finally {
                setEvaluating(false);
                evaluatingRef.current = false;
              }
            }
          } catch {
            // continue polling
          } finally {
            polling = false;
          }
        }, 500);
        pollIntervalsRef.current.add(pollInterval);

        const pollTimeout = window.setTimeout(() => {
          active = false;
          stopCurrentPolling(pollInterval, pollTimeout);
          setEvaluating(false);
          evaluatingRef.current = false;
        }, 60000);
        pollTimeoutsRef.current.add(pollTimeout);
      } catch (err: any) {
        addConsoleTab({
          id: tabId,
          label: 'Evaluación',
          type: 'evaluation',
          content: '',
          error: err.message,
        });
        setEvaluating(false);
        evaluatingRef.current = false;
      }
    },
    [addConsoleTab, clearPolling],
  );

  return { evaluating, handleEvaluate };
}
