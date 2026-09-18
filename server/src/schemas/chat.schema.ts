import { z } from 'zod';

/** Validate a question and its stable request ID; history comes from the database. */
export const chatRequestSchema = z.object({
  id: z.uuid(),
  question: z.string().trim().min(1).max(2000)
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
