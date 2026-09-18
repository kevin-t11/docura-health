/** Parse input with Zod and return readable validation errors. */
import type { z } from 'zod';
import { AppError } from '@/errors/app.error';
export function parseInput<T>(
  schema: z.ZodType<T>,
  input: unknown,
  message: string,
  statusCode = 400
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(message, statusCode);
  }

  return result.data;
}
