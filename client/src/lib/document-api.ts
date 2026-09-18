import type { AppConfig, DocumentChat, DocumentDetail, DocumentSummary } from '@docura/contracts';
import axios from 'axios';

const UNREACHABLE = 'Could not reach Docura. Check that the API server is running.';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const http = axios.create({
  baseURL: '/api',
  headers: { 'Cache-Control': 'no-store' }
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    if (axios.isAxiosError<{ error?: string }>(error) && error.response) {
      return Promise.reject(
        new ApiError(error.response.data?.error || UNREACHABLE, error.response.status)
      );
    }

    return Promise.reject(new ApiError(UNREACHABLE, 503));
  }
);

async function get<T>(path: string, signal?: AbortSignal) {
  const { data } = await http.get<T>(path, { signal });
  return data;
}

async function post<T>(path: string, body?: unknown, signal?: AbortSignal) {
  const { data } = await http.post<T>(path, body, { signal });
  return data;
}

export const api = {
  /** GET /api/config */
  config: (signal?: AbortSignal) => get<AppConfig>('/config', signal),

  /** GET /api/documents */
  list: (signal?: AbortSignal) => get<DocumentSummary[]>('/documents', signal),

  /** GET /api/documents/:id */
  document: (id: string, signal?: AbortSignal) => get<DocumentDetail>(`/documents/${id}`, signal),

  /** POST /api/documents */
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return post<DocumentDetail>('/documents', form);
  },

  /** POST /api/documents/:id/retry */
  retry: (id: string) => post<DocumentDetail>(`/documents/${id}/retry`),

  /** PATCH /api/documents/:id/speakers */
  renameSpeaker: async (id: string, speaker: string, name: string) => {
    const { data } = await http.patch<DocumentDetail>(`/documents/${id}/speakers`, {
      speaker,
      name
    });
    return data;
  },

  /** POST /api/documents/:id/chat */
  chat: (documentId: string, id: string, question: string) =>
    post<DocumentChat>(`/documents/${documentId}/chat`, { id, question }),

  /** GET /api/documents/:id/chat */
  chatHistory: (id: string, signal?: AbortSignal) =>
    get<DocumentChat[]>(`/documents/${id}/chat`, signal),

  /** Original file URL for preview or download (not an HTTP call). */
  file: (id: string) => `/api/documents/${id}/file`
};

/** Convert an error to a user-friendly message. */
export function message(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
