'use client';

import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { DocumentDetail } from '@docura/contracts';
import type { ChatMessage } from '@/hooks/use-chat';
import { Message, MessageContent, MessageHeader } from '@/components/agents/message';
import { MessageBubble, MessageBubbleContent } from '@/components/agents/message-bubble';
import { DocuraMark } from '@/components/docura-mark';
import { Check, Copy, DocumentIcon } from '@/components/icons';

/** Render a cited Markdown answer with its saved time and copy action. */
export function ChatMessageView({
  item,
  document,
  onSource,
  onRetry,
  retryDisabled
}: {
  item: ChatMessage;
  document: DocumentDetail;
  onSource: (id: string) => void;
  onRetry: () => void;
  retryDisabled: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetCopy = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const date = new Date(item.createdAt);

  useEffect(() => () => clearTimeout(resetCopy.current), []);

  async function copyMessage() {
    clearTimeout(resetCopy.current);
    try {
      await navigator.clipboard.writeText(item.text);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    resetCopy.current = setTimeout(() => setCopyStatus('idle'), 2000);
  }

  return (
    <Message from={item.role} animateIn className="mb-6">
      <MessageContent>
        <MessageHeader className="min-h-7 w-full gap-2 text-sm font-semibold text-foreground">
          {item.role === 'assistant' && <DocuraMark className="h-4.5 w-4" />}
          <span>{item.role === 'user' ? 'You' : 'Docura'}</span>
        </MessageHeader>
        <MessageBubble
          variant={item.role === 'user' ? 'tint' : 'ghost'}
          animateIn={false}
          className="max-w-full">
          <MessageBubbleContent className="break-words text-[15px] leading-relaxed">
            {item.role === 'user' ? (
              <p className="whitespace-pre-wrap">{item.text}</p>
            ) : (
              <div className="min-w-0 space-y-3 whitespace-normal [&_p]:my-2 [&_li]:my-1 [&_li>p]:my-1 [&_strong]:font-semibold [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-[15px] [&_h4]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:max-w-full [&_pre]:whitespace-pre [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border-b [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_hr]:border-border [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  disallowedElements={['img']}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="max-w-full overflow-x-auto rounded-lg border border-border">
                        <table className="w-full border-collapse text-sm">{children}</table>
                      </div>
                    )
                  }}>
                  {item.text}
                </Markdown>
              </div>
            )}
          </MessageBubbleContent>
        </MessageBubble>
        {item.failedChat && (
          <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>{item.failedChat.error}</span>
            <button
              className="text-primary underline underline-offset-4"
              disabled={retryDisabled}
              onClick={onRetry}>
              Retry answer
            </button>
          </div>
        )}
        {!!item.citations?.length && (
          <div className="mt-3 flex flex-wrap gap-2 [&_button]:flex [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-lg [&_button]:border [&_button]:border-border [&_button]:bg-paper [&_button]:p-2 [&_button]:text-xs [&_button]:text-primary-dark [&_button:hover]:border-primary max-md:[&_button]:min-h-11">
            {item.citations.map((citation) => {
              const chunk = document.chunks.find((source) => source.id === citation.id);
              const label = chunk?.speaker
                ? citation.label.replace(
                    /^(\[\d+\]\s*).*/,
                    (_match, prefix) => `${prefix}${chunk.location}`
                  )
                : citation.label;
              return (
                <button key={citation.id} onClick={() => onSource(citation.id)}>
                  <DocumentIcon name={document.name} mimeType={document.mimeType} size={12} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
        <div className="pointer-events-none flex items-center gap-2 opacity-0 group-hover/message:pointer-events-auto group-hover/message:opacity-100 group-focus-within/message:pointer-events-auto group-focus-within/message:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
          <time
            dateTime={item.createdAt}
            title={date.toLocaleString()}
            className="text-[11px] font-normal tabular-nums text-muted-foreground">
            {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </time>
          <button
            type="button"
            onClick={() => void copyMessage()}
            aria-label={copyStatus === 'copied' ? 'Message copied' : 'Copy message'}
            title={copyStatus === 'copied' ? 'Copied' : 'Copy message'}
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {copyStatus === 'copied' ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <span role="status" className="sr-only">
          {copyStatus === 'copied'
            ? 'Message copied'
            : copyStatus === 'failed'
              ? 'Could not copy. Select the message text and copy it manually.'
              : ''}
        </span>
      </MessageContent>
    </Message>
  );
}
