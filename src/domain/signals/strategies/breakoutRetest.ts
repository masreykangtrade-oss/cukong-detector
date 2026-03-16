import type { TickerSnapshot } from '../../../core/types';

export function breakoutRetestScore(snapshot: TickerSnapshot): number {
  const breakout = snapshot.change5m > 1.25 \&\& snapshot.change15m > 2;
  const controlledSpread = snapshot.spreadPct < 0.9;
  return breakout \&\& controlledSpread ? 14 : 0;
}
