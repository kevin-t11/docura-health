/** Connect database, storage, extraction, AI, and vector adapters. */
import { config } from '@/config/env';
import type { Dependencies } from '@/domain/ports';
import { createExtractor } from '@/adapters/extractor';
import { createAudioTranscriber } from '@/adapters/audio-transcription';
import { createCloudIntelligence } from '@/adapters/cloud-intelligence';
import { cloudStorage, textractReader } from '@/adapters/cloud-storage';
import { pineconeVectors } from '@/adapters/cloud-data';
import { createDatabase } from '@/adapters/prisma-repository';

export async function createDependencies(): Promise<{
  deps: Dependencies;
  close: () => Promise<void>;
}> {
  const database = createDatabase(config.DATABASE_URL);
  await database.client.$connect();
  return {
    deps: {
      documents: database.documents,
      chats: database.chats,
      storage: cloudStorage(config.AWS_REGION, config.S3_BUCKET),
      extractor: createExtractor(
        textractReader(config.AWS_REGION, config.S3_BUCKET),
        createAudioTranscriber(config.OPENAI_API_KEY)
      ),
      intelligence: createCloudIntelligence(
        config.OPENAI_API_KEY,
        config.OPENAI_CHAT_MODEL,
        config.OPENAI_EMBEDDING_MODEL,
        config.OPENAI_EMBEDDING_DIMENSIONS
      ),
      vectors: pineconeVectors(config.PINECONE_API_KEY, config.PINECONE_INDEX)
    },
    close: database.close
  };
}
