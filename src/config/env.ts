import path from 'node:path';

function getString(keys: string\[], fallback = ''): string {
  for (const key of keys) {
    const value = process.env\[key];
    if (typeof value === 'string' \&\& value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
}

function getNumber(keys: string\[], fallback: number): number {
  const raw = getString(keys);
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getBoolean(keys: string\[], fallback: boolean): boolean {
  const raw = getString(keys);
  if (!raw) {
    return fallback;
  }
  return \['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function getAllowedUserIds(): number\[] {
  const raw = getString(\['TELEGRAM\_ALLOWED\_USER\_IDS'], '');
  if (!raw) {
    return \[];
  }
  return raw
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) \&\& item > 0);
}

const dataDir = getString(\['DATA\_DIR'], './data');
const logDir = getString(\['LOG\_DIR'], './logs');

export const env = {
  NODE\_ENV: getString(\['NODE\_ENV'], 'development'),
  LOG\_LEVEL: getString(\['LOG\_LEVEL'], 'info'),

  telegramToken: getString(\['TELEGRAM\_BOT\_TOKEN', 'TELEGRAM\_TOKEN']),
  TELEGRAM\_ALLOWED\_USER\_IDS: getAllowedUserIds(),
  TELEGRAM\_BOT\_UI\_ONLY: getBoolean(\['TELEGRAM\_BOT\_UI\_ONLY'], true),

  INDODAX\_PUBLIC\_BASE\_URL: getString(\['INDODAX\_PUBLIC\_BASE\_URL'], 'https://indodax.com'),
  INDODAX\_PRIVATE\_BASE\_URL: getString(\['INDODAX\_PRIVATE\_BASE\_URL'], 'https://indodax.com'),

  HTTP\_TIMEOUT\_MS: getNumber(\['HTTP\_TIMEOUT\_MS'], 10\_000),
  STATE\_FLUSH\_INTERVAL\_MS: getNumber(\['STATE\_FLUSH\_INTERVAL\_MS'], 5\_000),

  DATA\_DIR: path.resolve(dataDir),
  LOG\_DIR: path.resolve(logDir),

  DRY\_RUN: getBoolean(\['DRY\_RUN'], false),
  PAPER\_TRADE: getBoolean(\['PAPER\_TRADE'], false),

  MAX\_POSITION\_SIZE\_IDR: getNumber(\['MAX\_POSITION\_SIZE\_IDR'], 250\_000),
  MAX\_ACTIVE\_POSITIONS: getNumber(\['MAX\_ACTIVE\_POSITIONS'], 5),
  PAIR\_COOLDOWN\_MINUTES: getNumber(\['PAIR\_COOLDOWN\_MINUTES'], 20),
  MAX\_SPREAD\_PCT: getNumber(\['MAX\_SPREAD\_PCT'], 0.8),
  MAX\_SLIPPAGE\_PCT: getNumber(\['MAX\_SLIPPAGE\_PCT'], 1),
};

export function assertCriticalEnv(): void {
  if (!env.telegramToken) {
    throw new Error('TELEGRAM\_BOT\_TOKEN / TELEGRAM\_TOKEN wajib diisi');
  }
}
