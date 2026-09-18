import type { DocumentDetail, DocumentRecord } from '@/domain/document';
import type { Dependencies } from '@/domain/ports';
import type { UploadFile } from '@/schemas/upload.schema';
import type { JobService } from '@/services/job.service';
import { toDocumentDetail } from '@/utils/document.utils';
import { sanitizeFileName, validateDocumentFile } from '@/utils/file.utils';

type UploadDeps = Pick<Dependencies, 'documents' | 'storage'>;

/** Store an upload and queue it for processing. */
export function createUploadService(deps: UploadDeps, jobs: JobService) {
  /** Validate the file, persist it, and enqueue processing. */
  async function upload(workspaceId: string, file: UploadFile): Promise<DocumentDetail> {
    const mimeType = validateDocumentFile(file);
    const id = crypto.randomUUID();
    const at = new Date().toISOString();
    const document: DocumentRecord = {
      id,
      workspaceId,
      storageKey: id,
      name: sanitizeFileName(file.originalname),
      mimeType,
      size: file.size,
      createdAt: at,
      updatedAt: at,
      status: 'queued',
      pageCount: 0,
      chunkCount: 0,
      chunks: [],
      history: [{ status: 'queued', at }]
    };

    await deps.storage.put(document.storageKey, file.buffer, mimeType);
    try {
      await deps.documents.save(document);
    } catch (error) {
      await deps.storage.remove(document.storageKey);
      throw error;
    }

    await jobs.enqueue(document);
    return toDocumentDetail(document);
  }

  return { upload };
}

export type UploadService = ReturnType<typeof createUploadService>;
