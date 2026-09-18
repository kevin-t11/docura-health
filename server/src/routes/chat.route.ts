import { documentRateLimit } from '@/middleware/rate-limit';
import { chatRequestSchema } from '@/schemas/chat.schema';
import { documentParamsSchema } from '@/schemas/document.schema';
import { chatService } from '@/services';
import { parseInput } from '@/utils/validation.utils';
import { Router } from 'express';

export const chatRouter = Router();

/** GET /api/documents/:id/chat: restore the shared document conversation. */
chatRouter.get('/:id/chat', async (req, res) => {
  const { id } = parseInput(documentParamsSchema, req.params, 'Document not found.', 404);
  const history = await chatService.list(id);
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
  const answer = await chatService.answer(documentId, input);

  res.json(answer);
});
