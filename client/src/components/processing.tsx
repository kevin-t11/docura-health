'use client';

/** Show processing progress and retry controls for failed documents. */
import { useRetryDocument } from '@/hooks/use-document-mutations';
import { ApprovalCard } from '@/components/agents/approval-card';
import { Loader } from '@/components/motion/loader';
import { stages, type DocumentDetail } from '@docura/contracts';
import { message } from '@/lib/document-api';
import { AlertTriangle, Check } from '@/components/icons';
const labels = ['Started', 'Extracted', 'Parsed', 'Chunked', 'Embedded', 'Stored'];
const descriptions = [
  'Preparing your document',
  'Reading the source text',
  'Organizing document content',
  'Connecting passages to sources',
  'Making the document searchable',
  'Preparing your overview'
];
export function Processing({ document }: { document: DocumentDetail }) {
  const retry = useRetryDocument(document.id);
  const current = stages.indexOf(document.status as (typeof stages)[number]);
  const isAudio = document.mimeType.startsWith('audio/');
  return (
    <section
      className="mx-4 mt-2 mb-6 overflow-y-auto rounded-xl border border-border bg-white p-4 text-center md:mx-6 md:p-6 [&_h2]:my-3 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:leading-[1.3] [&_h2]:text-ink md:[&_h2]:text-2xl [&>p]:mx-auto [&>p]:max-w-105 [&>p]:text-sm [&>p]:leading-[1.6] [&>p]:text-muted-foreground"
      aria-live="polite">
      <div
        data-failed={document.status === 'failed'}
        className="mx-auto mb-5 grid size-13 place-items-center rounded-xl bg-[#edf4e6] text-primary data-[failed=true]:bg-[#faf0e4] data-[failed=true]:text-[#95602d]">
        {document.status === 'failed' ? (
          <AlertTriangle size={30} />
        ) : (
          <Loader variant="bars" size={30} label="Processing document" />
        )}
      </div>
      <span className="text-[11px] tracking-[1px] text-muted-foreground">
        DOCUMENT INTELLIGENCE
      </span>
      <h2>
        {document.status === 'failed'
          ? 'This document needs another look'
          : isAudio
            ? 'Understanding your conversation'
            : 'Finding clarity in your document'}
      </h2>
      <p>
        {document.status === 'failed'
          ? document.error
          : document.status === 'queued'
            ? 'Your document is queued. Processing will begin shortly.'
            : isAudio && document.status === 'started'
              ? 'Transcribing speech and identifying speakers. Longer recordings may take a few minutes.'
              : descriptions[Math.min(current + 1, descriptions.length - 1)]}
      </p>
      <ol className="mx-auto my-6 flex max-w-125 list-none flex-wrap justify-between gap-2 p-0">
        {stages.map((stage, index) => (
          <li
            key={stage}
            data-complete={index <= current}
            className="flex min-w-13 flex-1 flex-col items-center gap-2 text-xs text-muted-foreground data-[complete=true]:text-primary [&>span]:grid [&>span]:size-7 [&>span]:place-items-center [&>span]:rounded-full [&>span]:border [&>span]:border-border [&>span]:bg-paper [&>span]:text-xs data-[complete=true]:[&>span]:border-[#d3e1c9] data-[complete=true]:[&>span]:bg-[#e6f0df]">
            <span>{index <= current ? <Check size={14} /> : index + 1}</span>
            {isAudio && stage === 'extracted' ? 'Transcribed' : labels[index]}
          </li>
        ))}
      </ol>
      {document.status === 'failed' ? (
        <ApprovalCard
          title="Try processing again"
          description="Your original file is saved. Try again without uploading it again."
          approveLabel={retry.isPending ? 'Retrying…' : 'Retry processing'}
          status={retry.isPending ? 'submitting' : 'pending'}
          onApprove={() => retry.mutate()}
          className="mx-auto mt-6 max-w-md text-left"
        />
      ) : (
        <p className="text-muted-foreground text-[13px]">
          You can keep working. Your overview will appear here when it’s ready.
        </p>
      )}
      {retry.error && (
        <p className="my-2 text-[13px] leading-[1.6] wrap-anywhere text-destructive" role="alert">
          {message(retry.error)}
        </p>
      )}
    </section>
  );
}
