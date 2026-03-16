import type { SignalCandidate } from '../../core/types';

export class HotlistService {
  private hotlist: SignalCandidate\[] = \[];

  update(candidates: SignalCandidate\[], limit = 12): SignalCandidate\[] {
    this.hotlist = \[...candidates]
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);

    return this.hotlist;
  }

  list(): SignalCandidate\[] {
    return this.hotlist;
  }

  get(pair: string): SignalCandidate | undefined {
    return this.hotlist.find((item) => item.pair === pair);
  }
}
