import path from 'node:path';
import { env } from '../config/env';
import type {
  AccountsMeta,
  BotSettings,
  PairMetrics,
  PersistenceSnapshot,
  RuntimeOrder,
  RuntimePosition,
  RuntimeState,
  SignalCandidate,
  TradeJournalEntry,
} from '../core/types';
import { JsonStore } from '../storage/jsonStore';

const defaultRuntimeState = (): RuntimeState => ({
  started: false,
  startedAt: null,
  updatedAt: new Date().toISOString(),
  uptimeMs: 0,
  lastSignalAt: null,
  lastTradeAt: null,
  lastErrorAt: null,
  lastErrorMessage: null,
  marketWatcherRunning: false,
  tradingMode: 'OFF',
  pairCooldowns: {},
  cacheStats: { hit: 0, miss: 0 },
  pollingStats: { activeJobs: 0, tickCount: 0, lastTickAt: null },
});

const defaultAccountsMeta = (): AccountsMeta => ({
  lastUpdatedAt: null,
  defaultAccountId: null,
  source: 'manual',
  totalAccounts: 0,
});

const defaultSettings = (): BotSettings => ({
  tradingMode: 'OFF',
  dryRun: env.DRY\_RUN,
  paperTrade: env.PAPER\_TRADE,
  uiOnly: env.TELEGRAM\_BOT\_UI\_ONLY,
  strategy: {
    scoreWatchlistThreshold: 60,
    scoreAlertThreshold: 75,
    scoreAutoEntryThreshold: 85,
    enableVolumeSpike: true,
    enableOrderbookImbalance: true,
    enableSilentAccumulation: true,
    enableBreakoutRetest: true,
    enableHotRotation: true,
  },
  risk: {
    maxModalPerTrade: env.MAX\_POSITION\_SIZE\_IDR,
    maxActivePositionsTotal: env.MAX\_ACTIVE\_POSITIONS,
    maxActivePositionsPerAccount: 2,
    maxExposurePerPair: 1,
    cooldownMinutesPerPair: env.PAIR\_COOLDOWN\_MINUTES,
    maxSlippagePct: env.MAX\_SLIPPAGE\_PCT,
    maxSpreadPct: env.MAX\_SPREAD\_PCT,
    minLiquidityScore: 25,
    orderFillTimeoutMs: 15\_000,
    cancelStaleOrderMs: 30\_000,
    maxConsecutiveLosses: 3,
  },
});

export class PersistenceService {
  private readonly stateStore = new JsonStore<RuntimeState>(path.join(env.DATA\_DIR, 'state.json'), defaultRuntimeState());
  private readonly positionsStore = new JsonStore<RuntimePosition\[]>(path.join(env.DATA\_DIR, 'positions.json'), \[]);
  private readonly ordersStore = new JsonStore<RuntimeOrder\[]>(path.join(env.DATA\_DIR, 'orders.json'), \[]);
  private readonly tradesStore = new JsonStore<TradeJournalEntry\[]>(path.join(env.DATA\_DIR, 'trades.json'), \[]);
  private readonly pairMetricsStore = new JsonStore<PairMetrics\[]>(path.join(env.DATA\_DIR, 'pair-metrics.json'), \[]);
  private readonly hotlistStore = new JsonStore<SignalCandidate\[]>(path.join(env.DATA\_DIR, 'hotlist.json'), \[]);
  private readonly accountsMetaStore = new JsonStore<AccountsMeta>(path.join(env.DATA\_DIR, 'accounts-meta.json'), defaultAccountsMeta());
  private readonly settingsStore = new JsonStore<BotSettings>(path.join(env.DATA\_DIR, 'settings.json'), defaultSettings());

  async loadAll(): Promise<PersistenceSnapshot> {
    const \[state, positions, orders, trades, pairMetrics, hotlist, accountsMeta, settings] = await Promise.all(\[
      this.stateStore.read(),
      this.positionsStore.read(),
      this.ordersStore.read(),
      this.tradesStore.read(),
      this.pairMetricsStore.read(),
      this.hotlistStore.read(),
      this.accountsMetaStore.read(),
      this.settingsStore.read(),
    ]);

    return { state, positions, orders, trades, pairMetrics, hotlist, accountsMeta, settings };
  }

  saveState(state: RuntimeState): Promise<void> {
    return this.stateStore.write(state);
  }

  savePositions(positions: RuntimePosition\[]): Promise<void> {
    return this.positionsStore.write(positions);
  }

  saveOrders(orders: RuntimeOrder\[]): Promise<void> {
    return this.ordersStore.write(orders);
  }

  saveTrades(trades: TradeJournalEntry\[]): Promise<void> {
    return this.tradesStore.write(trades);
  }

  savePairMetrics(metrics: PairMetrics\[]): Promise<void> {
    return this.pairMetricsStore.write(metrics);
  }

  saveHotlist(hotlist: SignalCandidate\[]): Promise<void> {
    return this.hotlistStore.write(hotlist);
  }

  saveAccountsMeta(meta: AccountsMeta): Promise<void> {
    return this.accountsMetaStore.write(meta);
  }

  saveSettings(settings: BotSettings): Promise<void> {
    return this.settingsStore.write(settings);
  }
}
