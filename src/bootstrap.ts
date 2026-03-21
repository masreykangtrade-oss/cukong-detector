import { mkdir } from 'node:fs/promises';
import 'dotenv/config';

import { serializeError, toError } from './core/error-utils';

interface RuntimeModules {
  createApp: typeof import('./app').createApp;
  env: typeof import('./config/env').env;
  logger: typeof import('./core/logger').logger;
}

async function loadRuntimeModules(): Promise<RuntimeModules> {
  const [{ createApp }, { env }, { logger }] = await Promise.all([
    import('./app'),
    import('./config/env'),
    import('./core/logger'),
  ]);

  return { createApp, env, logger };
}

async function ensureRuntimeDirs(env: RuntimeModules['env']): Promise<void> {
  await mkdir(env.dataDir, { recursive: true });
  await mkdir(env.accountsDir, { recursive: true });
  await mkdir(env.stateDir, { recursive: true });
  await mkdir(env.historyDir, { recursive: true });
  await mkdir(env.backtestDir, { recursive: true });
  await mkdir(env.logDir, { recursive: true });
}

async function runBootstrapPhase<T>(
  phase: string,
  task: () => Promise<T>,
  logger?: RuntimeModules['logger'],
): Promise<T> {
  const startedAt = Date.now();
  logger?.info({ phase }, 'bootstrap phase started');

  try {
    const result = await task();
    logger?.info({ phase, durationMs: Date.now() - startedAt }, 'bootstrap phase completed');
    return result;
  } catch (error) {
    const wrappedError = new Error(`bootstrap phase failed: ${phase}`, {
      cause: toError(error),
    });

    if (logger) {
      logger.error(
        {
          phase,
          durationMs: Date.now() - startedAt,
          error: wrappedError,
        },
        'bootstrap phase failed',
      );
    }

    throw wrappedError;
  }
}

async function main(): Promise<void> {
  const runtime = await runBootstrapPhase('load-runtime-modules', async () => loadRuntimeModules());
  const { createApp, env, logger } = runtime;

  await runBootstrapPhase('ensure-runtime-dirs', async () => ensureRuntimeDirs(env), logger);

  const app = await runBootstrapPhase('create-app', async () => createApp(), logger);
  await runBootstrapPhase('start-app', async () => app.start(), logger);
}

main().catch((error: unknown) => {
  console.error('[bootstrap] startup failed');
  console.error(JSON.stringify({ error: serializeError(error) }, null, 2));
  process.exit(1);
});
