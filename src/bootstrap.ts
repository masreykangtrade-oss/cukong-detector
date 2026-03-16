import { createApp } from './app';
import { logger } from './core/logger';

async function main(): Promise<void> {
  const app = await createApp();
  await app.start();
}

main().catch((error: unknown) => {
  logger.error({ error }, 'bootstrap failed');
  process.exit(1);
});
