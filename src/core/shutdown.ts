import { logger } from './logger';

export type ShutdownHandler = () => Promise<void>;

export interface ShutdownRegistration {
  register: (handler: ShutdownHandler) => void;
  trigger: (signal?: NodeJS.Signals) => Promise<void>;
}

export function createShutdownManager(): ShutdownRegistration {
  const handlers: ShutdownHandler[] = [];
  let closing = false;

  async function trigger(signal?: NodeJS.Signals): Promise<void> {
    if (closing) {
      return;
    }

    closing = true;
    logger.info({ signal }, 'Shutdown sequence started');

    try {
      for (const handler of handlers) {
        await handler();
      }

      logger.info({ signal }, 'Shutdown sequence completed');
    } catch (error) {
      logger.error(
        { error, signal },
        'Shutdown sequence failed',
      );
    } finally {
      process.exit(signal === 'SIGINT' ? 130 : 0);
    }
  }

  return {
    register(handler: ShutdownHandler): void {
      handlers.push(handler);
    },
    trigger,
  };
}

export function registerShutdown(handlers: ShutdownHandler[]): void {
  const manager = createShutdownManager();

  for (const handler of handlers) {
    manager.register(handler);
  }

  process.on('SIGINT', () => {
    void manager.trigger('SIGINT');
  });

  process.on('SIGTERM', () => {
    void manager.trigger('SIGTERM');
  });
}
