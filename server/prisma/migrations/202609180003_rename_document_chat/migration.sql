ALTER TABLE "ChatExchange" RENAME TO "DocumentChat";
ALTER TABLE "DocumentChat" RENAME CONSTRAINT "ChatExchange_pkey" TO "DocumentChat_pkey";
ALTER TABLE "DocumentChat" RENAME CONSTRAINT "ChatExchange_documentId_fkey" TO "DocumentChat_documentId_fkey";
ALTER INDEX "ChatExchange_documentId_createdAt_id_idx" RENAME TO "DocumentChat_documentId_createdAt_id_idx";
ALTER INDEX "ChatExchange_one_pending_per_document" RENAME TO "DocumentChat_one_pending_per_document";
