import { config } from '@/config/env';
import { documentRateLimit } from '@/middleware/rate-limit';
import { uploadFileSchema } from '@/schemas/upload.schema';
import { uploadService } from '@/services';
import { parseInput } from '@/utils/validation.utils';
import { Router } from 'express';
import multer from 'multer';

export const uploadRouter = Router();

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024, files: 1, fields: 0 }
}).single('file');

/**
 * POST /api/documents
 *
 * Validate an upload and queue processing.
 */
uploadRouter.post('/', documentRateLimit, uploadDocument, async (req, res) => {
  const file = parseInput(uploadFileSchema, req.file, 'Choose a file to upload.');
  const document = await uploadService.upload(file);

  res.status(202).json(document);
});
