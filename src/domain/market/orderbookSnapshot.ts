import type { OrderbookLevel, OrderbookSnapshot } from '../../core/types';
import { clamp } from '../../utils/math';

export interface OrderbookFeatureSnapshot {
  pair: string;
  current: OrderbookSnapshot;
  bestBidSize: number;
  bestAskSize: number;
  bidDepthTop5: number;
  askDepthTop5: number;
  bidDepthTop10: number;
  askDepthTop10: number;
  orderbookImbalance: number;
  depthScore: number;
  spreadBps: number;
  wallPressureScore: number;
}

function sumVolume(levels: OrderbookLevel[], limit: number): number {
  return levels.slice(0, limit).reduce((sum, level) => sum + level.volume, 0);
}

function calcImbalance(bids: number, asks: number): number {
  const total = bids + asks;
  if (total <= 0) {
    return 0;
  }

  return (bids - asks) / total;
}

export class OrderbookSnapshotBuilder {
  build(snapshot: OrderbookSnapshot): OrderbookFeatureSnapshot {
    const bidDepthTop5 = sumVolume(snapshot.bids, 5);
    const askDepthTop5 = sumVolume(snapshot.asks, 5);
    const bidDepthTop10 = sumVolume(snapshot.bids, 10);
    const askDepthTop10 = sumVolume(snapshot.asks, 10);

    const imbalanceTop5 = calcImbalance(bidDepthTop5, askDepthTop5);
    const imbalanceTop10 = calcImbalance(bidDepthTop10, askDepthTop10);

    const spreadBps =
      snapshot.midPrice > 0 ? (snapshot.spread / snapshot.midPrice) * 10_000 : 0;

    const bestBidSize = snapshot.bids[0]?.volume ?? 0;
    const bestAskSize = snapshot.asks[0]?.volume ?? 0;

    const wallPressureScore = clamp(
      Math.max(0, imbalanceTop5) * 60 + Math.max(0, imbalanceTop10) * 40,
      0,
      100,
    );

    const depthScore = clamp(
      Math.log10(Math.max(1, bidDepthTop10 + askDepthTop10)) * 20,
      0,
      100,
    );

    return {
      pair: snapshot.pair,
      current: snapshot,
      bestBidSize,
      bestAskSize,
      bidDepthTop5,
      askDepthTop5,
      bidDepthTop10,
      askDepthTop10,
      orderbookImbalance: imbalanceTop5,
      depthScore,
      spreadBps,
      wallPressureScore,
    };
  }
}
