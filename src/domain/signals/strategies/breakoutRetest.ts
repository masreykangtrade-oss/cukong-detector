import { clamp } from '../../../utils/math';

export interface BreakoutRetestInput {
  change1m: number;
  change3m: number;
  change5m: number;
  spreadBps: number;
  orderbookImbalance: number;
}

export function breakoutRetestScore(input: BreakoutRetestInput): number {
  const breakoutPressure =
    Math.max(0, input.change3m) * 2.5 +
    Math.max(0, input.change5m) * 1.5 +
    Math.max(0, input.orderbookImbalance) * 10;

  const retestHealthy = input.change1m > -0.6;
  const spreadHealthy = input.spreadBps < 70;

  if (!retestHealthy || !spreadHealthy) {
    return 0;
  }

  return clamp(breakoutPressure, 0, 12);
}
