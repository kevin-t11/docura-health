import {
  Prisma,
  type PrismaClient,
  type DocumentChat as StoredChat
} from '@/generated/prisma/client';
import type { DocumentChat, Citation } from '@/domain/document';
import type { ChatRepository } from '@/domain/ports';

/** Project a saved question and answer into the public conversation. */
function toChat(row: StoredChat): DocumentChat {
  return {
    id: row.id,
    question: row.question,
    status: row.status,
    answer:
      row.answer === null
        ? undefined
        : {
            answer: row.answer,
            citations: row.citations as unknown as Citation[]
          },
    error: row.error ?? undefined,
    createdAt: row.createdAt.toISOString(),
    answeredAt: row.status === 'completed' ? row.updatedAt.toISOString() : undefined
  };
}

/** Persist document conversations independently from document processing updates. */
export function createChatRepository(client: PrismaClient): ChatRepository {
  return {
    async list(documentId) {
      const rows = await client.documentChat.findMany({
        where: { documentId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
      });
      return rows.map(toChat);
    },
    async get(documentId, id) {
      const row = await client.documentChat.findFirst({ where: { id, documentId } });
      return row ? toChat(row) : null;
    },
    async start(documentId, id, question, attemptId) {
      try {
        const retried = await client.documentChat.updateMany({
          where: { id, documentId, question, status: 'failed' },
          data: { status: 'pending', error: null, attemptId }
        });
        if (retried.count) {
          return true;
        }
        const created = await client.documentChat.createMany({
          data: [{ id, documentId, question, attemptId }],
          skipDuplicates: true
        });
        return created.count > 0;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          return false;
        }
        throw error;
      }
    },
    async complete(id, attemptId, result) {
      await client.documentChat.updateMany({
        where: { id, attemptId, status: 'pending' },
        data: {
          status: 'completed',
          answer: result.answer,
          citations: JSON.parse(JSON.stringify(result.citations)) as Prisma.InputJsonValue,
          model: result.model,
          usage: result.usage ? { ...result.usage } : Prisma.DbNull,
          error: null
        }
      });
    },
    async fail(id, attemptId, error) {
      await client.documentChat.updateMany({
        where: { id, attemptId, status: 'pending' },
        data: { status: 'failed', error }
      });
    },
    async expire(documentId, before) {
      await client.documentChat.updateMany({
        where: { documentId, status: 'pending', updatedAt: { lt: before } },
        data: { status: 'failed', error: 'This answer was interrupted. Please retry.' }
      });
    }
  };
}
