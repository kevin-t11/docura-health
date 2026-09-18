/** Store and search document embeddings in Pinecone. */
import { Pinecone } from '@pinecone-database/pinecone';
import type { VectorStore } from '@/domain/ports';
export function pineconeVectors(apiKey: string, name: string): VectorStore {
  const pinecone = new Pinecone({ apiKey });
  return {
    async upsert(document, chunks) {
      const index = pinecone.index({ name, namespace: document.workspaceId });
      for (let i = 0; i < chunks.length; i += 50) {
        await index.upsert({
          records: chunks.slice(i, i + 50).map((chunk) => ({
            id: chunk.id,
            values: chunk.values,
            metadata: {
              documentId: document.id,
              fileName: document.name,
              page: chunk.page,
              location: chunk.location,
              chunkIndex: chunk.index,
              text: chunk.text
            }
          }))
        });
      }
    },
    async search(document, vector, limit) {
      const result = await pinecone.index({ name, namespace: document.workspaceId }).query({
        vector,
        topK: limit,
        filter: { documentId: { $eq: document.id } },
        includeMetadata: true
      });
      // Use canonical persisted chunks; never trust vector metadata as the source of truth.
      const byId = new Map(document.chunks.map((chunk) => [chunk.id, chunk]));
      return (result.matches ?? []).flatMap((match) => {
        const chunk = byId.get(match.id);
        return chunk ? [chunk] : [];
      });
    }
  };
}
