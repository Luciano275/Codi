'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { adminFetch } from '@/lib/admin-api';

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; order: number; courseId: string }) =>
      adminFetch('/api/admin/modules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.admin.byId(variables.courseId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.admin.all });
      queryClient.invalidateQueries({ queryKey: ['islands', 'admin'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.islands.all });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; title: string; order: number; courseId: string }) =>
      adminFetch(`/api/admin/modules/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: data.title, order: data.order }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.admin.byId(variables.courseId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.admin.all });
      queryClient.invalidateQueries({ queryKey: ['islands', 'admin'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.islands.all });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; courseId: string }) =>
      adminFetch(`/api/admin/modules/${data.id}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.admin.byId(variables.courseId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.admin.all });
      queryClient.invalidateQueries({ queryKey: ['islands', 'admin'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.islands.all });
    },
  });
}
