/** Compose Express middleware and mount routes under /api. */
import express from 'express';
import helmet from 'helmet';
import { config } from '@/config/env';
import { healthRouter, systemRouter } from '@/routes/system.route';
import { uploadRouter } from '@/routes/upload.route';
import { documentRouter } from '@/routes/document.route';
import { chatRouter } from '@/routes/chat.route';
import { AppError } from '@/errors/app.error';
import { generalRateLimit } from '@/middleware/rate-limit';
import { errorHandler, notFound } from '@/middleware/errors';

export const app = express();
app.disable('x-powered-by');
// Next.js proxies the API over loopback or the private Docker network.
app.set('trust proxy', ['loopback', 'uniquelocal']);
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: { action: 'sameorigin' }
  })
);
app.use(express.json({ limit: '100kb' }));
app.use('/api', healthRouter);
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.headers['sec-fetch-site'] === 'cross-site'
  ) {
    return next(new AppError('Cross-site requests are not allowed.', 403));
  }
  next();
});
app.use('/api', generalRateLimit);
app.use('/api', systemRouter);
app.use('/api/documents', uploadRouter);
app.use('/api/documents', documentRouter);
app.use('/api/documents', chatRouter);
app.use(notFound);
app.use(errorHandler(config.MAX_UPLOAD_MB));
