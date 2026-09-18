'use client';

import { ChatMessageView } from '@/components/chat-message';
import { DocuraMark } from '@/components/docura-mark';
import { ArrowRight } from '@/components/icons';
import { Loader } from '@/components/motion/loader';
import { useChat } from '@/hooks/use-chat';
import { message } from '@/lib/document-api';
import type { DocumentDetail } from '@docura/contracts';
import { useEffect, useRef, useState } from 'react';

const suggestions = [
  'What are the next steps?',
  'What information is missing?',
  'What are the important dates?'
];

/** Show document questions, cited answers, and the message composer. */
export function Chat({
  document,
  onSource
}: {
  document: DocumentDetail;
  onSource: (id: string) => void;
}) {
  const chat = useChat(document.id);
  const { messages, isPending: busy } = chat;
  const [question, setQuestion] = useState('');
  const messageList = useRef<HTMLDivElement>(null);

  /** Scroll to the bottom of the message list when new messages are added. */
  useEffect(() => {
    const list = messageList.current;
    if (messages.length && list) list.scrollTo({ top: list.scrollHeight, behavior: 'instant' });
  }, [messages, busy]);

  /** Ask a question about the document. */
  async function ask(text: string, chatId?: string) {
    const value = text.trim();
    if (!value || busy || !ready) return;
    if (!chatId) setQuestion('');
    try {
      await chat.ask(value, chatId);
    } catch {
      if (!chatId) setQuestion(value);
    }
  }

  /** Whether the document is ready to be queried. */
  const ready = document.status === 'stored' && !chat.isLoading && !chat.historyError;

  return (
    <aside
      className="flex min-h-0 min-w-0 flex-col border-l border-border bg-white max-workspace:flex-1 max-workspace:border-l-0 max-workspace:group-data-[panel=document]/workspace:hidden"
      aria-label="Ask your document">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 md:px-6 [&>svg]:text-muted-foreground [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-ink">
        <DocuraMark className="h-5 w-4.5" />
        <h2>Ask your document</h2>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 wrap-anywhere md:px-6 max-workspace:mx-auto max-workspace:w-full max-workspace:max-w-190"
        ref={messageList}
        aria-live="polite"
        aria-relevant="additions text">
        {chat.isLoading ? (
          <div className="flex min-h-32 items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader size={18} label="Loading conversation" />
            <span aria-hidden="true">Loading conversation…</span>
          </div>
        ) : chat.historyError && !messages.length ? (
          <div className="space-y-3 text-sm text-muted-foreground" role="alert">
            <p>Could not load this conversation. Please try again.</p>
            <button
              className="text-primary underline underline-offset-4"
              onClick={() => void chat.reload()}>
              Try again
            </button>
          </div>
        ) : !messages.length ? (
          <div className="[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-[1.35] [&_h3]:tracking-[-.4px] [&_h3]:text-ink [&_p]:mt-2 [&_p]:max-w-95 [&_p]:text-sm [&_p]:leading-[1.65] [&_p]:text-muted-foreground">
            <h3>What would you like to know?</h3>
            <p>
              {ready
                ? 'Explore this document. Every answer links back to its sources.'
                : 'Once your document is ready, you can ask questions about it here.'}
            </p>
            <div className="mt-4 flex flex-col gap-2 [&_button]:flex [&_button]:min-h-11 [&_button]:items-center [&_button]:justify-between [&_button]:gap-3 [&_button]:rounded-lg [&_button]:border [&_button]:border-border [&_button]:p-3 [&_button]:text-left [&_button]:text-[13px] [&_button]:font-medium [&_button]:text-copy [&_button:not(:disabled):hover]:border-[#b8cbb1] [&_button:not(:disabled):hover]:bg-paper [&_svg]:text-primary">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  disabled={!ready || busy}
                  onClick={() => void ask(suggestion)}>
                  {suggestion}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((item) => (
            <ChatMessageView
              key={item.id}
              item={item}
              document={document}
              onSource={onSource}
              retryDisabled={busy || !ready}
              onRetry={() => void ask(item.text, item.failedChat!.id)}
            />
          ))
        )}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader variant="dots" size={24} label="Reading your sources" />
            Reading your sources…
          </div>
        )}
      </div>
      <div className="shrink-0 px-4 py-4 md:px-6 max-workspace:mx-auto max-workspace:w-full max-workspace:max-w-190">
        {chat.error && (
          <p className="my-2 text-[13px] leading-[1.6] wrap-anywhere text-destructive" role="alert">
            {message(chat.error)}
          </p>
        )}
        <form
          className="rounded-xl border border-[#bccdbc] bg-[#fcfdfb] p-3 shadow-[0_2px_5px_#24382f05] focus-within:border-primary focus-within:shadow-[0_0_0_3px_#32684e12]"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(question);
          }}>
          <textarea
            className="block w-full resize-none border-0 bg-transparent text-base leading-[1.6] text-ink outline-none placeholder:text-muted-foreground focus-visible:outline-none md:text-[15px]"
            aria-label="Question about your document"
            placeholder="Ask anything about this document…"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={!ready || busy}
            maxLength={2000}
            rows={2}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void ask(question);
              }
            }}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="submit"
              className="ml-auto grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-white enabled:hover:bg-primary-dark"
              aria-label="Send question"
              disabled={!ready || busy || !question.trim()}>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          AI can make mistakes. Verify important details.
        </p>
      </div>
    </aside>
  );
}
