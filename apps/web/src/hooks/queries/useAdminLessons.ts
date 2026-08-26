'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { adminFetch } from '@/lib/admin-api';

export type LessonType = 'THEORY' | 'PRACTICE' | 'CHALLENGE' | 'EXAM';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface AdminCourse {
  id: string;
  title: string;
  modules: { id: string; title: string }[];
}

export interface AdminProblem {
  id: string;
  cmsTaskId: number;
  cmsTaskName: string;
  title: string;
  difficulty: Difficulty;
  xpReward: number;
  gemsReward: number;
}

export interface AdminLesson {
  id: string;
  title: string;
  type: LessonType;
  order: number;
  xpReward: number;
  content: Record<string, unknown>;
  resources: {
    image: { url: string; fileName: string | null; contentType: string | null } | null;
    pdf: { url: string; fileName: string | null } | null;
    video: { url: string; fileName: string | null; contentType: string | null } | null;
  };
  module: { id: string; title: string; course: { id: string; title: string } };
  problems: AdminProblem[];
}

export function useAdminLessons() {
  return useQuery({
    queryKey: queryKeys.lessons.admin.all,
    queryFn: () => adminFetch<AdminLesson[]>('/api/admin/lessons'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminCourses() {
  return useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: () => adminFetch<AdminCourse[]>('/api/courses'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminProblems() {
  return useQuery({
    queryKey: ['problems', 'admin'] as const,
    queryFn: () => adminFetch<AdminProblem[]>('/api/admin/problems'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/lessons/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.admin.all });
    },
  });
}
