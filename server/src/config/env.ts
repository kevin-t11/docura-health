/** Read server settings from Bun's environment with application defaults. */
export const config = {
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  SESSION_SECRET: process.env.SESSION_SECRET!,
  AWS_REGION: process.env.AWS_REGION!,
  S3_BUCKET: process.env.S3_BUCKET!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  PINECONE_API_KEY: process.env.PINECONE_API_KEY!,
  PINECONE_INDEX: process.env.PINECONE_INDEX!,
  PORT: Number(process.env.PORT ?? 8000),
  MAX_UPLOAD_MB: Number(process.env.MAX_UPLOAD_MB ?? 20),
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL ?? 'gpt-5.6-sol',
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
  OPENAI_EMBEDDING_DIMENSIONS: Number(process.env.OPENAI_EMBEDDING_DIMENSIONS ?? 1536)
};
