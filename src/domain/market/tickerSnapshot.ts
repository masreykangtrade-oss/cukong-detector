import type { PairTickerSnapshot } from '../../core/types';
import { clamp, pct } from '../../utils/math';

interface TickerPoint {
  price: number;
  volumeQuote: number;
  capturedAt: number;
}

export interface TickerFeatureSnapshot {
  pair: string;
  current: PairTickerSnapshot;
  change1m: number;
  change3m: number;
  change5m: number;
  change15m: number;
  volume1m: number;
  volume3m: number;
  volume5m: number;
  volume15mAvg: number;
  volumeAcceleration: number;
  volatilityScore: number;
  momentumScore: number;
}

function sumVolume(points: TickerPoint[]): number {
  return points.reduce((sum, item) => sum + item.volumeQuote, 0);
}

function avg(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function latestPriceBefore(points: TickerPoint[], threshold: number): number | null {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].capturedAt <= threshold) {
      return points[index].price;
    }
  }

  return points[0]?.price ?? null;
}

export class TickerSnapshotStore {
  private readonly history = new Map<string, TickerPoint[]>();

  constructor(private readonly maxPoints = 300) {}

  push(snapshot: PairTickerSnapshot): void {
    const current = this.history.get(snapshot.pair) ?? [];

    current.push({
      price: snapshot.lastPrice,
      volumeQuote: snapshot.volume24hQuote,
      capturedAt: snapshot.timestamp,
    });

    while (current.length > this.maxPoints) {
      current.shift();
    }

    this.history.set(snapshot.pair, current);
  }

  getHistory(pair: string): TickerPoint[] {
    return [...(this.history.get(pair) ?? [])];
  }

  buildFeatures(snapshot: PairTickerSnapshot): TickerFeatureSnapshot {
    this.push(snapshot);

    const points = this.history.get(snapshot.pair) ?? [];
    const now = snapshot.timestamp;

    const price1m = latestPriceBefore(points, now - 60_000);
    const price3m = latestPriceBefore(points, now - 180_000);
    const price5m = latestPriceBefore(points, now - 300_000);
    const price15m = latestPriceBefore(points, now - 900_000);

    const last1m = points.filter((item) => item.capturedAt >= now - 60_000);
    const last3m = points.filter((item) => item.capturedAt >= now - 180_000);
    const last5m = points.filter((item) => item.capturedAt >= now - 300_000);
    const last15m = points.filter((item) => item.capturedAt >= now - 900_000);

    const volume1m = sumVolume(last1m);
    const volume3m = sumVolume(last3m);
    const volume5m = sumVolume(last5m);
    const volume15mAvg = last15m.length > 0 ? sumVolume(last15m) / Math.max(1, last15m.length) : 0;

    const returns = points.slice(-20).map((item, index, arr) => {
      if (index === 0) {
        return 0;
      }

      return Math.abs(pct(arr[index - 1].price, item.price));
    });

    const volatilityScore = clamp(avg(returns) * 10, 0, 100);
    const momentumScore = clamp(
      Math.max(0, pct(price1m ?? snapshot.lastPrice, snapshot.lastPrice)) * 8 +
        Math.max(0, pct(price5m ?? snapshot.lastPrice, snapshot.lastPrice)) * 4,
      0,
      100,
    );

    return {
      pair: snapshot.pair,
      current: snapshot,
      change1m: pct(price1m ?? snapshot.lastPrice, snapshot.lastPrice),
      change3m: pct(price3m ?? snapshot.lastPrice, snapshot.lastPrice),
      change5m: pct(price5m ?? snapshot.lastPrice, snapshot.lastPrice),
      change15m: pct(price15m ?? snapshot.lastPrice, snapshot.lastPrice),
      volume1m,
      volume3m,
      volume5m,
      volume15mAvg,
      volumeAcceleration:
        volume15mAvg > 0 ? clamp((volume1m / volume15mAvg) * 10, 0, 100) : 0,
      volatilityScore,
      momentumScore,
    };
  }
}
