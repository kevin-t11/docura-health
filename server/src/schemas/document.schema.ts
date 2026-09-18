import { z } from 'zod';

export const documentParamsSchema = z.object({ id: z.string().uuid() });

/** A blank name restores the automatic speaker label. */
export const speakerNameSchema = z
  .object({
    speaker: z.string().min(1).max(80),
    name: z
      .string()
      .trim()
      .max(80)
      .regex(/^[^\p{Cc}\p{Cf}]*$/u)
  })
  .strict();

export const downloadQuerySchema = z.object({
  download: z.enum(['0', '1']).optional()
});
