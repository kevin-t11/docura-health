'use client';

/** Restore saved document chat and persist new questions through the API. */
import { useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatAnswer, DocumentChat } from '@docura/contracts';
import { api } from '@/lib/document-api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  citations?: ChatAnswer['citations'];
  failedChat?: DocumentChat;
}

export function useChat(documentId: string) {
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const mutation = useMutation({
    mutationKey: ['chat', documentId],
    mutationFn: ({ id, question }: { id: string; question: string }) =>
      api.chat(documentId, id, question),
    onMutate: async ({ id, question }) => {
      await queryClient.cancelQueries({ queryKey: ['chat', documentId] });
      queryClient.setQueryData<DocumentChat[]>(['chat', documentId], (previous = []) => {
        const existing = previous.find((entry) => entry.id === id);
        if (existing) {
          return previous.map((entry) =>
            entry.id === id ? { ...entry, status: 'pending', error: undefined } : entry
          );
        }
        return [
          ...previous,
          { id, question, status: 'pending', createdAt: new Date().toISOString() }
        ];
      });
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<DocumentChat[]>(['chat', documentId], (previous = []) =>
        previous.some((entry) => entry.id === saved.id)
          ? previous.map((entry) => (entry.id === saved.id ? saved : entry))
          : [...previous, saved]
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['chat', documentId] })
  });
  const history = useQuery({
    queryKey: ['chat', documentId],
    queryFn: ({ signal }) => api.chatHistory(documentId, signal),
    enabled: !mutation.isPending,
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.some((entry) => entry.status === 'pending') ? 1500 : false,
    refetchIntervalInBackground: true
  });
  const conversation = history.data ?? [];
  const busy = mutation.isPending || conversation.some((entry) => entry.status === 'pending');
  const messages = useMemo<ChatMessage[]>(
    () =>
      (history.data ?? []).flatMap((entry) => {
        const user: ChatMessage = {
          id: `${entry.id}-user`,
          role: 'user',
          text: entry.question,
          createdAt: entry.createdAt,
          failedChat: entry.status === 'failed' ? entry : undefined
        };
        return entry.answer
          ? [
              user,
              {
                id: `${entry.id}-assistant`,
                role: 'assistant' as const,
                text: entry.answer.answer,
                createdAt: entry.answeredAt ?? entry.createdAt,
                citations: entry.answer.citations
              }
            ]
          : [user];
      }),
    [history.data]
  );

  async function ask(question: string, id = crypto.randomUUID()) {
    if (submitting.current || busy || !history.isSuccess) return;
    submitting.current = true;
    try {
      return await mutation.mutateAsync({ id, question });
    } finally {
      submitting.current = false;
    }
  }

  return {
    messages,
    ask,
    isPending: busy,
    isLoading: history.isPending,
    historyError: history.error,
    reload: history.refetch,
    error: conversation.some(
      (entry) => entry.id === mutation.variables?.id && entry.status !== 'failed'
    )
      ? null
      : mutation.error,
    reset: mutation.reset
  };
}
