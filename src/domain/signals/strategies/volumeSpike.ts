import type { TickerSnapshot } from '../../../core/types';

export function volumeSpikeScore(snapshot: TickerSnapshot): number {
  const recent = snapshot.volume1m + snapshot.volume3m \* 0.5;
  const baseline = Math.max(1, snapshot.volume15m / 3);
  const ratio = recent / baseline;
  return Math.max(0, Math.min(22, ratio \* 8));
}
