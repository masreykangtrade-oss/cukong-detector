import type { TradeJournalEntry } from '../core/types';
import { PersistenceService } from './persistenceService';

export class JournalService {
  private trades: TradeJournalEntry\[] = \[];

  constructor(private readonly persistence: PersistenceService) {}

  async load(): Promise<TradeJournalEntry\[]> {
    const snapshot = await this.persistence.loadAll();
    this.trades = snapshot.trades;
    return this.trades;
  }

  list(): TradeJournalEntry\[] {
    return this.trades;
  }

  async append(entry: TradeJournalEntry): Promise<void> {
    this.trades = \[entry, ...this.trades].slice(0, 1000);
    await this.persistence.saveTrades(this.trades);
  }
}
