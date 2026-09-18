import { documentRateLimit } from '@/middleware/rate-limit';
import { getWorkspaceId } from '@/middleware/workspace';
import {
  documentParamsSchema,
  downloadQuerySchema,
  speakerNameSchema
} from '@/schemas/document.schema';
import { documentService } from '@/services';
import { contentDisposition } from '@/utils/file.utils';
import { parseInput } from '@/utils/validation.utils';
import { Router } from 'express';

export const documentRouter = Router();

/** PATCH /api/documents/:id/speakers — save a confirmed name for a transcript speaker. */
documentRouter.patch('/:id/speakers', documentRateLimit, async (req, res) => {
  const { id } = parseInput(documentParamsSchema, req.params, 'Document not found.', 404);
  const { speaker, name } = parseInput(
    speakerNameSchema,
    req.body,
    'Use a speaker name of up to 80 characters.'
  );
  const document = await documentService.renameSpeaker(id, getWorkspaceId(res), speaker, name);
  res.json(document);
});

/**
 * GET /api/documents
 *
 * List uploaded documents for this workspace.
 */
documentRouter.get('/', async (_req, res) => {
  const workspaceId = getWorkspaceId(res);
  const documents = await documentService.list(workspaceId);

  res.json(documents);
});

/**
 * GET /api/documents/:id
 *
 * Return document details and processing status.
 */
documentRouter.get('/:id', async (req, res) => {
  const { id: documentId } = parseInput(
    documentParamsSchema,
    req.params,
    'Document not found.',
    404
  );
  const workspaceId = getWorkspaceId(res);
  const document = await documentService.detail(documentId, workspaceId);

  res.json(document);
});

/**
 * GET /api/documents/:id/file
 *
 * Preview or download the original file.
 */
documentRouter.get('/:id/file', async (req, res) => {
  const { id: documentId } = parseInput(
    documentParamsSchema,
    req.params,
    'Document not found.',
    404
  );
  const query = parseInput(downloadQuerySchema, req.query, 'Invalid download option.');
  const workspaceId = getWorkspaceId(res);
  const file = await documentService.file(documentId, workspaceId);
  const download = query.download === '1';
  const disposition = contentDisposition(file.name, file.mimeType, download);

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', disposition);
  res.setHeader('Accept-Ranges', 'bytes');
  if (req.headers.range) {
    const ranges = req.range(file.data.length);
    if (ranges === -1 || ranges === -2) {
      res.setHeader('Content-Range', `bytes */${file.data.length}`);
      res.status(416).end();
      return;
    }
    if (ranges && ranges.type === 'bytes' && ranges.length === 1) {
      const { start, end } = ranges[0]!;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${file.data.length}`);
      res.status(206).send(file.data.subarray(start, end + 1));
      return;
    }
  }
  res.send(file.data);
});

/**
 * POST /api/documents/:id/retry
 *
 * Queue another processing attempt.
 */
documentRouter.post('/:id/retry', documentRateLimit, async (req, res) => {
  const { id: documentId } = parseInput(
    documentParamsSchema,
    req.params,
    'Document not found.',
    404
  );
  const workspaceId = getWorkspaceId(res);
  const document = await documentService.retry(documentId, workspaceId);

  res.status(202).json(document);
});
