'use client';

/** Provide a shared TanStack Query cache and retry policy. */
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/lib/document-api';
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: (count, error) =>
              !(error instanceof ApiError && error.status < 500) && count < 1,
            refetchOnWindowFocus: true
          },
          mutations: { retry: false }
        }
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
