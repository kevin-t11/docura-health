import { z } from 'zod';

const insightSchema = z.object({
  text: z.string(),
  sourceIds: z.array(z.string())
});

export const overviewSchema = z.object({
  summary: insightSchema,
  objective: insightSchema,
  keyPoints: z.array(insightSchema),
  requirements: z.array(insightSchema),
  missingItems: z.array(insightSchema),
  callouts: z.array(insightSchema),
  timeline: z.array(
    z.object({
      date: z.string(),
      event: z.string(),
      sourceIds: z.array(z.string())
    })
  )
});

export const answerSchema = z.object({
  answer: z.string(),
  sourceIds: z.array(z.string()),
  supported: z.boolean()
});
