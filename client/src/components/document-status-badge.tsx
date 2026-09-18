/** Display the current processing stage in an animated status badge. */
import type { DocumentStatus } from '@docura/contracts';
import { AnimatedBadge } from '@/components/motion/animated-badge';

// Pipeline statuses mark completed steps; describe the work happening next.
const documentStatusLabels: Record<DocumentStatus, string> = {
  queued: 'Queued',
  started: 'Reading document',
  extracted: 'Organizing content',
  parsed: 'Preparing passages',
  chunked: 'Indexing document',
  embedded: 'Creating overview',
  stored: 'Ready',
  failed: 'Needs attention'
};

export function DocumentStatusBadge({
  status,
  mimeType
}: {
  status: DocumentStatus;
  mimeType?: string;
}) {
  const label =
    status === 'started' && mimeType?.startsWith('audio/')
      ? 'Transcribing audio'
      : documentStatusLabels[status];
  return (
    <AnimatedBadge
      size="sm"
      className="h-6 shrink-0 text-xs tracking-normal"
      pulse={false}
      status={status === 'stored' ? 'success' : status === 'failed' ? 'danger' : 'loading'}
      contentKey={status}
      role="status"
      aria-live="polite"
      aria-atomic="true">
      {label}
    </AnimatedBadge>
  );
}
