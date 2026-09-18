/** Compose Express middleware and mount routes under /api. */
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from '@/config/env';
import { healthRouter, systemRouter } from '@/routes/system.route';
import { uploadRouter } from '@/routes/upload.route';
import { documentRouter } from '@/routes/document.route';
import { chatRouter } from '@/routes/chat.route';
import { workspaceSession } from '@/middleware/workspace';
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
app.use(cookieParser(config.SESSION_SECRET));
app.use('/api', workspaceSession, generalRateLimit);
app.use('/api', systemRouter);
app.use('/api/documents', uploadRouter);
app.use('/api/documents', documentRouter);
app.use('/api/documents', chatRouter);
app.use(notFound);
app.use(errorHandler(config.MAX_UPLOAD_MB));
