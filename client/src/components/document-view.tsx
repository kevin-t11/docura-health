'use client';

/** Combine document overview, timeline, sources, and chat panels. */
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/motion/tabs';
import { Chat } from '@/components/chat';
import { DocumentStatusBadge } from '@/components/document-status-badge';
import { Book, TimelineIcon, DocumentIcon, Grid, MessageSquareText, Mic } from '@/components/icons';
import { Overview, Timeline } from '@/components/overview';
import { Processing } from '@/components/processing';
import { Sources } from '@/components/sources';
import { formatDate, formatSize } from '@/lib/document-format';
import type { DocumentDetail } from '@docura/contracts';
import { useState } from 'react';

/** Combine document overview, timeline, sources, and chat panels. */
export function DocumentView({ document }: { document: DocumentDetail }) {
  const [tab, setTab] = useState('overview');
  const [source, setSource] = useState<string>();
  const [panel, setPanel] = useState<'document' | 'chat'>('document');

  /** Handle the selection of a source passage. */
  const onSource = (id: string) => {
    setSource(id);
    setTab('sources');
    setPanel('document');
  };

  /** Whether the document is ready to be viewed. */
  const ready = document.status === 'stored';
  const isAudio = document.mimeType.startsWith('audio/');

  return (
    <div
      className="group/workspace grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_clamp(400px,31vw,520px)] max-workspace:flex max-workspace:flex-col"
      data-panel={panel}>
      <nav
        className="hidden shrink-0 gap-1 border-b border-border bg-white px-4 py-2 md:px-6 max-workspace:flex [&_button]:flex [&_button]:min-h-11 [&_button]:items-center [&_button]:justify-center [&_button]:gap-2 [&_button]:rounded-lg [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm [&_button]:font-medium [&_button]:text-muted-foreground [&_button[aria-pressed=true]]:bg-[#e8f0e4] [&_button[aria-pressed=true]]:text-primary-dark max-md:[&_button]:flex-1 max-md:[&_button]:px-2"
        aria-label="Workspace panels">
        <button aria-pressed={panel === 'document'} onClick={() => setPanel('document')}>
          <DocumentIcon name={document.name} mimeType={document.mimeType} size={18} />
          Document
        </button>
        <button aria-pressed={panel === 'chat'} onClick={() => setPanel('chat')}>
          <MessageSquareText size={18} />
          Ask your document
        </button>
      </nav>
      <div className="@container flex min-h-0 min-w-0 flex-col max-workspace:flex-1 max-workspace:group-data-[panel=chat]/workspace:hidden">
        <div className="shrink-0 px-4 pt-3 pb-2 md:px-6 md:pt-4 [&_h1]:line-clamp-2 [&_h1]:min-w-0 [&_h1]:text-[22px] [&_h1]:font-semibold [&_h1]:leading-[1.3] [&_h1]:tracking-[-.5px] [&_h1]:wrap-anywhere [&_h1]:text-ink @max-[561px]:[&_h1]:text-xl max-md:[&_h1]:text-xl">
          <div className="flex items-center gap-3">
            <h1 title={document.name}>{document.name.replace(/\.[^.]+$/, '')}</h1>
            <DocumentStatusBadge status={document.status} mimeType={document.mimeType} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-normal text-muted-foreground [&>*]:whitespace-nowrap [&>*+*]:before:mr-2 [&>*+*]:before:content-['·']">
            <span>{document.name.split('.').pop()?.toUpperCase()}</span>
            <span>{formatSize(document.size)}</span>
            <time
              dateTime={document.createdAt}
              title={`Added ${formatDate(document.createdAt)}`}
              aria-label={`Added ${formatDate(document.createdAt)}`}>
              {formatDate(document.createdAt)}
            </time>
          </div>
        </div>
        {ready ? (
          <Tabs
            value={tab}
            onValueChange={setTab}
            variant="underline"
            className="flex min-h-0 flex-1 flex-col">
            <TabsList
              aria-label="Document views"
              wrapperClassName="shrink-0 border-b border-border px-4 md:px-6"
              className="gap-3 border-0">
              {(
                [
                  ['overview', Grid, 'Overview'],
                  ['timeline', TimelineIcon, 'Timeline'],
                  ['sources', isAudio ? Mic : Book, isAudio ? 'Transcript' : 'Sources']
                ] as const
              ).map(([value, TabIcon, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="min-h-10 gap-2 px-1 py-2 text-[13px] aria-selected:text-primary aria-selected:font-semibold [&>svg]:size-4 [&>span:not([data-tabs-indicator])]:rounded-sm"
                  indicatorClassName="h-0.5">
                  <TabIcon size={16} />
                  {label}
                  {value === 'sources' && (
                    <span className="bg-soft px-1.5 text-xs text-muted-foreground">
                      {document.chunkCount}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <div
              key={tab}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6 [scrollbar-gutter:stable] md:px-6">
              <TabsContent value="overview" className="mt-0">
                <Overview document={document} onSource={onSource} />
              </TabsContent>
              <TabsContent value="timeline" className="mt-0">
                <section className="rounded-xl border border-border bg-white p-5 @max-[561px]:p-4">
                  <div className="mb-3 flex items-center justify-between gap-3 @max-[561px]:flex-wrap [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-ink [&_h3_svg]:size-4.5 [&_h3_svg]:text-primary group-data-[attention=true]/insight:[&_h3]:text-[#79520b] group-data-[attention=true]/insight:[&_h3_svg]:text-[#79520b]">
                    <h3>Every date, in context</h3>
                    <TimelineIcon />
                  </div>
                  <Timeline
                    events={document.overview?.timeline ?? []}
                    chunks={document.chunks}
                    onSource={onSource}
                  />
                </section>
              </TabsContent>
              <TabsContent value="sources" className="mt-0">
                <Sources key={source ?? 'all'} document={document} selected={source} />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <Processing document={document} />
        )}
      </div>
      <Chat key={document.id} document={document} onSource={onSource} />
    </div>
  );
}
