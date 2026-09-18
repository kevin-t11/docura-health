/** Persist documents, passages, and processing events with Prisma. */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@/generated/prisma/client';
import type { AudioTranscript, DocumentRecord, Overview } from '@/domain/document';
import type { DocumentRepository } from '@/domain/ports';
import { createChatRepository } from '@/adapters/chat-repository';
const relations = {
  chunks: { orderBy: { index: 'asc' as const } },
  events: { orderBy: { sequence: 'asc' as const } }
};
type StoredDocument = Prisma.DocumentGetPayload<{ include: typeof relations }>;
function fromDatabase(document: StoredDocument): DocumentRecord {
  return {
    id: document.id,
    workspaceId: document.workspaceId,
    storageKey: document.storageKey,
    name: document.name,
    mimeType: document.mimeType,
    size: document.size,
    status: document.status,
    extraction: document.extraction as DocumentRecord['extraction'],
    pageCount: document.pageCount,
    chunkCount: document.chunkCount,
    error: document.error ?? undefined,
    overview: document.overview ? (document.overview as unknown as Overview) : undefined,
    transcript: document.transcript
      ? (document.transcript as unknown as AudioTranscript)
      : undefined,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    chunks: document.chunks.map(
      ({ documentId: _documentId, startSeconds, endSeconds, speaker, ...chunk }) => ({
        ...chunk,
        startSeconds: startSeconds ?? undefined,
        endSeconds: endSeconds ?? undefined,
        speaker: speaker ?? undefined
      })
    ),
    history: document.events.map((event) => ({
      status: event.status,
      at: event.at.toISOString()
    }))
  };
}
function prismaRepository(client: PrismaClient): DocumentRepository {
  return {
    /** Update one speaker alias atomically without rewriting passages or other names. */
    async renameSpeaker(id, workspaceId, speaker, name) {
      await client.$executeRaw`
        UPDATE "Document"
        SET "transcript" = jsonb_set(
          "transcript", '{speakerNames}',
          CASE WHEN ${name}::text = ''
            THEN COALESCE("transcript"->'speakerNames', '{}'::jsonb) - ${speaker}::text
            ELSE COALESCE("transcript"->'speakerNames', '{}'::jsonb)
              || jsonb_build_object(${speaker}::text, ${name}::text)
          END
        ), "updatedAt" = NOW()
        WHERE "id" = ${id}::uuid AND "workspaceId" = ${workspaceId}::uuid
          AND "status" = 'stored' AND "transcript" IS NOT NULL
      `;
    },
    async get(id) {
      const document = await client.document.findUnique({
        where: { id },
        include: relations
      });
      return document ? fromDatabase(document) : null;
    },
    async list(workspaceId) {
      return (
        await client.document.findMany({
          where: { workspaceId },
          orderBy: { createdAt: 'desc' },
          include: { events: relations.events }
        })
      ).map((document) => fromDatabase({ ...document, chunks: [] }));
    },
    async pending() {
      return (
        await client.document.findMany({
          where: { status: { notIn: ['stored', 'failed'] } },
          include: { events: relations.events }
        })
      ).map((document) => fromDatabase({ ...document, chunks: [] }));
    },
    async save(document) {
      await client.$transaction(
        async (transaction) => {
          await transaction.workspace.upsert({
            where: { id: document.workspaceId },
            create: { id: document.workspaceId },
            update: {}
          });
          const data = {
            workspaceId: document.workspaceId,
            storageKey: document.storageKey,
            name: document.name,
            mimeType: document.mimeType,
            size: document.size,
            status: document.status,
            // Compatibility with the existing schema; no runtime mode selection.
            mode: 'cloud',
            extraction: document.extraction ?? null,
            pageCount: document.pageCount,
            chunkCount: document.chunkCount,
            error: document.error ?? null,
            overview: document.overview
              ? (JSON.parse(JSON.stringify(document.overview)) as Prisma.InputJsonValue)
              : Prisma.DbNull,
            transcript: document.transcript
              ? (JSON.parse(JSON.stringify(document.transcript)) as Prisma.InputJsonValue)
              : Prisma.DbNull,
            createdAt: new Date(document.createdAt),
            updatedAt: new Date(document.updatedAt)
          };
          await transaction.document.upsert({
            where: { id: document.id },
            create: { id: document.id, ...data },
            update: data
          });
          await transaction.documentChunk.deleteMany({
            where: { documentId: document.id }
          });
          if (document.chunks.length) {
            await transaction.documentChunk.createMany({
              data: document.chunks.map((chunk) => ({
                ...chunk,
                documentId: document.id
              }))
            });
          }
          // Append history idempotently; retried writes cannot duplicate completed transitions.
          await transaction.processingEvent.createMany({
            data: document.history.map((event, sequence) => ({
              documentId: document.id,
              sequence,
              status: event.status,
              at: new Date(event.at)
            })),
            skipDuplicates: true
          });
        },
        { timeout: 30_000 }
      );
    }
  };
}
export function createDatabase(url: string) {
  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000
    })
  });
  return {
    client,
    documents: prismaRepository(client),
    chats: createChatRepository(client),
    close: () => client.$disconnect()
  };
}
