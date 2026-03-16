import type { BotSettings, TradingMode } from '../../core/types';
import { PersistenceService } from '../../services/persistenceService';

export class SettingsService {
  private settings: BotSettings | null = null;

  constructor(private readonly persistence: PersistenceService) {}

  async load(): Promise<BotSettings> {
    const snapshot = await this.persistence.loadAll();
    this.settings = snapshot.settings;
    return this.settings;
  }

  get(): BotSettings {
    if (!this.settings) {
      throw new Error('Settings not loaded');
    }
    return this.settings;
  }

  async replace(next: BotSettings): Promise<void> {
    this.settings = next;
    await this.persistence.saveSettings(next);
  }

  async setTradingMode(mode: TradingMode): Promise<BotSettings> {
    const current = this.get();
    const next = { ...current, tradingMode: mode };
    await this.replace(next);
    return next;
  }

  async patchRisk(partial: Partial<BotSettings\['risk']>): Promise<BotSettings> {
    const current = this.get();
    const next = { ...current, risk: { ...current.risk, ...partial } };
    await this.replace(next);
    return next;
  }

  async patchStrategy(partial: Partial<BotSettings\['strategy']>): Promise<BotSettings> {
    const current = this.get();
    const next = { ...current, strategy: { ...current.strategy, ...partial } };
    await this.replace(next);
    return next;
  }
}
