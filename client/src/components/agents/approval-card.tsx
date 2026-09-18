'use client';

/** Show a confirmation action with pending and submitting states. */
// Adapted from beui.dev/components/agents/approval-card for document retries.
import { LoaderCircle, MessageSquareText } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface ApprovalCardProps {
  title: ReactNode;
  description: ReactNode;
  approveLabel: ReactNode;
  status: 'pending' | 'submitting';
  onApprove: () => void;
  className?: string;
}

export function ApprovalCard({
  title,
  description,
  approveLabel,
  status,
  onApprove,
  className
}: ApprovalCardProps) {
  const busy = status === 'submitting';
  return (
    <div
      data-state={status}
      aria-busy={busy}
      className={cn('w-full overflow-hidden rounded-2xl bg-muted p-4 text-sm', className)}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-5 shrink-0 place-items-center text-muted-foreground">
          {busy ? (
            <LoaderCircle className="size-4 motion-safe:animate-spin" />
          ) : (
            <MessageSquareText className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-3">
            <h3 className="min-w-0 flex-1 text-base font-medium leading-5 text-foreground">
              {title}
            </h3>
            <span
              className={cn(
                'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                busy
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              )}>
              {busy ? 'Retrying' : 'Input required'}
            </span>
          </div>
          <p className="mt-1 leading-5 text-muted-foreground">{description}</p>
          <Button size="sm" disabled={busy} onClick={onApprove} className="mt-4 rounded-full">
            {approveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
