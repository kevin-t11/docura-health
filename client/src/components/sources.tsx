'use client';

/** Browse source passages and preview or download the original file. */
import { PdfLoading } from '@/components/pdf-loading';
import { AudioTranscriptView } from '@/components/audio-transcript';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/motion/tabs';
import { Download } from '@/components/icons';
import { SearchField } from '@/components/ui/search-field';
import { api } from '@/lib/document-api';
import type { DocumentDetail } from '@docura/contracts';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const PdfPreview = dynamic(() => import('@/components/pdf-preview'), {
  ssr: false,
  loading: PdfLoading
});

export function Sources({ document, selected }: { document: DocumentDetail; selected?: string }) {
  const [view, setView] = useState('text');
  const [search, setSearch] = useState('');

  /** Scroll to the selected source passage when the view changes. */
  useEffect(() => {
    if (selected && view === 'text')
      window.document
        .getElementById(`source-${selected}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selected, view]);

  /** Filter the chunks to match the search query. */
  const chunks = document.chunks.filter((chunk) =>
    chunk.text.toLowerCase().includes(search.toLowerCase())
  );

  if (document.mimeType.startsWith('audio/')) {
    return <AudioTranscriptView document={document} selected={selected} />;
  }

  return (
    <Tabs value={view} onValueChange={setView} variant="segment">
      <div className="flex items-start justify-between gap-4 @max-[561px]:flex-wrap [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_p]:mt-1 [&_p]:text-[13px] [&_p]:text-muted-foreground">
        <div>
          <h2>Check the source</h2>
          <p>Extracted passages linked to the original document.</p>
        </div>
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium whitespace-nowrap border border-border bg-white hover:bg-soft"
          href={`${api.file(document.id)}?download=1`}>
          <Download size={16} />
          Download
        </a>
      </div>
      <div className="my-4 flex flex-wrap justify-between gap-3">
        <TabsList
          aria-label="Source format"
          wrapperClassName="w-auto max-w-full"
          className="border border-border bg-soft p-1">
          <TabsTrigger value="text" className="h-9 px-3 text-[13px]">
            Extracted text
          </TabsTrigger>
          {document.mimeType === 'application/pdf' && (
            <TabsTrigger value="original" className="h-9 px-3 text-[13px]">
              Original PDF
            </TabsTrigger>
          )}
        </TabsList>
        {view === 'text' && (
          <SearchField
            className="w-full sm:w-auto"
            aria-label="Search source passages"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find in document…"
          />
        )}
      </div>
      {document.mimeType === 'application/pdf' && (
        <TabsContent value="original" className="mt-0">
          <PdfPreview
            url={api.file(document.id)}
            initialPage={document.chunks.find((chunk) => chunk.id === selected)?.page ?? 1}
          />
        </TabsContent>
      )}
      <TabsContent value="text" className="mt-0">
        <div className="flex flex-col gap-4">
          {chunks.map((chunk) => (
            <article
              id={`source-${chunk.id}`}
              data-highlighted={selected === chunk.id}
              className="scroll-m-4 rounded-xl border border-border bg-white p-5 data-[highlighted=true]:border-[#799567] data-[highlighted=true]:bg-[#f2f7ee] data-[highlighted=true]:shadow-[0_0_0_2px_#e3ecd9] @max-[561px]:p-4 [&>div]:flex [&>div]:items-center [&>div]:gap-2 [&>div]:text-[13px] [&>div]:text-primary [&_strong]:font-semibold [&_p]:mt-3 [&_p]:text-[15px] [&_p]:leading-[1.7] [&_p]:wrap-anywhere [&_p]:whitespace-pre-wrap [&_p]:text-copy"
              key={chunk.id}>
              <div>
                <span className="grid size-6 place-items-center rounded-sm bg-[#e6eedd] text-xs text-primary">
                  {chunk.index + 1}
                </span>
                <strong>{chunk.location}</strong>
                <span className="ml-auto text-xs text-muted-foreground">
                  Passage {chunk.index + 1}
                </span>
              </div>
              <p>{chunk.text}</p>
            </article>
          ))}
          {!chunks.length && (
            <p className="text-sm leading-[1.65] text-muted-foreground">
              No passages match your search.
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
