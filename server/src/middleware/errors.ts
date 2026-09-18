/** Return safe JSON errors for failed and unmatched requests. */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '@/errors/app.error';

export const notFound: RequestHandler = (_req, _res, next) =>
  next(new AppError('Endpoint not found.', 404));

export function errorHandler(maxUploadMb: number): ErrorRequestHandler {
  return (error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
      res.status(400).json({
        error:
          error.code === 'LIMIT_FILE_SIZE'
            ? `Choose a file smaller than ${maxUploadMb} MB.`
            : 'Upload one file at a time using the file field.'
      });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    if (error instanceof SyntaxError) {
      res.status(400).json({ error: 'Invalid request body.' });
      return;
    }
    console.error('API request failed', {
      errorType: error instanceof Error ? error.name : 'UnknownError'
    });
    res.status(500).json({
      error: 'The request could not be completed. Check the service configuration and try again.'
    });
  };
}
