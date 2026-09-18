import type { Page, SourceChunk } from '@/domain/document';
import { AppError } from '@/errors/app.error';

const MAX_DOCUMENT_CHARACTERS = 1_500_000;

/** Normalize extracted text and reject empty or oversized documents. */
export function parsePages(pages: Page[]): Page[] {
  const normalizedPages = pages.map((page) => ({
    ...page,
    text: page.text
      .replaceAll('\0', '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }));
  const totalCharacters = normalizedPages.reduce((total, page) => total + page.text.length, 0);

  if (totalCharacters === 0) {
    throw new AppError('No readable text was found in this document.');
  }

  if (totalCharacters > MAX_DOCUMENT_CHARACTERS) {
    throw new AppError('This document contains too much text. Split it into smaller documents.');
  }

  return normalizedPages;
}

/** Split pages into overlapping passages while preserving their source locations. */
export function chunkPages(
  documentId: string,
  pages: Page[],
  chunkSize = 1600,
  overlap = 200
): SourceChunk[] {
  if (
    !Number.isInteger(chunkSize) ||
    !Number.isInteger(overlap) ||
    chunkSize < 100 ||
    overlap < 0 ||
    overlap >= chunkSize
  ) {
    throw new Error('Invalid chunk size or overlap.');
  }

  const chunks: SourceChunk[] = [];
  for (const page of pages) {
    let start = 0;
    while (start < page.text.length) {
      let end = Math.min(start + chunkSize, page.text.length);
      if (end < page.text.length) {
        const boundary = page.text.lastIndexOf(' ', end);
        if (boundary > start + chunkSize / 2) {
          end = boundary;
        }
      }
      const text = page.text.slice(start, end).trim();
      if (text) {
        chunks.push({
          id: `${documentId}-${chunks.length}`,
          text,
          page: page.number,
          location: page.location,
          startSeconds: page.startSeconds,
          endSeconds: page.endSeconds,
          speaker: page.speaker,
          index: chunks.length
        });
      }
      if (end === page.text.length) {
        break;
      }
      start = page.startSeconds !== undefined ? end : Math.max(start + 1, end - overlap);
    }
  }
  return chunks;
}
