'use client';

/** Compose accessible chat messages with headers and content. */
// beui.dev/components/agents/message

import { MessageSideContext } from '@/components/agents/message-context';
import { cn } from '@/lib/cn';
import { motion, useReducedMotion } from 'motion/react';
import { type ComponentPropsWithRef, createContext, type ReactNode, useContext } from 'react';

type MessageFrom = 'user' | 'assistant';

interface MessageContextValue {
  from: MessageFrom;
}

const MessageContext = createContext<MessageContextValue>({
  from: 'assistant'
});

export interface MessageProps extends Omit<
  ComponentPropsWithRef<typeof motion.article>,
  'children'
> {
  from: MessageFrom;
  /** Plays a trailing-edge pop-up once when this message row mounts. */
  animateIn?: boolean;
  children: ReactNode;
}

export type MessageContentProps = ComponentPropsWithRef<'div'>;
export type MessageHeaderProps = ComponentPropsWithRef<'div'>;

// A sent row should rise from the live edge without changing measured layout.
const MESSAGE_POP_UP = {
  type: 'spring',
  stiffness: 480,
  damping: 32,
  mass: 0.62
} as const;

export function Message({
  from,
  animateIn = false,
  children,
  className,
  initial,
  animate,
  transition,
  exit,
  style,
  ...props
}: MessageProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <MessageSideContext.Provider value={from === 'user' ? 'end' : 'start'}>
      <MessageContext.Provider value={{ from }}>
        <motion.article
          data-slot="message"
          data-from={from}
          aria-label={props['aria-label'] ?? `${from} message`}
          initial={
            initial ??
            (animateIn && !reduce
              ? {
                  opacity: 0,
                  transform: 'translateY(8px) scale(0.95)'
                }
              : false)
          }
          animate={
            animate ??
            (animateIn && !reduce
              ? {
                  opacity: 1,
                  transform: 'translateY(0px) scale(1)'
                }
              : { opacity: 1 })
          }
          exit={
            exit ??
            (reduce
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  transform: 'translateY(-3px) scale(0.99)'
                })
          }
          transition={transition ?? (reduce ? { duration: 0.12 } : MESSAGE_POP_UP)}
          style={style}
          className={cn(
            'group/message flex w-full items-start gap-2',
            from === 'user'
              ? 'flex-row-reverse origin-bottom-right'
              : 'flex-row origin-bottom-left',
            className
          )}
          {...props}>
          {children}
        </motion.article>
      </MessageContext.Provider>
    </MessageSideContext.Provider>
  );
}

export function MessageContent({ className, ...props }: MessageContentProps) {
  const { from } = useContext(MessageContext);

  return (
    <div
      data-slot="message-content"
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1.5',
        from === 'user' ? 'items-end' : 'items-start',
        className
      )}
      {...props}
    />
  );
}

export function MessageHeader({ className, ...props }: MessageHeaderProps) {
  const { from } = useContext(MessageContext);

  return (
    <div
      data-slot="message-header"
      className={cn(
        'flex items-center gap-1.5 px-1 text-[11px] leading-none text-muted-foreground',
        from === 'user' ? 'justify-end' : 'justify-start',
        className
      )}
      {...props}
    />
  );
}
