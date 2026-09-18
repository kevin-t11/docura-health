/** Create Redis-backed BullMQ queues and document workers. */
import { Queue, Worker } from 'bullmq';
import type { JobQueue } from '@/domain/ports';
const queueName = 'docura-ingestion';
function redisConnection(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: Number(parsed.pathname.slice(1) || 0),
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {})
  };
}
export function cloudQueue(url: string, name = queueName): JobQueue {
  const queue = new Queue(name, {
    connection: { ...redisConnection(url), maxRetriesPerRequest: 1 }
  });
  queue.on('error', (error) => console.error('Queue connection error', error.name));
  return {
    async enqueue(id) {
      const previous = await queue.getJob(id);
      if (previous) {
        const state = await previous.getState();
        if (state === 'failed') {
          await previous.retry();
          return;
        }
        if (state !== 'completed') {
          return;
        }
        await previous.remove();
      }
      await queue.add(
        'process',
        { documentId: id },
        {
          jobId: id,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 1000 }
        }
      );
    },
    close: async () => {
      await queue.close();
    }
  };
}
export function cloudWorker(
  url: string,
  processDocument: (id: string) => Promise<void>,
  name = queueName
) {
  const worker = new Worker(name, async (job) => processDocument(job.data.documentId), {
    connection: { ...redisConnection(url), maxRetriesPerRequest: null },
    concurrency: 2,
    lockDuration: 120_000
  });
  worker.on('error', (error) => console.error('Worker error', error.name));
  worker.on('failed', (job) =>
    console.error('Job attempt failed', {
      id: job?.id,
      attempts: job?.attemptsMade
    })
  );
  return worker;
}
