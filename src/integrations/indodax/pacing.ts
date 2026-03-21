import { env } from '../../config/env';
import { RequestPacer } from '../../core/requestPacer';

export type PublicLane = 'public_market_scan';
export type PrivateLane =
  | 'private_live_trading'
  | 'private_reconciliation'
  | 'private_recovery';

const publicPacer = new RequestPacer('indodax-public', [
  {
    name: 'public_market_scan',
    priority: 40,
    minIntervalMs: env.indodaxPublicMinIntervalMs,
    coalesce: true,
  },
]);

const privatePacersByAccount = new Map<string, RequestPacer>();

export function getPublicPacer(): RequestPacer {
  return publicPacer;
}

export function getPrivatePacer(accountId: string): RequestPacer {
  const key = accountId.trim().toLowerCase();
  const existing = privatePacersByAccount.get(key);
  if (existing) {
    return existing;
  }

  const pacer = new RequestPacer(`indodax-private:${key}`, [
    {
      name: 'private_live_trading',
      priority: 100,
      minIntervalMs: env.indodaxPrivateLiveMinIntervalMs,
      coalesce: false,
    },
    {
      name: 'private_reconciliation',
      priority: 80,
      minIntervalMs: env.indodaxPrivateReconcileMinIntervalMs,
      coalesce: true,
    },
    {
      name: 'private_recovery',
      priority: 30,
      minIntervalMs: env.indodaxPrivateRecoveryMinIntervalMs,
      coalesce: true,
    },
  ]);

  privatePacersByAccount.set(key, pacer);
  return pacer;
}
