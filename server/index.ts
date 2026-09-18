/** Start the API and reconcile unfinished document jobs. */
import { config } from '@/config/env';
import { app } from '@/app';
import { jobService, closeServices } from '@/services';
await jobService.reconcile();
const reconciliation = setInterval(() => void jobService.reconcile(), 30_000);
const server = app.listen(config.PORT, '0.0.0.0', () =>
  console.log(`Docura API listening on :${config.PORT}`)
);
async function shutdown() {
  clearInterval(reconciliation);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await closeServices();
  process.exit(0);
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
