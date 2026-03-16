import { clamp } from '../../../utils/math';

export interface VolumeSpikeInput {
  volume1m: number;
  volume5m: number;
  volume15mAvg: number;
  change1m: number;
}

export function volumeSpikeScore(input: VolumeSpikeInput): number {
  const baseline = Math.max(1, input.volume15mAvg);
  const ratio1m = input.volume1m / baseline;
  const ratio5m = input.volume5m / Math.max(1, baseline * 5);
  const momentumBonus = Math.max(0, input.change1m) * 1.5;

  return clamp(ratio1m * 10 + ratio5m * 6 + momentumBonus, 0, 18);
}
