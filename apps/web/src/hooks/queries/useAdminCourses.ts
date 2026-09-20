'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { adminFetch } from '@/lib/admin-api';

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  level: number;
  xpReward: number;
  order: number;
  islandId: string | null;
  _count?: { modules: number };
}

export interface CourseMutationData {
  title: string;
  level: number;
  xpReward: number;
  order: number;
  islandId?: string;
}

export function useAdminCoursesList() {
  return useQuery({
    queryKey: queryKeys.courses.admin.all,
    queryFn: () => adminFetch<AdminCourse[]>('/api/admin/courses'),
  });
}

export function useAdminCourseById(id: string) {
  return useQuery({
    queryKey: queryKeys.courses.admin.byId(id),
    queryFn: () =>
      adminFetch<{
        id: string;
        title: string;
        slug: string;
        level: number;
        modules: {
          id: string;
          title: string;
          order: number;
          _count: { lessons: number };
        }[];
      }>(`/api/admin/courses/${id}`),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CourseMutationData) =>
      adminFetch('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.admin.all });
      queryClient.invalidateQueries({ queryKey: ['islands', 'admin'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.islands.all });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CourseMutationData>) =>
      adminFetch(`/api/admin/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.admin.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.admin.all });
      queryClient.invalidateQueries({ queryKey: ['islands', 'admin'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.islands.all });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.admin.all });
      queryClient.invalidateQueries({ queryKey: ['islands', 'admin'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.islands.all });
    },
  });
}
