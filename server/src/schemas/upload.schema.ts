import { supportedExtensions } from '@/constants/upload.constants';
import { z } from 'zod';

export const fileExtensionSchema = z.enum(supportedExtensions);

export const uploadFileSchema = z.object({
  originalname: z.string().min(1),
  size: z.number().int().nonnegative(),
  buffer: z.instanceof(Buffer)
});

export type UploadFile = z.infer<typeof uploadFileSchema>;
