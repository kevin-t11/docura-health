'use client';

/** GET /api/config: load upload settings and establish the workspace session. */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/document-api';
export function useAppConfig() {
  // Establish one signed workspace cookie before document requests can start.
  return useQuery({
    queryKey: ['config'],
    queryFn: ({ signal }) => api.config(signal),
    staleTime: Infinity
  });
}
