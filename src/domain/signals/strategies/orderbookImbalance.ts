import type { OrderbookSnapshot } from '../../../core/types';

export function orderbookImbalanceScore(orderbook: OrderbookSnapshot | null): number {
  if (!orderbook) {
    return 0;
  }

  const imbalance = Math.abs(orderbook.imbalanceTop5);
  return Math.max(0, Math.min(16, imbalance \* 20));
}
