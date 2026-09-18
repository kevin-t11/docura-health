'use client';

/** GET /api/config: load supported formats and upload limits. */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/document-api';
export function useAppConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: ({ signal }) => api.config(signal),
    staleTime: Infinity
  });
}
