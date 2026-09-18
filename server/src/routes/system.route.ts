import { config } from '@/config/env';
import { MAX_AUDIO_UPLOAD_MB, supportedExtensions } from '@/constants/upload.constants';
import { Router } from 'express';

export const healthRouter = Router();
export const systemRouter = Router();

/**
 * GET /api/health
 *
 * Report API availability.
 */
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * GET /api/config
 *
 * Return upload limits and supported file formats.
 */
systemRouter.get('/config', (_req, res) => {
  res.json({
    maxUploadMb: config.MAX_UPLOAD_MB,
    maxAudioUploadMb: Math.min(config.MAX_UPLOAD_MB, MAX_AUDIO_UPLOAD_MB),
    supportedExtensions
  });
});
