'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '@/lib/lab-api';
import type { ExerciseInfo } from './types';

const ALL_LANGUAGES = [
  { id: 'python', label: 'Python 3', extension: 'py' },
  { id: 'cpp', label: 'C++', extension: 'cpp' },
];

export function useExercise(
  problemId: string | null,
  language: string,
  setLanguage: (lang: string) => void,
  setCodeFromTemplate: (template: string) => void,
) {
  const appliedRef = useRef(false);

  const exerciseQuery = useQuery({
    queryKey: queryKeys.problems.detail(problemId ?? ''),
    queryFn: () => apiGet<ExerciseInfo>(`/api/problems/${problemId}`),
    enabled: !!problemId,
  });

  const exercise = exerciseQuery.data ?? null;

  useEffect(() => {
    if (!exercise || !problemId) return;
    const langs = exercise.availableLanguages ?? ALL_LANGUAGES;
    const effectiveLang = langs.some((l) => l.id === language) ? language : (langs[0]?.id ?? 'python');
    if (effectiveLang !== language) {
      setLanguage(effectiveLang);
    }
  }, [exercise, problemId, language, setLanguage]);

  const templateQuery = useQuery({
    queryKey: queryKeys.problems.template(problemId ?? '', language),
    queryFn: () =>
      apiGet<{ template: string | null }>(
        `/api/problems/${problemId}/template?language=${language}`,
      ),
    enabled: !!problemId,
  });

  useEffect(() => {
    if (!templateQuery.data?.template || appliedRef.current) return;
    appliedRef.current = true;
    setCodeFromTemplate(templateQuery.data.template);
  }, [templateQuery.data, setCodeFromTemplate]);

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions.all,
    queryFn: () => apiGet<any[]>('/api/submissions'),
    enabled: !!problemId,
    refetchInterval: 5000,
    select: (subs) =>
      subs.filter((s) => s.problemId === problemId),
  });

  return {
    exercise,
    loadingExercise: exerciseQuery.isPending,
    submissions: submissionsQuery.data ?? [],
  };
}
