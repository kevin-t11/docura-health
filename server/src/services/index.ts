import { cloudQueue } from '@/adapters/queue';
import { config } from '@/config/env';
import { createDependencies } from '@/container';
import { createChatService } from '@/services/chat.service';
import { createDocumentService } from '@/services/document.service';
import { createJobService } from '@/services/job.service';
import { createUploadService } from '@/services/upload.service';

const { deps, close } = await createDependencies();
const queue = cloudQueue(config.REDIS_URL);

export const jobService = createJobService(deps.documents, queue);
export const documentService = createDocumentService(deps, jobService);
export const uploadService = createUploadService(deps, jobService);
export const chatService = createChatService(deps, documentService);

/** Close shared services during shutdown. */
export async function closeServices() {
  await queue.close();
  await close();
}
