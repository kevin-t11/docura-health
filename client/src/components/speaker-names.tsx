'use client';

import type { DocumentDetail } from '@docura/contracts';
import { useRenameSpeaker } from '@/hooks/use-document-mutations';
import { message } from '@/lib/document-api';

/** Name each diarized speaker once; blank names restore the automatic label. */
export function SpeakerNames({ document }: { document: DocumentDetail }) {
  const mutation = useRenameSpeaker(document.id);
  const speakers = [...new Set(document.transcript?.segments.map((segment) => segment.speaker))];
  if (!speakers.length) return null;

  return (
    <details className="rounded-lg border border-border bg-white px-3 py-2">
      <summary className="cursor-pointer text-xs font-medium text-primary">Speaker names</summary>
      <p className="mt-2 text-xs text-muted-foreground">
        Use names you can confirm. Leave blank to keep the original label.
      </p>
      <div className="mt-3 space-y-2">
        {speakers.map((speaker) => (
          <form
            key={speaker}
            className="flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();
              mutation.mutate({ speaker, name });
            }}>
            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground">
              <span className="w-16 shrink-0">{speaker}</span>
              <input
                name="name"
                aria-label={`Name for ${speaker}`}
                defaultValue={document.transcript?.speakerNames?.[speaker] ?? ''}
                placeholder="Enter name"
                maxLength={80}
                disabled={mutation.isPending}
                className="h-8 w-full min-w-0 rounded-md border border-border bg-paper px-2 text-base text-ink outline-none focus:border-primary md:text-xs"
              />
            </label>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="h-8 rounded-md px-2 text-xs font-medium text-primary hover:bg-soft">
              {mutation.isPending && mutation.variables.speaker === speaker ? 'Saving…' : 'Save'}
            </button>
          </form>
        ))}
      </div>
      <p role="status" className="mt-2 text-xs text-muted-foreground">
        {mutation.isError
          ? message(mutation.error)
          : mutation.isSuccess
            ? 'Speaker name saved.'
            : ''}
      </p>
    </details>
  );
}
