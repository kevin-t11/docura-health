-- Retain the transcript and playable source locations alongside existing documents.
ALTER TABLE "Document" ADD COLUMN "transcript" JSONB;
ALTER TABLE "DocumentChunk"
  ADD COLUMN "startSeconds" DOUBLE PRECISION,
  ADD COLUMN "endSeconds" DOUBLE PRECISION,
  ADD COLUMN "speaker" TEXT;
