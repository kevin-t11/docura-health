/** Infrastructure interfaces used by document services. */
import type {
  AudioTranscript,
  DocumentChat,
  GeneratedChatAnswer,
  ChatTurn,
  DocumentRecord,
  EmbeddedChunk,
  Overview,
  Page,
  SourceChunk
} from '@/domain/document';
export interface DocumentRepository {
  get(id: string): Promise<DocumentRecord | null>;
  list(workspaceId: string): Promise<DocumentRecord[]>;
  save(document: DocumentRecord): Promise<void>;
  pending(): Promise<DocumentRecord[]>;
  renameSpeaker(id: string, workspaceId: string, speaker: string, name: string): Promise<void>;
}
export interface FileStorage {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
export interface ChatRepository {
  list(documentId: string): Promise<DocumentChat[]>;
  get(documentId: string, id: string): Promise<DocumentChat | null>;
  start(documentId: string, id: string, question: string, attemptId: string): Promise<boolean>;
  complete(id: string, attemptId: string, answer: GeneratedChatAnswer): Promise<void>;
  fail(id: string, attemptId: string, error: string): Promise<void>;
  expire(documentId: string, before: Date): Promise<void>;
}
export interface TextExtractor {
  extract(
    document: DocumentRecord,
    data: Buffer
  ): Promise<{
    pages: Page[];
    method: NonNullable<DocumentRecord['extraction']>;
    transcript?: AudioTranscript;
  }>;
}
export interface Intelligence {
  embed(texts: string[]): Promise<number[][]>;
  overview(chunks: SourceChunk[]): Promise<Overview>;
  answer(
    question: string,
    chunks: SourceChunk[],
    history: ChatTurn[],
    context: { overview?: Overview; fullDocument: boolean; speakerNames?: Record<string, string> }
  ): Promise<GeneratedChatAnswer>;
}
export interface VectorStore {
  upsert(document: DocumentRecord, chunks: EmbeddedChunk[]): Promise<void>;
  search(document: DocumentRecord, vector: number[], limit: number): Promise<SourceChunk[]>;
}
export interface JobQueue {
  enqueue(id: string): Promise<void>;
  close(): Promise<void>;
}
export interface Dependencies {
  documents: DocumentRepository;
  chats: ChatRepository;
  storage: FileStorage;
  extractor: TextExtractor;
  intelligence: Intelligence;
  vectors: VectorStore;
}
