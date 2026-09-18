'use client';

/** Upload and retry documents, refresh query caches, and show notifications. */
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { DocumentDetail, DocumentSummary } from '@docura/contracts';
import { api, message } from '@/lib/document-api';
import { useToasts } from '@/components/providers/toast-provider';
function cacheDocument(client: QueryClient, document: DocumentDetail) {
  client.setQueryData(['documents', 'detail', document.id], document);
  const summary: DocumentSummary = {
    id: document.id,
    name: document.name,
    size: document.size,
    mimeType: document.mimeType,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    status: document.status,
    extraction: document.extraction,
    pageCount: document.pageCount,
    chunkCount: document.chunkCount,
    error: document.error,
    history: document.history
  };
  client.setQueryData<DocumentSummary[]>(['documents', 'list'], (previous) => {
    const existing = previous?.some((item) => item.id === document.id);
    return existing
      ? previous!.map((item) => (item.id === document.id ? summary : item))
      : [summary, ...(previous ?? [])];
  });
  void client.invalidateQueries({ queryKey: ['documents', 'list'] });
}

/** Save a speaker name and refresh every view of the transcript. */
export function useRenameSpeaker(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['rename-speaker', id],
    mutationFn: ({ speaker, name }: { speaker: string; name: string }) =>
      api.renameSpeaker(id, speaker, name),
    onMutate: () => client.cancelQueries({ queryKey: ['documents', 'detail', id] }),
    onSuccess: (document) => cacheDocument(client, document),
    onSettled: () => client.invalidateQueries({ queryKey: ['documents', 'detail', id] })
  });
}
export function useUploadDocument() {
  const client = useQueryClient();
  const { showToast, updateToast } = useToasts();
  return useMutation({
    mutationKey: ['upload-document'],
    mutationFn: api.upload,
    onMutate: async (file) => {
      await client.cancelQueries({ queryKey: ['documents', 'list'] });
      return {
        toastId: showToast({
          title: 'Uploading document',
          description: file.name,
          status: 'loading',
          duration: 0
        })
      };
    },
    onSuccess: (document, _file, context) => {
      cacheDocument(client, document);
      updateToast(context.toastId, {
        title: document.status === 'failed' ? 'Document needs attention' : 'Document uploaded',
        description:
          document.status === 'failed'
            ? document.error
            : 'Processing will continue in your workspace.',
        status: document.status === 'failed' ? 'error' : 'success',
        duration: 5000
      });
    },
    onError: (error, _file, context) => {
      if (context)
        updateToast(context.toastId, {
          title: 'Upload failed',
          description: message(error),
          status: 'error',
          duration: 7000
        });
    }
  });
}
export function useRetryDocument(id: string) {
  const client = useQueryClient();
  const { showToast } = useToasts();
  return useMutation({
    mutationKey: ['retry-document', id],
    mutationFn: () => api.retry(id),
    onMutate: () => client.cancelQueries({ queryKey: ['documents'] }),
    onSuccess: (document) => {
      cacheDocument(client, document);
      showToast({
        title: document.status === 'failed' ? 'Retry unavailable' : 'Processing restarted',
        description: document.error ?? document.name,
        status: document.status === 'failed' ? 'error' : 'success'
      });
    },
    onError: (error) => {
      showToast({
        title: 'Could not retry',
        description: message(error),
        status: 'error'
      });
    }
  });
}
