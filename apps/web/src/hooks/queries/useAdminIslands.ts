'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/admin-api';
import { queryKeys } from '@/lib/query-keys';
import type { AdminIsland, AdminIslandMutationData } from '@/lib/server-api';

export function useAdminIslands() {
  return useQuery({
    queryKey: queryKeys.islands.admin.all,
    queryFn: () => adminFetch<AdminIsland[]>('/api/admin/islands'),
  });
}

export function useAdminIsland(id: string) {
  return useQuery({
    queryKey: queryKeys.islands.admin.byId(id),
    queryFn: () => adminFetch<AdminIsland>(`/api/admin/islands/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateAdminIsland() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminIslandMutationData) =>
      adminFetch<AdminIsland>('/api/admin/islands', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateIslandQueries(queryClient),
  });
}

export function useUpdateAdminIsland() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminIslandMutationData> }) =>
      adminFetch<AdminIsland>(`/api/admin/islands/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      invalidateIslandQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.islands.admin.byId(variables.id) });
    },
  });
}

export function useDeleteAdminIsland() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ deleted: true }>(`/api/admin/islands/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateIslandQueries(queryClient),
  });
}

function invalidateIslandQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.islands.admin.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.islands.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.courses.admin.all });
}
