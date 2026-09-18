import type { DocumentDetail, DocumentRecord, DocumentSummary } from '@/domain/document';

/** Convert a document record to a detailed document object. */
export function toDocumentDetail({
  workspaceId: _workspaceId,
  storageKey: _storageKey,
  ...document
}: DocumentRecord): DocumentDetail {
  const names = document.transcript?.speakerNames;
  if (!names) {
    return document;
  }
  return {
    ...document,
    chunks: document.chunks.map((chunk) => {
      const speakerId = chunk.speakerId ?? chunk.speaker;
      const name = speakerId ? names[speakerId] : undefined;
      if (!name || !chunk.speaker) {
        return chunk;
      }
      return {
        ...chunk,
        speakerId,
        speaker: name,
        location: chunk.location.startsWith(`${chunk.speaker} · `)
          ? `${name}${chunk.location.slice(chunk.speaker.length)}`
          : chunk.location
      };
    })
  };
}

/** Convert a document record to a summary document object. */
export function toDocumentSummary(document: DocumentRecord): DocumentSummary {
  const {
    chunks: _chunks,
    overview: _overview,
    transcript: _transcript,
    ...summary
  } = toDocumentDetail(document);
  return summary;
}
