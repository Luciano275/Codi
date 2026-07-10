'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { adminFetch } from '@/lib/admin-api';

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  level: number;
  region: string;
  xpReward: number;
  order: number;
  _count?: { modules: number };
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
    mutationFn: (data: {
      title: string;
      slug: string;
      level: number;
      region: string;
      xpReward: number;
      order: number;
    }) =>
      adminFetch('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.admin.all });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<{
      title: string;
      slug: string;
      level: number;
      region: string;
      xpReward: number;
      order: number;
    }>) =>
      adminFetch(`/api/admin/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.admin.byId(variables.id) });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.admin.all });
    },
  });
}
