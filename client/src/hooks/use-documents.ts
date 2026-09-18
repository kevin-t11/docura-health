'use client';

/** GET /api/documents and /api/documents/:id: load and poll processing status. */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/document-api';
import { useAppConfig } from '@/hooks/use-app-config';
const isProcessing = (status: string) => status !== 'stored' && status !== 'failed';
export function useDocuments() {
  const settings = useAppConfig();
  return useQuery({
    queryKey: ['documents', 'list'],
    queryFn: ({ signal }) => api.list(signal),
    enabled: settings.isSuccess,
    refetchInterval: (query) =>
      query.state.data?.some((document) => isProcessing(document.status)) ? 3000 : false,
    refetchIntervalInBackground: true
  });
}
export function useDocument(id?: string) {
  const settings = useAppConfig();
  return useQuery({
    queryKey: ['documents', 'detail', id],
    queryFn: ({ signal }) => api.document(id!, signal),
    enabled: Boolean(id) && settings.isSuccess,
    refetchInterval: (query) =>
      !query.state.data || isProcessing(query.state.data.status) ? 1800 : false,
    refetchIntervalInBackground: true
  });
}
