import { config } from '@/config/env';
import type { DocumentDetail, DocumentRecord, DocumentSummary } from '@/domain/document';
import type { Dependencies } from '@/domain/ports';
import { AppError } from '@/errors/app.error';
import type { JobService } from '@/services/job.service';
import { toDocumentDetail, toDocumentSummary } from '@/utils/document.utils';

type DocumentDeps = Pick<Dependencies, 'documents' | 'storage'>;

/**
 * Document lookup, listing, file access, and retry.
 */
export function createDocumentService(deps: DocumentDeps, jobs: JobService) {
  /**
   * Load a document that belongs to the shared library.
   */
  async function getDocument(documentId: string): Promise<DocumentRecord> {
    const document = await deps.documents.get(documentId);
    if (!document || document.workspaceId !== config.SHARED_WORKSPACE_ID) {
      throw new AppError('Document not found.', 404);
    }
    return { ...document, ...toDocumentDetail(document) };
  }

  /** List documents in the shared library. */
  async function list(): Promise<DocumentSummary[]> {
    const documents = await deps.documents.list(config.SHARED_WORKSPACE_ID);
    return documents.map(toDocumentSummary);
  }

  /** Return details for a document in the shared library. */
  async function detail(documentId: string): Promise<DocumentDetail> {
    return toDocumentDetail(await getDocument(documentId));
  }

  /** Load the original file for preview or download. */
  async function file(documentId: string) {
    const document = await getDocument(documentId);
    const data = await deps.storage.get(document.storageKey);
    return { name: document.name, mimeType: document.mimeType, data };
  }

  /** Save a user-confirmed name for one speaker in a completed recording. */
  async function renameSpeaker(documentId: string, speaker: string, name: string) {
    const document = await getDocument(documentId);
    if (document.status !== 'stored' || !document.transcript) {
      throw new AppError('Speaker names can be edited after transcription finishes.', 409);
    }
    if (!document.transcript.segments.some((segment) => segment.speaker === speaker)) {
      throw new AppError('Speaker not found in this recording.', 404);
    }
    await deps.documents.renameSpeaker(documentId, config.SHARED_WORKSPACE_ID, speaker, name);
    return detail(documentId);
  }

  /**
   * Re-queue a failed document for processing.
   */
  async function retry(documentId: string): Promise<DocumentDetail> {
    const document = await getDocument(documentId);
    if (document.status !== 'failed') {
      throw new AppError('Only failed documents can be retried.', 409);
    }

    const at = new Date().toISOString();
    document.status = 'queued';
    document.error = undefined;
    document.updatedAt = at;
    document.history.push({ status: 'queued', at });

    await deps.documents.save(document);
    await jobs.enqueue(document);
    return toDocumentDetail(document);
  }

  return { getDocument, list, detail, file, retry, renameSpeaker };
}

export type DocumentService = ReturnType<typeof createDocumentService>;
