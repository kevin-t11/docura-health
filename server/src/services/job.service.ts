import type { DocumentRecord } from '@/domain/document';
import type { DocumentRepository, JobQueue } from '@/domain/ports';

const REQUEUE_AFTER_MS = 30_000;

/**
 * Enqueue documents and recover stuck processing jobs.
 */
export function createJobService(documents: DocumentRepository, queue: JobQueue) {
  let reconciling = false;

  /**
   * Put a document on the processing queue.
   * Marks it failed if the queue is unavailable.
   */
  async function enqueue(document: DocumentRecord) {
    try {
      await queue.enqueue(document.id);
    } catch {
      await markFailed(document);
    }
  }

  /**
   * Re-queue pending documents stuck for more than 30 seconds.
   * No-op if a reconciliation is already running.
   */
  async function reconcile() {
    if (reconciling) {
      return;
    }
    reconciling = true;

    try {
      const pending = await documents.pending();
      for (const document of pending) {
        const waitedMs = Date.now() - Date.parse(document.updatedAt);
        if (waitedMs > REQUEUE_AFTER_MS) {
          await queue.enqueue(document.id);
        }
      }
    } catch {
      console.error('Queue reconciliation failed; will retry.');
    } finally {
      reconciling = false;
    }
  }

  async function markFailed(document: DocumentRecord) {
    const at = new Date().toISOString();
    document.status = 'failed';
    document.error = 'The processing queue is unavailable. Retry when the connection is restored.';
    document.updatedAt = at;
    document.history.push({ status: 'failed', at });
    await documents.save(document);
  }

  return { enqueue, reconcile };
}

export type JobService = ReturnType<typeof createJobService>;
