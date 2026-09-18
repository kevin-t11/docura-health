import { cloudWorker } from '@/adapters/queue';
import { config } from '@/config/env';
import { createDependencies } from '@/container';
import { createProcessingService } from '@/services/processing.service';

const { deps, close } = await createDependencies();

const { processDocument } = createProcessingService(deps);

const worker = cloudWorker(config.REDIS_URL, processDocument);
console.log('Document ingestion worker started.');

/** Shutdown the worker and close dependencies. */
async function shutdown() {
  await worker.close();
  await close();
  process.exit(0);
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
