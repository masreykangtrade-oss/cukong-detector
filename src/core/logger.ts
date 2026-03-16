import pino, { LoggerOptions } from 'pino';
import { env } from '../config/env';

const options: LoggerOptions = {
  name: env.appName,
  level: env.logLevel,
  redact: {
    paths: [
      'apiSecret',
      '*.apiSecret',
      'apiKey',
      '*.apiKey',
      'headers.key',
      'headers.sign',
      'token',
      '*.token',
    ],
    remove: true,
  },
  base: {
    app: env.appName,
    env: env.nodeEnv,
  },
};

export const logger = pino(options);

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
