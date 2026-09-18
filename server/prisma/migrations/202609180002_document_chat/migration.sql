CREATE TYPE "ChatStatus" AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE "ChatExchange" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "status" "ChatStatus" NOT NULL DEFAULT 'pending',
    "answer" TEXT,
    "citations" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,
    "attemptId" UUID NOT NULL,
    "model" TEXT,
    "usage" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatExchange_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChatExchange_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ChatExchange_documentId_createdAt_id_idx" ON "ChatExchange"("documentId", "createdAt", "id");
-- Serialize answers within a document, including requests from different browser tabs.
CREATE UNIQUE INDEX "ChatExchange_one_pending_per_document" ON "ChatExchange"("documentId") WHERE "status" = 'pending';
