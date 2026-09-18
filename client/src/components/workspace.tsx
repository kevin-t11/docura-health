'use client';

import { DocumentLibrary } from '@/components/document-library';
import { DocumentView } from '@/components/document-view';
import { EmptyState } from '@/components/empty-state';
import { AlertTriangle } from '@/components/icons';
import { Loader } from '@/components/motion/loader';
import { Sidebar } from '@/components/sidebar';
import { useAppConfig } from '@/hooks/use-app-config';
import { useDocument, useDocuments } from '@/hooks/use-documents';
import { message } from '@/lib/document-api';
import type { DocumentDetail } from '@docura/contracts';
import { useState } from 'react';

type WorkspaceView = { kind: 'library' } | { kind: 'upload' } | { kind: 'document'; id: string };

export function Workspace() {
  const settings = useAppConfig();
  const list = useDocuments();
  const documents = list.data ?? [];
  const config = settings.data;
  const error = settings.error || list.error;
  const loading = !error && (settings.isPending || list.isPending);
  const [view, setView] = useState<WorkspaceView>({ kind: 'library' });
  const selectedId = view.kind === 'document' ? view.id : undefined;
  const detail = useDocument(selectedId);

  /** Refresh the workspace state. */
  const refresh = async () => {
    const result = await settings.refetch();
    if (result.isSuccess) {
      void list.refetch();
      if (selectedId) void detail.refetch();
    }
  };

  /** Handle the upload of a new document. */
  const onUploaded = (document: DocumentDetail) => {
    setView({ kind: 'document', id: document.id });
  };

  return (
    <div className="flex h-dvh overflow-hidden max-md:flex-col">
      <a className="fixed -top-15 left-3 z-110 bg-white p-2.5 focus:top-2.5" href="#main-content">
        Skip to content
      </a>
      <Sidebar
        documents={documents}
        selectedId={selectedId}
        showUpload={view.kind === 'upload'}
        showLibrary={view.kind === 'library'}
        loading={loading}
        onSelect={(id) => {
          setView({ kind: 'document', id });
        }}
        onUpload={() => setView({ kind: 'upload' })}
        onLibrary={() => setView({ kind: 'library' })}
      />
      <main id="main-content" className="flex min-h-0 min-w-0 flex-1 flex-col">
        {(error || detail.error) && (
          <div
            className="flex shrink-0 items-center gap-2 border-b border-[#efdfc8] bg-[#fff4e8] px-4 py-3 text-[13px] text-[#80512e] md:px-6 [&_button]:ml-auto [&_button]:underline"
            role="alert">
            <AlertTriangle size={16} />
            <span>{message(error || detail.error)}</span>
            <button
              onClick={() => {
                void refresh();
              }}>
              Reconnect
            </button>
          </div>
        )}
        {view.kind === 'upload' || (view.kind === 'library' && !documents.length && !loading) ? (
          <EmptyState config={config} onUploaded={onUploaded} />
        ) : view.kind === 'library' && !loading ? (
          <DocumentLibrary
            documents={documents}
            onSelect={(id) => setView({ kind: 'document', id })}
          />
        ) : detail.data ? (
          <DocumentView key={detail.data.id} document={detail.data} />
        ) : (
          <div
            className="flex flex-1 items-center justify-center gap-3 text-muted-foreground"
            role="status">
            <Loader size={24} label="Opening your workspace" />
            Opening your workspace…
          </div>
        )}
      </main>
    </div>
  );
}
