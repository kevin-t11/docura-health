import type { DocumentRecord, SourceChunk, Stage } from '@/domain/document';
import type { Dependencies } from '@/domain/ports';
import { AppError } from '@/errors/app.error';
import { chunkPages, parsePages } from '@/utils/chunking.utils';

const MAX_DOCUMENT_CHUNKS = 1200;
const EMBEDDING_BATCH_SIZE = 64;

/**
 * Extract, chunk, embed, and summarize queued documents.
 */
export function createProcessingService(deps: Dependencies) {
  /**
   * Run ingestion for one document.
   * Skips missing documents and documents already stored.
   */
  async function processDocument(documentId: string) {
    const document = await deps.documents.get(documentId);
    if (!document || document.status === 'stored') {
      return;
    }

    try {
      await runPipeline(document);
    } catch (error) {
      await markFailed(document, error);
      throw error;
    }
  }

  /** Extract text, chunk it, embed it, and store an overview. */
  async function runPipeline(document: DocumentRecord) {
    await saveStage(document, 'started', {
      overview: undefined,
      transcript: undefined,
      chunks: [],
      chunkCount: 0
    });

    const fileBytes = await deps.storage.get(document.storageKey);
    const extracted = await deps.extractor.extract(document, fileBytes);
    await saveStage(document, 'extracted', {
      pageCount: extracted.method === 'audio' ? 0 : extracted.pages.length,
      extraction: extracted.method,
      transcript: extracted.transcript
    });

    const pages = parsePages(extracted.pages);
    await saveStage(document, 'parsed');

    const chunks = chunkPages(document.id, pages);
    if (chunks.length > MAX_DOCUMENT_CHUNKS) {
      throw new AppError('This document is too large. Split it into smaller documents.');
    }
    await saveStage(document, 'chunked', { chunks, chunkCount: chunks.length });

    const vectors = await embedChunks(chunks);
    await saveStage(document, 'embedded');

    await deps.vectors.upsert(
      document,
      chunks.map((chunk, index) => ({ ...chunk, values: vectors[index]! }))
    );

    const overview = await deps.intelligence.overview(chunks);
    await saveStage(document, 'stored', { overview });
  }

  /** Embed passages in batches so large documents stay within model limits. */
  async function embedChunks(chunks: SourceChunk[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let offset = 0; offset < chunks.length; offset += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(offset, offset + EMBEDDING_BATCH_SIZE);
      const texts = batch.map((chunk) => chunk.text);
      vectors.push(...(await deps.intelligence.embed(texts)));
    }

    if (vectors.length !== chunks.length) {
      throw new Error('Embedding count mismatch.');
    }

    return vectors;
  }

  /** Persist a processing stage and optional extra fields. */
  async function saveStage(
    document: DocumentRecord,
    status: Stage,
    extra: Partial<DocumentRecord> = {}
  ) {
    const at = new Date().toISOString();
    Object.assign(document, extra, { status, updatedAt: at, error: undefined });
    document.history.push({ status, at });
    await deps.documents.save(document);
  }

  /** Mark the document failed and log a safe error (no file contents or prompts). */
  async function markFailed(document: DocumentRecord, error: unknown) {
    const at = new Date().toISOString();
    document.status = 'failed';
    document.error =
      error instanceof AppError
        ? error.message
        : 'Processing failed. Check the worker logs and service configuration, then retry.';
    document.updatedAt = at;
    document.history.push({ status: 'failed', at });
    await deps.documents.save(document);

    console.error('Document processing failed', {
      documentId: document.id,
      errorType: error instanceof Error ? error.name : 'UnknownError'
    });
  }

  return { processDocument };
}

export type ProcessingService = ReturnType<typeof createProcessingService>;
