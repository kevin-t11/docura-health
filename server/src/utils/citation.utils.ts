import type { SourceChunk } from '@/domain/document';

/** Validate source references and append citation markers when the answer omits them. */
export function citeAnswer(answer: string, sourceIds: string[], chunks: SourceChunk[]): string {
  const referencedSourceIds = new Set(sourceIds);
  if (referencedSourceIds.size === 0) {
    throw new Error('Chat returned an unknown source reference.');
  }

  const chunkIds = new Set(chunks.map((chunk) => chunk.id));
  for (const id of referencedSourceIds) {
    if (!chunkIds.has(id)) {
      throw new Error('Chat returned an unknown source reference.');
    }
  }

  const referencedMarkers = Array.from(answer.matchAll(/\[(\d+)\]/g), (match) => Number(match[1]));

  if (referencedMarkers.length > 0) {
    for (const marker of referencedMarkers) {
      const chunk = chunks[marker - 1]; // indexes are 1-based in markers
      if (!chunk || !referencedSourceIds.has(chunk.id)) {
        throw new Error('Chat returned invalid inline citations.');
      }
    }
    return answer;
  }

  const markers: string[] = [];
  for (const [index, chunk] of chunks.entries()) {
    if (referencedSourceIds.has(chunk.id)) {
      markers.push(`[${index + 1}]`);
    }
  }

  return `${answer.trim()} ${markers.join(' ')}`;
}
