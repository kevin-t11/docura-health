'use client';

/** List uploaded documents and open the selected document. */
import { useState } from 'react';
import type { DocumentSummary } from '@docura/contracts';
import { formatDate, formatSize } from '@/lib/document-format';
import { DocumentStatusBadge } from '@/components/document-status-badge';
import { DocumentIcon, Search } from '@/components/icons';
import { SearchField } from '@/components/ui/search-field';

export function DocumentLibrary({
  documents,
  onSelect
}: {
  documents: DocumentSummary[];
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = documents.filter((document) =>
    document.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  return (
    <section
      className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6"
      aria-labelledby="library-title">
      <header className="mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch [&_h1]:text-[26px] [&_h1]:font-semibold [&_h1]:leading-[1.3] [&_h1]:tracking-[-.5px] [&_h1]:text-ink [&_p]:mt-1 [&_p]:text-[13px] [&_p]:text-muted-foreground">
        <div>
          <h1 id="library-title">Documents</h1>
          <p>
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} uploaded
          </p>
        </div>
        <SearchField
          className="w-full md:w-70"
          aria-label="Search all documents"
          placeholder="Search documents…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </header>
      {filtered.length > 0 ? (
        <div>
          <div
            className="hidden grid-cols-[minmax(0,1fr)_180px_88px] items-center gap-4 border-b border-border px-4 py-3 text-xs text-muted-foreground md:grid"
            aria-hidden="true">
            <span>Name</span>
            <span>Status</span>
            <span className="hidden text-xs text-muted-foreground md:block">Uploaded</span>
          </div>
          <ul
            className="m-0 list-none p-0 [&>li+li]:border-t [&>li+li]:border-border"
            aria-label="Uploaded documents">
            {filtered.map((document) => (
              <li key={document.id}>
                <button
                  className="grid min-h-19 w-full grid-cols-1 items-center gap-2 rounded-lg py-3 text-left hover:bg-soft focus-visible:-outline-offset-2 md:grid-cols-[minmax(0,1fr)_180px_88px] md:gap-4 md:px-4 [&>[role=status]]:justify-self-start max-md:[&>[role=status]]:ml-8"
                  onClick={() => onSelect(document.id)}
                  aria-label={`Open ${document.name}`}>
                  <span className="flex min-w-0 items-center gap-3 [&>svg]:text-muted-foreground [&>span]:min-w-0 [&_strong]:block [&_strong]:truncate [&_strong]:text-sm [&_strong]:font-medium [&_strong]:text-ink [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground">
                    <DocumentIcon name={document.name} mimeType={document.mimeType} size={20} />
                    <span>
                      <strong title={document.name}>{document.name}</strong>
                      <small>
                        {document.name.split('.').pop()?.toUpperCase()} ·{' '}
                        {formatSize(document.size)}
                      </small>
                    </span>
                  </span>
                  <DocumentStatusBadge status={document.status} mimeType={document.mimeType} />
                  <time
                    className="hidden text-xs text-muted-foreground md:block"
                    dateTime={document.createdAt}>
                    {formatDate(document.createdAt)}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div
          className="px-4 py-6 text-center text-muted-foreground [&>svg]:mx-auto [&>svg]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-2 [&_p]:text-sm"
          role="status">
          <Search size={24} />
          <h3>No matching documents</h3>
          <p>Try another name or clear your search.</p>
          <button
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium whitespace-nowrap border border-border bg-white hover:bg-soft"
            onClick={() => setSearch('')}>
            Clear search
          </button>
        </div>
      )}
    </section>
  );
}
