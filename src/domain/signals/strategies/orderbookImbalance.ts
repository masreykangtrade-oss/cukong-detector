import { clamp } from '../../../utils/math';

export interface OrderbookImbalanceInput {
  orderbookImbalance: number;
  bestBidSize: number;
  bestAskSize: number;
  wallPressureScore: number;
}

export function orderbookImbalanceScore(input: OrderbookImbalanceInput): number {
  const topSizeBias =
    input.bestAskSize > 0 ? (input.bestBidSize - input.bestAskSize) / input.bestAskSize : 0;

  return clamp(
    Math.max(0, input.orderbookImbalance) * 10 +
      Math.max(0, topSizeBias) * 4 +
      input.wallPressureScore * 0.04,
    0,
    14,
  );
}
