'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: async () => {
      const res = await fetch('/api/proxy/api/auth/me');
      const data = await res.json();
      if (!data?.user) throw new Error('No user data');
      return data.user as {
        id: string;
        username: string;
        displayName: string;
        xp: number;
        gems: number;
        level: number;
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvalidateCurrentUser() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
}
