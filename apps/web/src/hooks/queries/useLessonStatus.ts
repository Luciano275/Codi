'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { adminFetch } from '@/lib/admin-api';
import { completeLesson, uncompleteLesson } from '@/app/dashboard/lessons/[id]/actions';

export function useLessonStatus(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.status(lessonId),
    queryFn: () =>
      adminFetch<{ completed: boolean; completedAt: string }>(
        `/api/lessons/${lessonId}/status`,
      ),
  });
}

export function useCompleteLesson(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completeLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.status(lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
      window.dispatchEvent(new CustomEvent('user-updated'));
    },
  });
}

export function useUncompleteLesson(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => uncompleteLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.status(lessonId) });
    },
  });
}
