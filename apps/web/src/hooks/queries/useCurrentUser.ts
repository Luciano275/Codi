'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { UserProfile } from '@/lib/auth';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: async () => {
      const res = await fetch('/api/proxy/api/auth/me');
      const data = await res.json();
      if (!data?.user) throw new Error('No user data');
      return data.user as UserProfile;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvalidateCurrentUser() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
}

export function useSetCurrentUser() {
  const queryClient = useQueryClient();

  return useCallback(
    (user: UserProfile) => {
      queryClient.setQueryData(queryKeys.user.me, user);
    },
    [queryClient],
  );
}
