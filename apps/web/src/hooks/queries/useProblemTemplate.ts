'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiGet } from '@/lib/lab-api';

export function useProblemTemplate(problemId: string | null, language: string) {
  return useQuery({
    queryKey: queryKeys.problems.template(problemId ?? '', language),
    queryFn: () =>
      apiGet<{ template: string | null }>(
        `/api/problems/${problemId}/template?language=${language}`,
      ),
    enabled: !!problemId,
  });
}
