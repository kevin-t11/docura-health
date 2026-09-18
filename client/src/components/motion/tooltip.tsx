'use client';

/** Display a positioned tooltip with Radix hover, focus, and dismissal behavior. */
import { cn } from '@/lib/cn';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';

type TooltipProps = {
  content: ReactNode;
  children: ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
  wrapperClassName?: string;
};

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 120,
  className,
  wrapperClassName
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <span className={cn('inline-flex align-middle', wrapperClassName)}>
          <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        </span>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            collisionPadding={8}
            className={cn(
              'z-50 max-w-[calc(100vw-16px)] rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-lg',
              className
            )}>
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
