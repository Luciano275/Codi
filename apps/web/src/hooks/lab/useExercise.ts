'use client';

import { useState, useEffect } from 'react';
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
  const [exercise, setExercise] = useState<ExerciseInfo | null>(null);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (problemId) {
      setLoadingExercise(true);
      apiGet<ExerciseInfo>(`/api/problems/${problemId}`)
        .then((data) => {
          setExercise(data);
          const langs = data.availableLanguages ?? ALL_LANGUAGES;
          const effectiveLang = langs.some((l) => l.id === language) ? language : (langs[0]?.id ?? 'python');
          if (effectiveLang !== language) setLanguage(effectiveLang);
          apiGet<{ template: string | null }>(`/api/problems/${problemId}/template?language=${effectiveLang}`)
            .then((tmpl) => {
              if (tmpl.template) setCodeFromTemplate(tmpl.template);
            })
            .catch(() => {});
          apiGet<any[]>(`/api/submissions`).then((subs) => {
            setSubmissions(subs.filter((s: any) => s.problemId === problemId));
          }).catch(() => {});
        })
        .catch(() => {
          setExercise({
            id: problemId,
            title: `Ejercicio #${problemId}`,
            difficulty: 'EASY',
            xpReward: 50,
            gemsReward: 0,
            cmsTaskId: 0,
          });
        })
        .finally(() => setLoadingExercise(false));
    } else {
      setExercise(null);
      setSubmissions([]);
    }
  }, [problemId]);

  useEffect(() => {
    if (!problemId) return;
    const interval = setInterval(() => {
      apiGet<any[]>(`/api/submissions`).then((subs) => {
        setSubmissions((prev) => {
          const updated = subs.filter((s: any) => s.problemId === problemId);
          return updated.length ? updated : prev;
        });
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [problemId]);

  return { exercise, loadingExercise, submissions };
}
