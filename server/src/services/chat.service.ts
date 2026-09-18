import { randomUUID } from 'node:crypto';
import type { DocumentChat, ChatTurn, DocumentRecord, SourceChunk } from '@/domain/document';
import type { Dependencies } from '@/domain/ports';
import { AppError } from '@/errors/app.error';
import type { ChatRequest } from '@/schemas/chat.schema';
import type { DocumentService } from '@/services/document.service';

const MAX_SOURCE_PASSAGES = 6;
const MAX_CONTEXT_CHARACTERS = 48_000;
const STALE_ANSWER_MS = 10 * 60_000;

/** Save document conversations and generate answers using their persisted context. */
export function createChatService(
  deps: Pick<Dependencies, 'intelligence' | 'vectors' | 'chats'>,
  documents: DocumentService
) {
  /** Use full short documents; supplement long-document search with overview sources. */
  async function sourcePassages(document: DocumentRecord, searchText: string) {
    const totalCharacters = document.chunks.reduce((total, chunk) => total + chunk.text.length, 0);
    if (!totalCharacters) {
      throw new AppError(
        'The document text is unavailable. Please upload the document again.',
        409
      );
    }
    if (totalCharacters <= MAX_CONTEXT_CHARACTERS) {
      return document.chunks;
    }

    const [questionVector] = await deps.intelligence.embed([searchText]);
    if (!questionVector) {
      throw new Error('Question embedding failed.');
    }
    const matches = await deps.vectors.search(document, questionVector, MAX_SOURCE_PASSAGES);
    const overview = document.overview;
    const overviewIds = overview
      ? [
          ...overview.missingItems,
          ...overview.requirements,
          ...overview.callouts,
          overview.summary,
          overview.objective,
          ...overview.keyPoints,
          ...overview.timeline
        ].flatMap((insight) => insight.sourceIds)
      : [];
    const byId = new Map(document.chunks.map((chunk) => [chunk.id, chunk]));
    const sourceIds = new Set([
      ...matches.map((chunk) => chunk.id),
      ...overviewIds,
      ...document.chunks.map((chunk) => chunk.id)
    ]);
    const chunks: SourceChunk[] = [];
    let remaining = MAX_CONTEXT_CHARACTERS;
    for (const id of sourceIds) {
      const chunk = byId.get(id);
      if (!chunk?.text.trim()) {
        continue;
      }
      chunks.push({ ...chunk, text: chunk.text.slice(0, remaining) });
      remaining -= chunks[chunks.length - 1]!.text.length;
      if (remaining === 0) {
        break;
      }
    }
    return chunks;
  }

  async function list(documentId: string): Promise<DocumentChat[]> {
    await documents.getDocument(documentId);
    await deps.chats.expire(documentId, new Date(Date.now() - STALE_ANSWER_MS));
    return deps.chats.list(documentId);
  }

  async function answer(documentId: string, input: ChatRequest): Promise<DocumentChat> {
    const document = await documents.getDocument(documentId);
    if (document.status !== 'stored') {
      throw new AppError('Wait for this document to finish processing.', 409);
    }
    await deps.chats.expire(documentId, new Date(Date.now() - STALE_ANSWER_MS));
    const existing = await deps.chats.get(documentId, input.id);
    if (existing && existing.question !== input.question) {
      throw new AppError('This request ID belongs to a different question.', 409);
    }
    const attemptId = randomUUID();
    const claimed = await deps.chats.start(documentId, input.id, input.question, attemptId);
    if (!claimed) {
      const saved = await deps.chats.get(documentId, input.id);
      if (saved) {
        return saved;
      }
      throw new AppError('Another answer is being prepared. Please wait and try again.', 409);
    }

    try {
      const conversation = await deps.chats.list(documentId);
      const history: ChatTurn[] = conversation
        .filter((entry) => entry.status === 'completed' && entry.answer)
        .slice(-4)
        .flatMap((entry) => [
          { role: 'user' as const, content: entry.question.slice(0, 8000) },
          { role: 'assistant' as const, content: entry.answer!.answer.slice(0, 8000) }
        ]);
      const lastQuestion = history.findLast((turn) => turn.role === 'user')?.content;
      const searchText = lastQuestion ? `${lastQuestion}\n${input.question}` : input.question;
      const chunks = await sourcePassages(document, searchText);
      const result = await deps.intelligence.answer(input.question, chunks, history, {
        overview: document.overview,
        speakerNames: document.transcript?.speakerNames,
        fullDocument: chunks === document.chunks
      });
      await deps.chats.complete(input.id, attemptId, result);
    } catch (error) {
      await deps.chats.fail(input.id, attemptId, 'Could not prepare an answer. Please retry.');
      throw error;
    }

    const saved = await deps.chats.get(documentId, input.id);
    if (!saved) {
      throw new AppError('This conversation is no longer available.', 404);
    }
    return saved;
  }

  return { list, answer };
}
