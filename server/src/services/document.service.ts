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
   * Load a document that belongs to this workspace.
   */
  async function getOwned(documentId: string, workspaceId: string): Promise<DocumentRecord> {
    const document = await deps.documents.get(documentId);
    if (!document || document.workspaceId !== workspaceId) {
      throw new AppError('Document not found.', 404);
    }
    return { ...document, ...toDocumentDetail(document) };
  }

  /** List documents in a workspace. */
  async function list(workspaceId: string): Promise<DocumentSummary[]> {
    const documents = await deps.documents.list(workspaceId);
    return documents.map(toDocumentSummary);
  }

  /** Return details for a document in this workspace. */
  async function detail(documentId: string, workspaceId: string): Promise<DocumentDetail> {
    return toDocumentDetail(await getOwned(documentId, workspaceId));
  }

  /** Load the original file for preview or download. */
  async function file(documentId: string, workspaceId: string) {
    const document = await getOwned(documentId, workspaceId);
    const data = await deps.storage.get(document.storageKey);
    return { name: document.name, mimeType: document.mimeType, data };
  }

  /** Save a user-confirmed name for one speaker in a completed recording. */
  async function renameSpeaker(
    documentId: string,
    workspaceId: string,
    speaker: string,
    name: string
  ) {
    const document = await getOwned(documentId, workspaceId);
    if (document.status !== 'stored' || !document.transcript) {
      throw new AppError('Speaker names can be edited after transcription finishes.', 409);
    }
    if (!document.transcript.segments.some((segment) => segment.speaker === speaker)) {
      throw new AppError('Speaker not found in this recording.', 404);
    }
    await deps.documents.renameSpeaker(documentId, workspaceId, speaker, name);
    return detail(documentId, workspaceId);
  }

  /**
   * Re-queue a failed document for processing.
   */
  async function retry(documentId: string, workspaceId: string): Promise<DocumentDetail> {
    const document = await getOwned(documentId, workspaceId);
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

  return { getOwned, list, detail, file, retry, renameSpeaker };
}

export type DocumentService = ReturnType<typeof createDocumentService>;
