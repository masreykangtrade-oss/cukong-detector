import type { SignalCandidate } from '../../core/types';

export class HotlistService {
  private items: SignalCandidate[] = [];

  update(input: SignalCandidate[]): SignalCandidate[] {
    this.items = [...input].sort((a, b) => b.score - a.score).slice(0, 20);
    return this.items;
  }

  list(): SignalCandidate[] {
    return [...this.items];
  }

  top(): SignalCandidate | undefined {
    return this.items[0];
  }
}
