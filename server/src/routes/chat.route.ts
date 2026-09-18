import { documentRateLimit } from '@/middleware/rate-limit';
import { getWorkspaceId } from '@/middleware/workspace';
import { chatRequestSchema } from '@/schemas/chat.schema';
import { documentParamsSchema } from '@/schemas/document.schema';
import { chatService } from '@/services';
import { parseInput } from '@/utils/validation.utils';
import { Router } from 'express';

export const chatRouter = Router();

/** GET /api/documents/:id/chat: restore this workspace's document conversation. */
chatRouter.get('/:id/chat', async (req, res) => {
  const { id } = parseInput(documentParamsSchema, req.params, 'Document not found.', 404);
  const history = await chatService.list(id, getWorkspaceId(res));
  res.json(history);
});

/** POST /api/documents/:id/chat: save a question and its cited answer. */
chatRouter.post('/:id/chat', documentRateLimit, async (req, res) => {
  const { id: documentId } = parseInput(
    documentParamsSchema,
    req.params,
    'Document not found.',
    404
  );
  const input = parseInput(
    chatRequestSchema,
    req.body,
    'Enter a question of 1–2,000 characters and a valid request ID.'
  );
  const workspaceId = getWorkspaceId(res);
  const answer = await chatService.answer(documentId, workspaceId, input);

  res.json(answer);
});
