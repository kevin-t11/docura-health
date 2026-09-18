/** Internal document, page, and embedding types. */
import type { ChatAnswer, DocumentDetail, SourceChunk } from '@docura/contracts';
export type * from '@docura/contracts';
export interface DocumentRecord extends DocumentDetail {
  workspaceId: string;
  storageKey: string;
}
export interface Page {
  number: number;
  text: string;
  location: string;
  startSeconds?: number;
  endSeconds?: number;
  speaker?: string;
}
export interface EmbeddedChunk extends SourceChunk {
  values: number[];
}
export interface GeneratedChatAnswer extends ChatAnswer {
  model?: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}
