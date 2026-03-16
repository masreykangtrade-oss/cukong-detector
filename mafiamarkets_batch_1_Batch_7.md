# Mafiamarkets rewrite pack — Batch 1 + Batch 2

Di batch ini, file lama untuk path-path berikut **hapus lalu ganti penuh** dengan isi baru di bawah ini.

## Hapus / replace total

* `src/app.ts`
* `src/bootstrap.ts`
* `src/core/types.ts`
* `src/core/cache.ts`
* `src/core/scheduler.ts`
* `src/core/shutdown.ts`
* `src/storage/jsonStore.ts`
* `src/utils/safeParse.ts`
* `src/utils/retry.ts`
* `src/utils/time.ts`
* `src/utils/validators.ts`
* `src/services/persistenceService.ts`
* `src/services/stateService.ts`
* `src/services/healthService.ts`
* `src/services/pollingService.ts`
* `src/domain/accounts/accountStore.ts`
* `src/domain/accounts/accountRegistry.ts`
* `src/domain/accounts/accountValidator.ts`
* `src/domain/settings/settingsService.ts`
* `src/services/journalService.ts`
* `src/integrations/http/httpClient.ts`
* `src/integrations/indodax/publicApi.ts`
* `src/integrations/indodax/privateApi.ts`
* `src/integrations/indodax/client.ts`
* `.env.example`

## Hapus file ini

* `src/domain/accounts/accountLoader.ts`

\---

## `src/core/types.ts`

```ts
export type TradingMode = 'OFF' | 'ALERT\_ONLY' | 'SEMI\_AUTO' | 'FULL\_AUTO';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'open' | 'partial' | 'filled' | 'canceled' | 'rejected' | 'expired';
export type PositionStatus = 'open' | 'closed';
export type ExitReason =
  | 'manual'
  | 'take\_profit'
  | 'stop\_loss'
  | 'trailing\_stop'
  | 'max\_hold'
  | 'volume\_collapse'
  | 'momentum\_failure'
  | 'emergency'
  | 'force\_close';
export type PairTier = 'HOT' | 'A' | 'B' | 'C';

export interface AccountCredential {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyAccountInput {
  name: string;
  apiKey: string;
  apiSecret: string;
}

export interface AccountsMeta {
  lastUpdatedAt: string | null;
  defaultAccountId: string | null;
  source: 'telegram\_upload' | 'manual' | 'migration';
  totalAccounts: number;
}

export interface BidAskLevel {
  price: number;
  volume: number;
}

export interface OrderbookSnapshot {
  pair: string;
  bids: BidAskLevel\[];
  asks: BidAskLevel\[];
  bestBid: number;
  bestAsk: number;
  bidDepthTop5: number;
  askDepthTop5: number;
  imbalanceTop5: number;
  spreadPct: number;
  capturedAt: string;
}

export interface TickerSnapshot {
  pair: string;
  lastPrice: number;
  bestBid: number;
  bestAsk: number;
  spreadPct: number;
  baseVolume24h: number;
  quoteVolume24h: number;
  priceChange24hPct: number;
  change1m: number;
  change3m: number;
  change5m: number;
  change15m: number;
  velocity1m: number;
  velocity5m: number;
  volume1m: number;
  volume3m: number;
  volume5m: number;
  volume15m: number;
  tradeBurstScore: number;
  breakoutDistancePct: number;
  liquidityScore: number;
  capturedAt: string;
}

export interface PairMetrics {
  pair: string;
  tier: PairTier;
  hotness: number;
  lastScore: number;
  lastSignalAt: string | null;
  lastPolledAt: string | null;
  pollIntervalMs: number;
  snapshots: TickerSnapshot\[];
}

export interface ScoreBreakdown {
  total: number;
  volumeAnomaly: number;
  priceAcceleration: number;
  spreadTightening: number;
  orderbookImbalance: number;
  tradeBurst: number;
  breakoutReadiness: number;
  momentumPersistence: number;
  slippagePenalty: number;
  liquidityPenalty: number;
  overextensionPenalty: number;
  spoofPenalty: number;
  notes: string\[];
}

export interface StrategyResult {
  name: string;
  passed: boolean;
  weight: number;
  note: string;
}

export interface SignalCandidate {
  pair: string;
  score: number;
  breakdown: ScoreBreakdown;
  strategies: StrategyResult\[];
  ticker: TickerSnapshot;
  orderbook: OrderbookSnapshot | null;
  createdAt: string;
}

export interface RuntimeOrder {
  id: string;
  accountId: string;
  pair: string;
  side: OrderSide;
  type: 'market' | 'limit';
  price: number;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  externalOrderId?: string;
  reason?: string;
}

export interface RuntimePosition {
  id: string;
  accountId: string;
  pair: string;
  status: PositionStatus;
  entryPrice: number;
  quantity: number;
  remainingQuantity: number;
  openedAt: string;
  updatedAt: string;
  closedAt: string | null;
  stopLossPct: number;
  takeProfitPct: number;
  trailingStopPct: number;
  maxHoldMinutes: number;
  scoreAtEntry: number;
  entryReason: string;
  lastMarkPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  exitReason: ExitReason | null;
}

export interface TradeJournalEntry {
  id: string;
  accountId: string;
  pair: string;
  side: OrderSide;
  quantity: number;
  price: number;
  fee: number;
  pnl: number;
  scoreSnapshot: number;
  reason: string;
  createdAt: string;
}

export interface RiskSettings {
  maxModalPerTrade: number;
  maxActivePositionsTotal: number;
  maxActivePositionsPerAccount: number;
  maxExposurePerPair: number;
  cooldownMinutesPerPair: number;
  maxSlippagePct: number;
  maxSpreadPct: number;
  minLiquidityScore: number;
  orderFillTimeoutMs: number;
  cancelStaleOrderMs: number;
  maxConsecutiveLosses: number;
}

export interface StrategySettings {
  scoreWatchlistThreshold: number;
  scoreAlertThreshold: number;
  scoreAutoEntryThreshold: number;
  enableVolumeSpike: boolean;
  enableOrderbookImbalance: boolean;
  enableSilentAccumulation: boolean;
  enableBreakoutRetest: boolean;
  enableHotRotation: boolean;
}

export interface BotSettings {
  tradingMode: TradingMode;
  dryRun: boolean;
  paperTrade: boolean;
  uiOnly: boolean;
  strategy: StrategySettings;
  risk: RiskSettings;
}

export interface RuntimeState {
  started: boolean;
  startedAt: string | null;
  updatedAt: string;
  uptimeMs: number;
  lastSignalAt: string | null;
  lastTradeAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  marketWatcherRunning: boolean;
  tradingMode: TradingMode;
  pairCooldowns: Record<string, string>;
  cacheStats: {
    hit: number;
    miss: number;
  };
  pollingStats: {
    activeJobs: number;
    tickCount: number;
    lastTickAt: string | null;
  };
}

export interface PersistenceSnapshot {
  state: RuntimeState;
  positions: RuntimePosition\[];
  orders: RuntimeOrder\[];
  trades: TradeJournalEntry\[];
  pairMetrics: PairMetrics\[];
  hotlist: SignalCandidate\[];
  accountsMeta: AccountsMeta;
  settings: BotSettings;
}

export interface HealthSnapshot {
  uptimeMs: number;
  started: boolean;
  mode: TradingMode;
  positionsOpen: number;
  pendingOrders: number;
  hotlistCount: number;
  lastSignalAt: string | null;
  lastTradeAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  activeJobs: number;
  tickCount: number;
}
```

## `src/storage/jsonStore.ts`

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export class JsonStore<T> {
  constructor(
    private readonly filePath: string,
    private readonly fallback: T,
  ) {}

  getPath(): string {
    return this.filePath;
  }

  async read(): Promise<T> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as T;
    } catch (error) {
      const isMissing = (error as NodeJS.ErrnoException).code === 'ENOENT';
      if (isMissing) {
        await this.write(this.fallback);
        return this.fallback;
      }
      throw error;
    }
  }

  async write(data: T): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
```

## `src/utils/safeParse.ts`

```ts
export function safeJsonParse<T>(input: string, fallback: T): T {
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}
```

## `src/utils/time.ts`

```ts
export function nowIso(): string {
  return new Date().toISOString();
}

export function nowMs(): number {
  return Date.now();
}

export function minutesToMs(minutes: number): number {
  return Math.max(0, minutes) \* 60\_000;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

## `src/utils/retry.ts`

```ts
export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const maxDelayMs = options.maxDelayMs ?? options.baseDelayMs \* 10;
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.retries + 1; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryAllowed = attempt <= options.retries \&\& (options.shouldRetry?.(error, attempt) ?? true);
      if (!retryAllowed) {
        break;
      }

      const backoff = Math.min(maxDelayMs, options.baseDelayMs \* 2 \*\* (attempt - 1));
      const jitter = Math.floor(Math.random() \* Math.max(25, Math.floor(backoff \* 0.2)));
      await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
    }
  }

  throw lastError;
}
```

## `src/core/cache.ts`

```ts
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
```

## `src/core/scheduler.ts`

```ts
export interface ScheduledJob {
  name: string;
  intervalMs: number;
  run: () => Promise<void>;
}

interface InternalJob extends ScheduledJob {
  timer: NodeJS.Timeout | null;
  running: boolean;
}

export class LightScheduler {
  private readonly jobs = new Map<string, InternalJob>();

  add(job: ScheduledJob): void {
    this.jobs.set(job.name, { ...job, timer: null, running: false });
  }

  start(name?: string): void {
    const selected = name ? \[this.jobs.get(name)].filter(Boolean) as InternalJob\[] : Array.from(this.jobs.values());
    for (const job of selected) {
      if (job.timer) {
        continue;
      }
      job.timer = setInterval(async () => {
        if (job.running) {
          return;
        }
        job.running = true;
        try {
          await job.run();
        } finally {
          job.running = false;
        }
      }, job.intervalMs);
    }
  }

  stop(name?: string): void {
    const selected = name ? \[this.jobs.get(name)].filter(Boolean) as InternalJob\[] : Array.from(this.jobs.values());
    for (const job of selected) {
      if (job.timer) {
        clearInterval(job.timer);
        job.timer = null;
      }
      job.running = false;
    }
  }

  stopAll(): void {
    this.stop();
  }

  list(): { name: string; intervalMs: number; running: boolean }\[] {
    return Array.from(this.jobs.values()).map((job) => ({
      name: job.name,
      intervalMs: job.intervalMs,
      running: job.running,
    }));
  }
}
```

## `src/core/shutdown.ts`

```ts
export function registerShutdown(handlers: Array<() => Promise<void>>): void {
  let closing = false;

  const onSignal = async (signal: NodeJS.Signals): Promise<void> => {
    if (closing) {
      return;
    }
    closing = true;

    try {
      for (const handler of handlers) {
        await handler();
      }
    } finally {
      process.exit(signal === 'SIGINT' ? 130 : 0);
    }
  };

  process.on('SIGINT', () => void onSignal('SIGINT'));
  process.on('SIGTERM', () => void onSignal('SIGTERM'));
}
```

## `src/utils/validators.ts`

```ts
import { z } from 'zod';
import type { LegacyAccountInput } from '../core/types';

export const legacyAccountSchema = z.object({
  name: z.string().trim().min(1).max(64),
  apiKey: z.string().trim().min(1),
  apiSecret: z.string().trim().min(1),
});

export const legacyAccountsArraySchema = z.array(legacyAccountSchema).min(1);

export type ValidAccountInput = z.infer<typeof legacyAccountSchema>;

export function parseLegacyAccounts(input: unknown): LegacyAccountInput\[] {
  return legacyAccountsArraySchema.parse(input);
}
```

## `src/services/persistenceService.ts`

```ts
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
```

## `src/services/stateService.ts`

```ts
import type { RuntimeState, TradingMode } from '../core/types';
import { nowIso } from '../utils/time';
import { PersistenceService } from './persistenceService';

export class StateService {
  private state: RuntimeState = {
    started: false,
    startedAt: null,
    updatedAt: nowIso(),
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
  };

  constructor(private readonly persistence: PersistenceService) {}

  async load(): Promise<RuntimeState> {
    const snapshot = await this.persistence.loadAll();
    this.state = snapshot.state;
    return this.state;
  }

  get(): RuntimeState {
    return this.state;
  }

  async replace(nextState: RuntimeState): Promise<void> {
    this.state = { ...nextState, updatedAt: nowIso() };
    await this.persistence.saveState(this.state);
  }

  async patch(partial: Partial<RuntimeState>): Promise<RuntimeState> {
    this.state = { ...this.state, ...partial, updatedAt: nowIso() };
    await this.persistence.saveState(this.state);
    return this.state;
  }

  async setStarted(started: boolean): Promise<void> {
    await this.patch({
      started,
      startedAt: started ? this.state.startedAt ?? nowIso() : this.state.startedAt,
      marketWatcherRunning: started,
    });
  }

  async setTradingMode(mode: TradingMode): Promise<void> {
    await this.patch({ tradingMode: mode });
  }

  async markSignal(): Promise<void> {
    await this.patch({ lastSignalAt: nowIso() });
  }

  async markTrade(): Promise<void> {
    await this.patch({ lastTradeAt: nowIso() });
  }

  async markError(message: string): Promise<void> {
    await this.patch({ lastErrorAt: nowIso(), lastErrorMessage: message });
  }

  async setCooldown(pair: string, untilIso: string): Promise<void> {
    await this.patch({ pairCooldowns: { ...this.state.pairCooldowns, \[pair]: untilIso } });
  }
}
```

## `src/services/healthService.ts`

```ts
import type { HealthSnapshot, RuntimeOrder, RuntimePosition, SignalCandidate } from '../core/types';
import { StateService } from './stateService';

export class HealthService {
  constructor(private readonly state: StateService) {}

  snapshot(params: { positions: RuntimePosition\[]; orders: RuntimeOrder\[]; hotlist: SignalCandidate\[] }): HealthSnapshot {
    const current = this.state.get();
    return {
      uptimeMs: current.uptimeMs,
      started: current.started,
      mode: current.tradingMode,
      positionsOpen: params.positions.filter((item) => item.status === 'open').length,
      pendingOrders: params.orders.filter((item) => item.status === 'pending' || item.status === 'open').length,
      hotlistCount: params.hotlist.length,
      lastSignalAt: current.lastSignalAt,
      lastTradeAt: current.lastTradeAt,
      lastErrorAt: current.lastErrorAt,
      lastErrorMessage: current.lastErrorMessage,
      activeJobs: current.pollingStats.activeJobs,
      tickCount: current.pollingStats.tickCount,
    };
  }
}
```

## `src/services/pollingService.ts`

```ts
import { LightScheduler } from '../core/scheduler';

export class PollingService {
  constructor(private readonly scheduler: LightScheduler) {}

  register(name: string, intervalMs: number, handler: () => Promise<void>): void {
    this.scheduler.add({ name, intervalMs, run: handler });
  }

  start(name?: string): void {
    this.scheduler.start(name);
  }

  stop(name?: string): void {
    this.scheduler.stop(name);
  }

  stats(): { activeJobs: number; jobs: { name: string; intervalMs: number; running: boolean }\[] } {
    const jobs = this.scheduler.list();
    return {
      activeJobs: jobs.length,
      jobs,
    };
  }
}
```

## `src/domain/accounts/accountStore.ts`

```ts
import path from 'node:path';
import { env } from '../../config/env';
import type { AccountCredential, AccountsMeta, LegacyAccountInput } from '../../core/types';
import { JsonStore } from '../../storage/jsonStore';
import { nowIso } from '../../utils/time';
import { parseLegacyAccounts } from '../../utils/validators';

function createAccountId(name: string): string {
  return `${name.trim().toLowerCase().replace(/\[^a-z0-9]+/g, '-')}-${Date.now()}`;
}

export class AccountStore {
  private readonly accountsStore = new JsonStore<AccountCredential\[]>(path.join(env.DATA\_DIR, 'accounts', 'accounts.json'), \[]);
  private readonly metaStore = new JsonStore<AccountsMeta>(path.join(env.DATA\_DIR, 'accounts-meta.json'), {
    lastUpdatedAt: null,
    defaultAccountId: null,
    source: 'manual',
    totalAccounts: 0,
  });

  getFilePath(): string {
    return this.accountsStore.getPath();
  }

  async loadAll(): Promise<AccountCredential\[]> {
    return this.accountsStore.read();
  }

  async loadMeta(): Promise<AccountsMeta> {
    return this.metaStore.read();
  }

  async saveAll(accounts: AccountCredential\[], source: AccountsMeta\['source'] = 'manual'): Promise<void> {
    await this.accountsStore.write(accounts);

    const defaultAccount = accounts.find((item) => item.isDefault) ?? null;
    await this.metaStore.write({
      lastUpdatedAt: nowIso(),
      defaultAccountId: defaultAccount?.id ?? null,
      source,
      totalAccounts: accounts.length,
    });
  }

  async saveLegacyUpload(input: unknown): Promise<AccountCredential\[]> {
    const parsed = parseLegacyAccounts(input);
    const now = nowIso();
    const accounts = parsed.map((item, index): AccountCredential => ({
      id: createAccountId(item.name),
      name: item.name.trim(),
      apiKey: item.apiKey.trim(),
      apiSecret: item.apiSecret.trim(),
      enabled: true,
      isDefault: index === 0,
      createdAt: now,
      updatedAt: now,
    }));
    await this.saveAll(accounts, 'telegram\_upload');
    return accounts;
  }

  async upsertLegacyAccounts(items: LegacyAccountInput\[]): Promise<AccountCredential\[]> {
    const current = await this.loadAll();
    const currentByName = new Map(current.map((item) => \[item.name.toLowerCase(), item]));
    const now = nowIso();

    const next: AccountCredential\[] = items.map((item, index) => {
      const existing = currentByName.get(item.name.toLowerCase());
      return {
        id: existing?.id ?? createAccountId(item.name),
        name: item.name.trim(),
        apiKey: item.apiKey.trim(),
        apiSecret: item.apiSecret.trim(),
        enabled: existing?.enabled ?? true,
        isDefault: existing?.isDefault ?? index === 0,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
    });

    if (!next.some((item) => item.isDefault) \&\& next\[0]) {
      next\[0].isDefault = true;
    }

    await this.saveAll(next, 'migration');
    return next;
  }

  async delete(accountId: string): Promise<AccountCredential\[]> {
    const current = await this.loadAll();
    const next = current.filter((item) => item.id !== accountId);
    if (next.length > 0 \&\& !next.some((item) => item.isDefault)) {
      next\[0].isDefault = true;
    }
    await this.saveAll(next);
    return next;
  }

  async setEnabled(accountId: string, enabled: boolean): Promise<AccountCredential\[]> {
    const current = await this.loadAll();
    const next = current.map((item) => item.id === accountId ? { ...item, enabled, updatedAt: nowIso() } : item);
    await this.saveAll(next);
    return next;
  }

  async setDefault(accountId: string): Promise<AccountCredential\[]> {
    const current = await this.loadAll();
    const next = current.map((item) => ({
      ...item,
      isDefault: item.id === accountId,
      updatedAt: nowIso(),
    }));
    await this.saveAll(next);
    return next;
  }
}
```

## `src/domain/accounts/accountRegistry.ts`

```ts
import type { AccountCredential } from '../../core/types';
import { AccountStore } from './accountStore';

export class AccountRegistry {
  private accounts: AccountCredential\[] = \[];

  constructor(private readonly store: AccountStore) {}

  async reload(): Promise<AccountCredential\[]> {
    const loaded = await this.store.loadAll();
    this.accounts = loaded.filter((item) => item.name \&\& item.apiKey \&\& item.apiSecret);
    return this.accounts;
  }

  listAll(): AccountCredential\[] {
    return this.accounts;
  }

  listEnabled(): AccountCredential\[] {
    return this.accounts.filter((item) => item.enabled);
  }

  getDefault(): AccountCredential | undefined {
    return this.accounts.find((item) => item.isDefault) ?? this.accounts.find((item) => item.enabled);
  }

  getById(accountId: string): AccountCredential | undefined {
    return this.accounts.find((item) => item.id === accountId);
  }
}
```

## `src/domain/accounts/accountValidator.ts`

```ts
import type { LegacyAccountInput } from '../../core/types';
import { parseLegacyAccounts } from '../../utils/validators';

export class AccountValidator {
  validateLegacyArray(input: unknown): LegacyAccountInput\[] {
    return parseLegacyAccounts(input);
  }
}
```

## `src/domain/settings/settingsService.ts`

```ts
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
```

## `src/services/journalService.ts`

```ts
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
```

## `src/integrations/http/httpClient.ts`

```ts
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { withRetry } from '../../utils/retry';

export interface HttpClientOptions {
  baseURL?: string;
  timeoutMs: number;
  headers?: Record<string, string>;
}

export class HttpClient {
  private readonly client: AxiosInstance;

  constructor(options: HttpClientOptions) {
    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeoutMs,
      headers: options.headers,
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return withRetry(async () => {
      const response = await this.client.get<T>(url, config);
      return response.data;
    }, { retries: 2, baseDelayMs: 250 });
  }

  async postForm<T>(url: string, body: URLSearchParams | Record<string, string | number>, config?: AxiosRequestConfig): Promise<T> {
    const payload = body instanceof URLSearchParams ? body : new URLSearchParams(Object.entries(body).map((\[key, value]) => \[key, String(value)]));
    return withRetry(async () => {
      const response = await this.client.post<T>(url, payload, {
        ...config,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          ...(config?.headers ?? {}),
        },
      });
      return response.data;
    }, { retries: 2, baseDelayMs: 250 });
  }
}
```

## `src/integrations/indodax/publicApi.ts`

```ts
import { env } from '../../config/env';
import { HttpClient } from '../http/httpClient';

export interface IndodaxTickerResponseItem {
  high: string;
  low: string;
  vol\_btc?: string;
  vol\_idr?: string;
  last: string;
  buy: string;
  sell: string;
  server\_time?: number;
}

export type IndodaxTickerResponse = Record<string, IndodaxTickerResponseItem>;

export interface IndodaxDepthResponse {
  buy: \[string, string]\[];
  sell: \[string, string]\[];
}

export class IndodaxPublicApi {
  constructor(private readonly http = new HttpClient({ baseURL: env.INDODAX\_PUBLIC\_BASE\_URL, timeoutMs: env.HTTP\_TIMEOUT\_MS })) {}

  getTickers(): Promise<IndodaxTickerResponse> {
    return this.http.get<IndodaxTickerResponse>('/api/tickers');
  }

  getDepth(pair: string): Promise<IndodaxDepthResponse> {
    return this.http.get<IndodaxDepthResponse>(`/api/${pair}/depth`);
  }
}
```

## `src/integrations/indodax/privateApi.ts`

```ts
import crypto from 'node:crypto';
import { env } from '../../config/env';
import { HttpClient } from '../http/httpClient';

interface PrivateApiCredential {
  apiKey: string;
  apiSecret: string;
}

export interface IndodaxPrivateResponse<T> {
  success: 0 | 1;
  return?: T;
  error?: string;
}

export class IndodaxPrivateApi {
  constructor(private readonly http = new HttpClient({ baseURL: env.INDODAX\_PRIVATE\_BASE\_URL, timeoutMs: env.HTTP\_TIMEOUT\_MS })) {}

  private sign(secret: string, body: string): string {
    return crypto.createHmac('sha512', secret).update(body).digest('hex');
  }

  async call<T>(credential: PrivateApiCredential, method: string, params: Record<string, string | number> = {}): Promise<IndodaxPrivateResponse<T>> {
    const nonce = Date.now();
    const payload = new URLSearchParams({ method, nonce: String(nonce), ...Object.fromEntries(Object.entries(params).map((\[k, v]) => \[k, String(v)])) });
    const sign = this.sign(credential.apiSecret, payload.toString());

    return this.http.postForm<IndodaxPrivateResponse<T>>('/tapi', payload, {
      headers: {
        Key: credential.apiKey,
        Sign: sign,
      },
    });
  }
}
```

## `src/integrations/indodax/client.ts`

```ts
import type { AccountCredential, OrderbookSnapshot, TickerSnapshot } from '../../core/types';
import { nowIso } from '../../utils/time';
import { IndodaxPrivateApi } from './privateApi';
import { IndodaxPublicApi } from './publicApi';

export class IndodaxClient {
  private readonly history = new Map<string, TickerSnapshot\[]>();

  constructor(
    private readonly publicApi = new IndodaxPublicApi(),
    private readonly privateApi = new IndodaxPrivateApi(),
  ) {}

  private buildTicker(pair: string, row: { last: string; buy: string; sell: string; vol\_btc?: string; vol\_idr?: string }, previous: TickerSnapshot\[]): TickerSnapshot {
    const lastPrice = Number(row.last);
    const bestBid = Number(row.buy);
    const bestAsk = Number(row.sell);
    const spreadPct = bestAsk > 0 ? ((bestAsk - bestBid) / bestAsk) \* 100 : 0;
    const volume24h = Number(row.vol\_idr ?? row.vol\_btc ?? 0);
    const prev1 = previous.at(-1);
    const prev3 = previous.at(-3);
    const prev5 = previous.at(-5);
    const prev15 = previous.at(-15);

    const pct = (prev?: TickerSnapshot): number => {
      if (!prev || prev.lastPrice <= 0) return 0;
      return ((lastPrice - prev.lastPrice) / prev.lastPrice) \* 100;
    };

    const snapshot: TickerSnapshot = {
      pair,
      lastPrice,
      bestBid,
      bestAsk,
      spreadPct,
      baseVolume24h: Number(row.vol\_btc ?? 0),
      quoteVolume24h: volume24h,
      priceChange24hPct: 0,
      change1m: pct(prev1),
      change3m: pct(prev3),
      change5m: pct(prev5),
      change15m: pct(prev15),
      velocity1m: Math.abs(pct(prev1)),
      velocity5m: Math.abs(pct(prev5)),
      volume1m: volume24h,
      volume3m: volume24h,
      volume5m: volume24h,
      volume15m: volume24h,
      tradeBurstScore: Math.min(100, Math.max(0, Math.abs(pct(prev1)) \* 20)),
      breakoutDistancePct: Math.max(0, 1 - Math.abs(pct(prev5))),
      liquidityScore: Math.max(0, Math.min(100, volume24h / 1\_000\_000)),
      capturedAt: nowIso(),
    };

    return snapshot;
  }

  async getTicker(pair: string): Promise<TickerSnapshot | null> {
    const tickers = await this.publicApi.getTickers();
    const row = tickers\[pair];
    if (!row) {
      return null;
    }

    const history = this.history.get(pair) ?? \[];
    const snapshot = this.buildTicker(pair, row, history);
    this.history.set(pair, \[...history, snapshot].slice(-20));
    return snapshot;
  }

  async getOrderbook(pair: string): Promise<OrderbookSnapshot | null> {
    const depth = await this.publicApi.getDepth(pair);
    const bids = depth.buy.slice(0, 5).map((\[price, volume]) => ({ price: Number(price), volume: Number(volume) }));
    const asks = depth.sell.slice(0, 5).map((\[price, volume]) => ({ price: Number(price), volume: Number(volume) }));
    const bestBid = bids\[0]?.price ?? 0;
    const bestAsk = asks\[0]?.price ?? 0;
    const bidDepthTop5 = bids.reduce((sum, row) => sum + row.volume, 0);
    const askDepthTop5 = asks.reduce((sum, row) => sum + row.volume, 0);
    const imbalanceTop5 = bidDepthTop5 + askDepthTop5 > 0 ? (bidDepthTop5 - askDepthTop5) / (bidDepthTop5 + askDepthTop5) : 0;

    return {
      pair,
      bids,
      asks,
      bestBid,
      bestAsk,
      bidDepthTop5,
      askDepthTop5,
      imbalanceTop5,
      spreadPct: bestAsk > 0 ? ((bestAsk - bestBid) / bestAsk) \* 100 : 0,
      capturedAt: nowIso(),
    };
  }

  async placeBuyOrder(account: AccountCredential, pair: string, price: number, quantity: number): Promise<unknown> {
    return this.privateApi.call(account, 'trade', { pair, type: 'buy', price, btc: quantity });
  }

  async placeSellOrder(account: AccountCredential, pair: string, price: number, quantity: number): Promise<unknown> {
    return this.privateApi.call(account, 'trade', { pair, type: 'sell', price, btc: quantity });
  }
}
```

## `src/app.ts`

```ts
import { env } from './config/env';
import { LightScheduler } from './core/scheduler';
import { registerShutdown } from './core/shutdown';
import { logger } from './core/logger';
import { AccountRegistry } from './domain/accounts/accountRegistry';
import { AccountStore } from './domain/accounts/accountStore';
import { SettingsService } from './domain/settings/settingsService';
import { IndodaxClient } from './integrations/indodax/client';
import { PersistenceService } from './services/persistenceService';
import { PollingService } from './services/pollingService';
import { StateService } from './services/stateService';
import { JournalService } from './services/journalService';

export async function createApp(): Promise<{ start: () => Promise<void>; stop: () => Promise<void> }> {
  const scheduler = new LightScheduler();
  const polling = new PollingService(scheduler);
  const persistence = new PersistenceService();
  const state = new StateService(persistence);
  const settings = new SettingsService(persistence);
  const journal = new JournalService(persistence);
  const accountStore = new AccountStore();
  const accountRegistry = new AccountRegistry(accountStore);
  const indodax = new IndodaxClient();

  await Promise.all(\[state.load(), settings.load(), journal.load(), accountRegistry.reload()]);

  polling.register('heartbeat', env.STATE\_FLUSH\_INTERVAL\_MS, async () => {
    const current = state.get();
    await state.patch({
      uptimeMs: current.startedAt ? Math.max(0, Date.now() - new Date(current.startedAt).getTime()) : current.uptimeMs,
      pollingStats: {
        ...current.pollingStats,
        tickCount: current.pollingStats.tickCount + 1,
        lastTickAt: new Date().toISOString(),
      },
    });
  });

  const start = async (): Promise<void> => {
    await state.setStarted(true);
    polling.start();
    logger.info({ accounts: accountRegistry.listEnabled().length }, 'mafiamarkets app started');
  };

  const stop = async (): Promise<void> => {
    polling.stop();
    await state.patch({ started: false, marketWatcherRunning: false });
    logger.info('mafiamarkets app stopped');
  };

  registerShutdown(\[stop]);

  void indodax;

  return { start, stop };
}
```

## `src/bootstrap.ts`

```ts
import { createApp } from './app';
import { logger } from './core/logger';

async function main(): Promise<void> {
  const app = await createApp();
  await app.start();
}

main().catch((error: unknown) => {
  logger.error({ error }, 'bootstrap failed');
  process.exit(1);
});
```

## `.env.example`

```env
NODE\_ENV=development
LOG\_LEVEL=info

TELEGRAM\_BOT\_TOKEN=
TELEGRAM\_TOKEN=
TELEGRAM\_ALLOWED\_USER\_IDS=123456789
TELEGRAM\_BOT\_UI\_ONLY=true

INDODAX\_PUBLIC\_BASE\_URL=https://indodax.com
INDODAX\_PRIVATE\_BASE\_URL=https://indodax.com

HTTP\_TIMEOUT\_MS=10000
STATE\_FLUSH\_INTERVAL\_MS=5000

DATA\_DIR=./data
LOG\_DIR=./logs

DRY\_RUN=false
PAPER\_TRADE=false

MAX\_POSITION\_SIZE\_IDR=250000
MAX\_ACTIVE\_POSITIONS=5
PAIR\_COOLDOWN\_MINUTES=20
MAX\_SPREAD\_PCT=0.8
MAX\_SLIPPAGE\_PCT=1.0
```

\---

## `src/domain/market/tickerSnapshot.ts`

```ts
import type { TickerSnapshot } from '../../core/types';

export interface TickerWindowSummary {
  latest: TickerSnapshot;
  averagePrice: number;
  highPrice: number;
  lowPrice: number;
  averageVolume: number;
}

export function summarizeTickerWindow(items: TickerSnapshot\[]): TickerWindowSummary | null {
  if (!items.length) {
    return null;
  }

  const latest = items\[items.length - 1];
  const averagePrice = items.reduce((sum, item) => sum + item.lastPrice, 0) / items.length;
  const highPrice = Math.max(...items.map((item) => item.lastPrice));
  const lowPrice = Math.min(...items.map((item) => item.lastPrice));
  const averageVolume = items.reduce((sum, item) => sum + item.volume1m, 0) / items.length;

  return { latest, averagePrice, highPrice, lowPrice, averageVolume };
}
```

## `src/domain/market/orderbookSnapshot.ts`

```ts
import type { OrderbookSnapshot } from '../../core/types';

export function topDepthScore(orderbook: OrderbookSnapshot | null): number {
  if (!orderbook) {
    return 0;
  }
  const total = orderbook.bidDepthTop5 + orderbook.askDepthTop5;
  return Math.max(0, Math.min(100, total / 100));
}
```

## `src/domain/market/pairClassifier.ts`

```ts
import type { PairTier, TickerSnapshot } from '../../core/types';

const tierAKeywords = \['btc', 'eth', 'sol', 'bnb', 'idr'];
const tierBKeywords = \['doge', 'xrp', 'ada', 'link', 'pepe', 'shib'];

export function classifyTier(pair: string, snapshot?: TickerSnapshot | null): PairTier {
  const normalized = pair.toLowerCase();

  if (snapshot \&\& snapshot.tradeBurstScore >= 75) {
    return 'HOT';
  }

  if (tierAKeywords.some((item) => normalized.includes(item))) {
    return 'A';
  }

  if (tierBKeywords.some((item) => normalized.includes(item))) {
    return 'B';
  }

  return 'C';
}

export function tierIntervalMs(tier: PairTier): number {
  switch (tier) {
    case 'HOT':
      return 900;
    case 'A':
      return 2\_500;
    case 'B':
      return 5\_000;
    case 'C':
    default:
      return 10\_000;
  }
}
```

## `src/domain/market/pairUniverse.ts`

```ts
import { DEFAULT\_TOP\_PAIRS } from '../../config/defaults';
import type { PairMetrics, PairTier, TickerSnapshot } from '../../core/types';
import { classifyTier, tierIntervalMs } from './pairClassifier';

interface PairUniverseEntry {
  pair: string;
  tier: PairTier;
  hotness: number;
  lastScore: number;
  pollIntervalMs: number;
  lastPolledAt: string | null;
  lastSignalAt: string | null;
}

export class PairUniverse {
  private readonly entries = new Map<string, PairUniverseEntry>();

  constructor(seedPairs: string\[] = DEFAULT\_TOP\_PAIRS) {
    for (const pair of seedPairs) {
      const tier = classifyTier(pair);
      this.entries.set(pair, {
        pair,
        tier,
        hotness: 0,
        lastScore: 0,
        pollIntervalMs: tierIntervalMs(tier),
        lastPolledAt: null,
        lastSignalAt: null,
      });
    }
  }

  listAll(): string\[] {
    return Array.from(this.entries.keys());
  }

  listByTier(tier: PairTier): string\[] {
    return Array.from(this.entries.values())
      .filter((item) => item.tier === tier)
      .sort((a, b) => b.hotness - a.hotness)
      .map((item) => item.pair);
  }

  getTier(pair: string): PairTier {
    return this.entries.get(pair)?.tier ?? classifyTier(pair);
  }

  markPolled(pair: string, polledAt: string): void {
    const entry = this.entries.get(pair);
    if (!entry) return;
    entry.lastPolledAt = polledAt;
  }

  updateFromSnapshot(pair: string, snapshot: TickerSnapshot, score?: number): void {
    const entry = this.entries.get(pair) ?? {
      pair,
      tier: classifyTier(pair, snapshot),
      hotness: 0,
      lastScore: 0,
      pollIntervalMs: tierIntervalMs(classifyTier(pair, snapshot)),
      lastPolledAt: null,
      lastSignalAt: null,
    };

    const calculatedHotness = Math.max(
      0,
      Math.min(
        100,
        snapshot.tradeBurstScore \* 0.25 +
          Math.abs(snapshot.change1m) \* 10 +
          Math.abs(snapshot.change5m) \* 5 +
          Math.max(0, 30 - snapshot.spreadPct \* 20) +
          (score ?? 0) \* 0.35,
      ),
    );

    const nextTier = calculatedHotness >= 80 ? 'HOT' : classifyTier(pair, snapshot);

    this.entries.set(pair, {
      ...entry,
      tier: nextTier,
      hotness: calculatedHotness,
      lastScore: score ?? entry.lastScore,
      pollIntervalMs: tierIntervalMs(nextTier),
      lastPolledAt: snapshot.capturedAt,
      lastSignalAt: score \&\& score >= 75 ? snapshot.capturedAt : entry.lastSignalAt,
    });
  }

  updateScore(pair: string, score: number, signalAt: string | null): void {
    const entry = this.entries.get(pair);
    if (!entry) return;
    entry.lastScore = score;
    entry.hotness = Math.max(entry.hotness, Math.min(100, score));
    if (signalAt) {
      entry.lastSignalAt = signalAt;
    }
    if (score >= 85) {
      entry.tier = 'HOT';
      entry.pollIntervalMs = tierIntervalMs('HOT');
    }
  }

  exportMetrics(historyByPair: Map<string, TickerSnapshot\[]>): PairMetrics\[] {
    return Array.from(this.entries.values()).map((entry) => ({
      pair: entry.pair,
      tier: entry.tier,
      hotness: entry.hotness,
      lastScore: entry.lastScore,
      lastSignalAt: entry.lastSignalAt,
      lastPolledAt: entry.lastPolledAt,
      pollIntervalMs: entry.pollIntervalMs,
      snapshots: historyByPair.get(entry.pair) ?? \[],
    }));
  }
}
```

## `src/domain/market/hotlistService.ts`

```ts
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
```

## `src/integrations/indodax/mapper.ts`

```ts
import type { OrderbookSnapshot, TickerSnapshot } from '../../core/types';

export function buildTickerFromHistory(
  pair: string,
  input: {
    lastPrice: number;
    bestBid: number;
    bestAsk: number;
    volume24h: number;
    capturedAt: string;
  },
  history: TickerSnapshot\[],
  orderbook?: OrderbookSnapshot | null,
): TickerSnapshot {
  const previous = history\[history.length - 1];
  const pick = (steps: number): TickerSnapshot | undefined => history\[Math.max(0, history.length - steps)];
  const pct = (past?: TickerSnapshot): number => {
    if (!past || past.lastPrice <= 0) return 0;
    return ((input.lastPrice - past.lastPrice) / past.lastPrice) \* 100;
  };

  const spreadPct = input.bestAsk > 0 ? ((input.bestAsk - input.bestBid) / input.bestAsk) \* 100 : 0;
  const velocity1m = previous ? Math.abs(input.lastPrice - previous.lastPrice) : 0;
  const velocity5m = Math.abs(pct(pick(5)));
  const baseVolume = Math.max(0, input.volume24h);
  const topDepth = (orderbook?.bidDepthTop5 ?? 0) + (orderbook?.askDepthTop5 ?? 0);
  const imbalance = Math.abs(orderbook?.imbalanceTop5 ?? 0);

  return {
    pair,
    lastPrice: input.lastPrice,
    bestBid: input.bestBid,
    bestAsk: input.bestAsk,
    spreadPct,
    baseVolume24h: baseVolume,
    quoteVolume24h: baseVolume,
    priceChange24hPct: 0,
    change1m: pct(pick(1)),
    change3m: pct(pick(3)),
    change5m: pct(pick(5)),
    change15m: pct(pick(15)),
    velocity1m,
    velocity5m,
    volume1m: baseVolume / 1440,
    volume3m: baseVolume / 480,
    volume5m: baseVolume / 288,
    volume15m: baseVolume / 96,
    tradeBurstScore: Math.max(0, Math.min(100, Math.abs(pct(pick(1))) \* 18 + Math.abs(pct(pick(3))) \* 10)),
    breakoutDistancePct: Math.max(0, Math.min(100, 100 - Math.abs(pct(pick(15))) \* 10)),
    liquidityScore: Math.max(0, Math.min(100, topDepth / 100 + baseVolume / 1\_000\_000 + (1 - imbalance) \* 15)),
    capturedAt: input.capturedAt,
  };
}
```

## `src/domain/market/marketWatcher.ts`

```ts
import type { OrderbookSnapshot, TickerSnapshot } from '../../core/types';
import { TtlCache } from '../../core/cache';
import { IndodaxClient } from '../../integrations/indodax/client';
import { buildTickerFromHistory } from '../../integrations/indodax/mapper';
import { nowIso } from '../../utils/time';
import { PairUniverse } from './pairUniverse';

export interface MarketSnapshotBundle {
  pair: string;
  ticker: TickerSnapshot;
  orderbook: OrderbookSnapshot | null;
}

export class MarketWatcher {
  private readonly tickerCache = new TtlCache<TickerSnapshot>(1\_500);
  private readonly orderbookCache = new TtlCache<OrderbookSnapshot>(1\_500);
  private readonly history = new Map<string, TickerSnapshot\[]>();
  private readonly maxHistory = 30;

  constructor(
    private readonly client: IndodaxClient,
    private readonly universe: PairUniverse,
  ) {}

  private pushHistory(pair: string, snapshot: TickerSnapshot): void {
    const previous = this.history.get(pair) ?? \[];
    this.history.set(pair, \[...previous, snapshot].slice(-this.maxHistory));
  }

  getHistory(pair: string): TickerSnapshot\[] {
    return this.history.get(pair) ?? \[];
  }

  exportHistory(): Map<string, TickerSnapshot\[]> {
    return this.history;
  }

  async snapshot(pair: string): Promise<MarketSnapshotBundle | null> {
    const cachedTicker = this.tickerCache.get(pair);
    const cachedOrderbook = this.orderbookCache.get(pair);
    if (cachedTicker) {
      return { pair, ticker: cachedTicker, orderbook: cachedOrderbook ?? null };
    }

    const rawTicker = await this.client.getTicker(pair);
    if (!rawTicker) {
      return null;
    }

    const orderbook = await this.client.getOrderbook(pair);
    const snapshot = buildTickerFromHistory(
      pair,
      {
        lastPrice: rawTicker.lastPrice,
        bestBid: rawTicker.bestBid,
        bestAsk: rawTicker.bestAsk,
        volume24h: rawTicker.quoteVolume24h,
        capturedAt: nowIso(),
      },
      this.getHistory(pair),
      orderbook,
    );

    this.pushHistory(pair, snapshot);
    this.tickerCache.set(pair, snapshot);
    if (orderbook) {
      this.orderbookCache.set(pair, orderbook);
    }

    this.universe.markPolled(pair, snapshot.capturedAt);
    this.universe.updateFromSnapshot(pair, snapshot);

    return { pair, ticker: snapshot, orderbook };
  }

  async batchSnapshot(limitPerTier = 4): Promise<MarketSnapshotBundle\[]> {
    const selectedPairs = \[
      ...this.universe.listByTier('HOT').slice(0, limitPerTier),
      ...this.universe.listByTier('A').slice(0, limitPerTier),
      ...this.universe.listByTier('B').slice(0, limitPerTier),
      ...this.universe.listByTier('C').slice(0, limitPerTier),
    ];

    const uniquePairs = Array.from(new Set(selectedPairs.length ? selectedPairs : this.universe.listAll().slice(0, 12)));
    const results = await Promise.all(uniquePairs.map((pair) => this.snapshot(pair)));
    return results.filter((item): item is MarketSnapshotBundle => Boolean(item));
  }
}
```

## `src/domain/signals/strategies/volumeSpike.ts`

```ts
import type { TickerSnapshot } from '../../../core/types';

export function volumeSpikeScore(snapshot: TickerSnapshot): number {
  const recent = snapshot.volume1m + snapshot.volume3m \* 0.5;
  const baseline = Math.max(1, snapshot.volume15m / 3);
  const ratio = recent / baseline;
  return Math.max(0, Math.min(22, ratio \* 8));
}
```

## `src/domain/signals/strategies/orderbookImbalance.ts`

```ts
import type { OrderbookSnapshot } from '../../../core/types';

export function orderbookImbalanceScore(orderbook: OrderbookSnapshot | null): number {
  if (!orderbook) {
    return 0;
  }

  const imbalance = Math.abs(orderbook.imbalanceTop5);
  return Math.max(0, Math.min(16, imbalance \* 20));
}
```

## `src/domain/signals/strategies/silentAccumulation.ts`

```ts
import type { OrderbookSnapshot, TickerSnapshot } from '../../../core/types';

export function silentAccumulationScore(snapshot: TickerSnapshot, orderbook: OrderbookSnapshot | null): number {
  if (!orderbook) {
    return 0;
  }

  const condition = snapshot.change15m > 0 \&\& snapshot.change15m < 3 \&\& orderbook.imbalanceTop5 > 0.12 \&\& snapshot.spreadPct < 0.8;
  return condition ? 10 : 0;
}
```

## `src/domain/signals/strategies/breakoutRetest.ts`

```ts
import type { TickerSnapshot } from '../../../core/types';

export function breakoutRetestScore(snapshot: TickerSnapshot): number {
  const breakout = snapshot.change5m > 1.25 \&\& snapshot.change15m > 2;
  const controlledSpread = snapshot.spreadPct < 0.9;
  return breakout \&\& controlledSpread ? 14 : 0;
}
```

## `src/domain/signals/strategies/hotRotation.ts`

```ts
import type { TickerSnapshot } from '../../../core/types';

export function hotRotationScore(snapshot: TickerSnapshot): number {
  const momentum = Math.max(0, snapshot.change1m) + Math.max(0, snapshot.change3m) + Math.max(0, snapshot.change5m);
  return Math.max(0, Math.min(14, momentum \* 2.2));
}
```

## `src/domain/signals/scoreCalculator.ts`

```ts
import type { OrderbookSnapshot, ScoreBreakdown, StrategyResult, TickerSnapshot } from '../../core/types';
import { breakoutRetestScore } from './strategies/breakoutRetest';
import { hotRotationScore } from './strategies/hotRotation';
import { orderbookImbalanceScore } from './strategies/orderbookImbalance';
import { silentAccumulationScore } from './strategies/silentAccumulation';
import { volumeSpikeScore } from './strategies/volumeSpike';

export function calculateScore(snapshot: TickerSnapshot, orderbook: OrderbookSnapshot | null): { breakdown: ScoreBreakdown; strategies: StrategyResult\[] } {
  const volumeAnomaly = volumeSpikeScore(snapshot);
  const priceAcceleration = Math.max(0, Math.min(14, snapshot.velocity5m \* 1.6 + Math.max(0, snapshot.change3m) \* 2));
  const spreadTightening = Math.max(0, Math.min(10, 10 - snapshot.spreadPct \* 10));
  const orderbookImbalance = orderbookImbalanceScore(orderbook);
  const tradeBurst = Math.max(0, Math.min(10, snapshot.tradeBurstScore / 10));
  const breakoutReadiness = breakoutRetestScore(snapshot);
  const momentumPersistence = Math.max(0, Math.min(14, hotRotationScore(snapshot) + silentAccumulationScore(snapshot, orderbook)));
  const slippagePenalty = Math.max(0, Math.min(10, snapshot.spreadPct \* 6));
  const liquidityPenalty = Math.max(0, Math.min(12, (50 - snapshot.liquidityScore) / 5));
  const overextensionPenalty = Math.max(0, Math.min(12, Math.max(0, snapshot.change15m - 8) \* 1.5));
  const spoofPenalty = orderbook \&\& Math.abs(orderbook.imbalanceTop5) > 0.92 \&\& (orderbook.bidDepthTop5 < 20 || orderbook.askDepthTop5 < 20) ? 6 : 0;

  const notes: string\[] = \[];
  if (volumeAnomaly >= 12) notes.push('volume anomaly kuat');
  if (priceAcceleration >= 8) notes.push('akselerasi harga meningkat');
  if (spreadTightening >= 7) notes.push('spread relatif rapat');
  if (orderbookImbalance >= 8) notes.push('imbalance orderbook kuat');
  if (tradeBurst >= 7) notes.push('trade burst tinggi');
  if (breakoutReadiness >= 10) notes.push('potensi breakout + retest');
  if (momentumPersistence >= 8) notes.push('momentum bertahan');
  if (slippagePenalty >= 6) notes.push('slippage risk tinggi');
  if (liquidityPenalty >= 6) notes.push('likuiditas kurang');
  if (overextensionPenalty >= 6) notes.push('sudah overextended');
  if (spoofPenalty > 0) notes.push('indikasi fake move / spoof');

  const total = Math.max(
    0,
    Math.min(
      100,
      volumeAnomaly +
        priceAcceleration +
        spreadTightening +
        orderbookImbalance +
        tradeBurst +
        breakoutReadiness +
        momentumPersistence -
        slippagePenalty -
        liquidityPenalty -
        overextensionPenalty -
        spoofPenalty,
    ),
  );

  const strategies: StrategyResult\[] = \[
    { name: 'Volume Spike Early', passed: volumeAnomaly >= 10, weight: volumeAnomaly, note: notes.includes('volume anomaly kuat') ? 'volume terdeteksi meningkat' : 'belum dominan' },
    { name: 'Orderbook Imbalance', passed: orderbookImbalance >= 8, weight: orderbookImbalance, note: orderbook ? `imbalance=${orderbook.imbalanceTop5.toFixed(3)}` : 'orderbook tidak tersedia' },
    { name: 'Silent Accumulation', passed: silentAccumulationScore(snapshot, orderbook) > 0, weight: silentAccumulationScore(snapshot, orderbook), note: 'kenaikan halus dengan depth mendukung' },
    { name: 'Breakout + Quick Retest', passed: breakoutReadiness >= 10, weight: breakoutReadiness, note: 'breakout readiness aktif' },
    { name: 'Hot Rotation Scanner', passed: hotRotationScore(snapshot) >= 8, weight: hotRotationScore(snapshot), note: 'rotasi pair menguat' },
  ];

  return {
    breakdown: {
      total,
      volumeAnomaly,
      priceAcceleration,
      spreadTightening,
      orderbookImbalance,
      tradeBurst,
      breakoutReadiness,
      momentumPersistence,
      slippagePenalty,
      liquidityPenalty,
      overextensionPenalty,
      spoofPenalty,
      notes,
    },
    strategies,
  };
}
```

## `src/domain/signals/signalEngine.ts`

```ts
import type { SignalCandidate } from '../../core/types';
import { PairUniverse } from '../market/pairUniverse';
import type { MarketSnapshotBundle } from '../market/marketWatcher';
import { calculateScore } from './scoreCalculator';

export class SignalEngine {
  constructor(private readonly universe: PairUniverse) {}

  score(bundle: MarketSnapshotBundle): SignalCandidate {
    const calculated = calculateScore(bundle.ticker, bundle.orderbook);
    this.universe.updateScore(bundle.pair, calculated.breakdown.total, calculated.breakdown.total >= 75 ? bundle.ticker.capturedAt : null);

    return {
      pair: bundle.pair,
      score: calculated.breakdown.total,
      breakdown: calculated.breakdown,
      strategies: calculated.strategies,
      ticker: bundle.ticker,
      orderbook: bundle.orderbook,
      createdAt: bundle.ticker.capturedAt,
    };
  }

  scoreMany(bundles: MarketSnapshotBundle\[]): SignalCandidate\[] {
    return bundles.map((item) => this.score(item)).sort((a, b) => b.score - a.score);
  }
}
```

## `src/services/reportService.ts`

```ts
import type { HealthSnapshot, RuntimePosition, SignalCandidate } from '../core/types';

function asPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

export class ReportService {
  hotlistText(hotlist: SignalCandidate\[]): string {
    if (!hotlist.length) {
      return 'Hotlist kosong.';
    }

    return hotlist.slice(0, 10).map((item, index) => {
      const topStrategies = item.strategies
        .filter((strategy) => strategy.passed)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map((strategy) => strategy.name)
        .join(', ') || 'belum ada strategi dominan';

      return \[
        `${index + 1}. ${item.pair} | score=${item.score.toFixed(1)}`,
        `   chg1=${asPct(item.ticker.change1m)} chg5=${asPct(item.ticker.change5m)} spread=${asPct(item.ticker.spreadPct)}`,
        `   vol=${item.breakdown.volumeAnomaly.toFixed(1)} accel=${item.breakdown.priceAcceleration.toFixed(1)} ob=${item.breakdown.orderbookImbalance.toFixed(1)} burst=${item.breakdown.tradeBurst.toFixed(1)}`,
        `   strategi=${topStrategies}`,
        `   notes=${item.breakdown.notes.join('; ') || '-'}`,
      ].join('
');
    }).join('

');
  }

  marketWatchText(items: SignalCandidate\[]): string {
    if (!items.length) {
      return 'Market watch belum memiliki snapshot.';
    }

    return items.slice(0, 8).map((item, index) => (
      `${index + 1}. ${item.pair} | px=${item.ticker.lastPrice} | bid=${item.ticker.bestBid} | ask=${item.ticker.bestAsk} | score=${item.score.toFixed(1)}`
    )).join('
');
  }

  positionsText(positions: RuntimePosition\[]): string {
    const openPositions = positions.filter((item) => item.status === 'open');
    if (!openPositions.length) {
      return 'Belum ada posisi aktif.';
    }

    return openPositions.map((item, index) => \[
      `${index + 1}. ${item.pair} | qty=${item.remainingQuantity} | entry=${item.entryPrice} | mark=${item.lastMarkPrice}`,
      `   pnl\_real=${item.realizedPnl.toFixed(2)} pnl\_unreal=${item.unrealizedPnl.toFixed(2)} | score=${item.scoreAtEntry}`,
      `   tp=${item.takeProfitPct}% sl=${item.stopLossPct}% trail=${item.trailingStopPct}%`,
    ].join('
')).join('

');
  }

  signalBreakdownText(item: SignalCandidate): string {
    const b = item.breakdown;
    return \[
      `${item.pair} | score=${item.score.toFixed(1)}`,
      `price=${item.ticker.lastPrice} spread=${asPct(item.ticker.spreadPct)} liquidity=${item.ticker.liquidityScore.toFixed(1)}`,
      `+ volume=${b.volumeAnomaly.toFixed(1)} accel=${b.priceAcceleration.toFixed(1)} spread=${b.spreadTightening.toFixed(1)} ob=${b.orderbookImbalance.toFixed(1)} burst=${b.tradeBurst.toFixed(1)} breakout=${b.breakoutReadiness.toFixed(1)} persist=${b.momentumPersistence.toFixed(1)}`,
      `- slip=${b.slippagePenalty.toFixed(1)} liq=${b.liquidityPenalty.toFixed(1)} overext=${b.overextensionPenalty.toFixed(1)} spoof=${b.spoofPenalty.toFixed(1)}`,
      `notes: ${b.notes.join('; ') || '-'}`,
    ].join('
');
  }

  statusText(input: {
    health: HealthSnapshot;
    activeAccounts: number;
    topSignal?: SignalCandidate;
  }): string {
    return \[
      `Bot: ${input.health.started ? 'RUNNING' : 'STOPPED'}`,
      `Mode: ${input.health.mode}`,
      `Active Accounts: ${input.activeAccounts}`,
      `Open Positions: ${input.health.positionsOpen}`,
      `Pending Orders: ${input.health.pendingOrders}`,
      `Hotlist Count: ${input.health.hotlistCount}`,
      `Active Jobs: ${input.health.activeJobs}`,
      `Tick Count: ${input.health.tickCount}`,
      `Last Signal: ${input.topSignal ? `${input.topSignal.pair} (${input.topSignal.score.toFixed(1)})` : '-'}`,
      `Last Trade At: ${input.health.lastTradeAt ?? '-'}`,
      `Last Error: ${input.health.lastErrorMessage ?? '-'}`,
    ].join('
');
  }
}
```

\---

## Batch 3 + Batch 4 — hapus / replace total

* `src/domain/market/tickerSnapshot.ts`
* `src/domain/market/orderbookSnapshot.ts`
* `src/domain/market/pairClassifier.ts`
* `src/domain/market/pairUniverse.ts`
* `src/domain/market/hotlistService.ts`
* `src/domain/market/marketWatcher.ts`
* `src/integrations/indodax/mapper.ts`
* `src/domain/signals/strategies/volumeSpike.ts`
* `src/domain/signals/strategies/orderbookImbalance.ts`
* `src/domain/signals/strategies/silentAccumulation.ts`
* `src/domain/signals/strategies/breakoutRetest.ts`
* `src/domain/signals/strategies/hotRotation.ts`
* `src/domain/signals/scoreCalculator.ts`
* `src/domain/signals/signalEngine.ts`
* `src/services/reportService.ts`

## Setelah tempel batch ini

1. replace semua file batch 3 + 4 di atas
2. run `npm run build`
3. kalau masih ada error, fokusnya kemungkinan besar sudah pindah ke area trading core dan telegram layer

## Efek batch ini

* watcher tidak lagi hanya serial polos tanpa struktur tier
* pair universe sekarang punya HOT / A / B / C dan hotness score
* history snapshot dipakai untuk change1m / 3m / 5m / 15m
* score breakdown sudah punya notes dan strategi dominan
* report hotlist, market watch, status, dan breakdown sinyal jauh lebih usable

## `src/domain/trading/orderManager.ts`

```ts
import { randomUUID } from 'node:crypto';
import type { OrderSide, OrderStatus, RuntimeOrder } from '../../core/types';
import { nowIso } from '../../utils/time';
import { PersistenceService } from '../../services/persistenceService';

export class OrderManager {
  private orders: RuntimeOrder\[] = \[];

  constructor(private readonly persistence: PersistenceService) {}

  async load(): Promise<RuntimeOrder\[]> {
    const snapshot = await this.persistence.loadAll();
    this.orders = snapshot.orders;
    return this.orders;
  }

  list(): RuntimeOrder\[] {
    return this.orders;
  }

  listActive(): RuntimeOrder\[] {
    return this.orders.filter((item) => item.status === 'pending' || item.status === 'open' || item.status === 'partial');
  }

  getById(orderId: string): RuntimeOrder | undefined {
    return this.orders.find((item) => item.id === orderId);
  }

  async create(input: {
    accountId: string;
    pair: string;
    side: OrderSide;
    type?: 'market' | 'limit';
    price: number;
    quantity: number;
    status?: OrderStatus;
    reason?: string;
    externalOrderId?: string;
  }): Promise<RuntimeOrder> {
    const now = nowIso();
    const order: RuntimeOrder = {
      id: randomUUID(),
      accountId: input.accountId,
      pair: input.pair,
      side: input.side,
      type: input.type ?? 'limit',
      price: input.price,
      quantity: input.quantity,
      filledQuantity: 0,
      status: input.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
      externalOrderId: input.externalOrderId,
      reason: input.reason,
    };
    this.orders = \[order, ...this.orders];
    await this.persistence.saveOrders(this.orders);
    return order;
  }

  async update(orderId: string, patch: Partial<RuntimeOrder>): Promise<RuntimeOrder | undefined> {
    const current = this.getById(orderId);
    if (!current) {
      return undefined;
    }
    const next: RuntimeOrder = { ...current, ...patch, updatedAt: nowIso() };
    this.orders = this.orders.map((item) => (item.id === orderId ? next : item));
    await this.persistence.saveOrders(this.orders);
    return next;
  }

  async markFilled(orderId: string, filledQuantity: number, avgPrice?: number): Promise<RuntimeOrder | undefined> {
    return this.update(orderId, {
      filledQuantity,
      price: avgPrice ?? this.getById(orderId)?.price ?? 0,
      status: 'filled',
    });
  }

  async cancel(orderId: string, reason = 'manual cancel'): Promise<RuntimeOrder | undefined> {
    return this.update(orderId, { status: 'canceled', reason });
  }

  async cancelAll(reason = 'emergency cancel'): Promise<number> {
    const active = this.listActive();
    for (const order of active) {
      await this.cancel(order.id, reason);
    }
    return active.length;
  }
}
```

## `src/domain/trading/positionManager.ts`

```ts
import { randomUUID } from 'node:crypto';
import type { ExitReason, RuntimePosition } from '../../core/types';
import { nowIso } from '../../utils/time';
import { PersistenceService } from '../../services/persistenceService';

export class PositionManager {
  private positions: RuntimePosition\[] = \[];

  constructor(private readonly persistence: PersistenceService) {}

  async load(): Promise<RuntimePosition\[]> {
    const snapshot = await this.persistence.loadAll();
    this.positions = snapshot.positions;
    return this.positions;
  }

  list(): RuntimePosition\[] {
    return this.positions;
  }

  listOpen(): RuntimePosition\[] {
    return this.positions.filter((item) => item.status === 'open');
  }

  getById(positionId: string): RuntimePosition | undefined {
    return this.positions.find((item) => item.id === positionId);
  }

  getOpenByPair(pair: string): RuntimePosition\[] {
    return this.positions.filter((item) => item.status === 'open' \&\& item.pair === pair);
  }

  async open(input: {
    accountId: string;
    pair: string;
    entryPrice: number;
    quantity: number;
    scoreAtEntry: number;
    entryReason: string;
    stopLossPct: number;
    takeProfitPct: number;
    trailingStopPct: number;
    maxHoldMinutes: number;
  }): Promise<RuntimePosition> {
    const now = nowIso();
    const position: RuntimePosition = {
      id: randomUUID(),
      accountId: input.accountId,
      pair: input.pair,
      status: 'open',
      entryPrice: input.entryPrice,
      quantity: input.quantity,
      remainingQuantity: input.quantity,
      openedAt: now,
      updatedAt: now,
      closedAt: null,
      stopLossPct: input.stopLossPct,
      takeProfitPct: input.takeProfitPct,
      trailingStopPct: input.trailingStopPct,
      maxHoldMinutes: input.maxHoldMinutes,
      scoreAtEntry: input.scoreAtEntry,
      entryReason: input.entryReason,
      lastMarkPrice: input.entryPrice,
      realizedPnl: 0,
      unrealizedPnl: 0,
      exitReason: null,
    };
    this.positions = \[position, ...this.positions];
    await this.persistence.savePositions(this.positions);
    return position;
  }

  async updateMark(pair: string, markPrice: number): Promise<void> {
    this.positions = this.positions.map((item) => {
      if (item.status !== 'open' || item.pair !== pair) {
        return item;
      }
      const unrealizedPnl = (markPrice - item.entryPrice) \* item.remainingQuantity;
      return {
        ...item,
        lastMarkPrice: markPrice,
        unrealizedPnl,
        updatedAt: nowIso(),
      };
    });
    await this.persistence.savePositions(this.positions);
  }

  async partialClose(positionId: string, fraction: number, exitPrice: number, reason: ExitReason): Promise<RuntimePosition | undefined> {
    const current = this.getById(positionId);
    if (!current || current.status !== 'open') {
      return undefined;
    }
    const closeQty = Math.max(0, Math.min(current.remainingQuantity, current.remainingQuantity \* fraction));
    const remainingQuantity = Math.max(0, current.remainingQuantity - closeQty);
    const realizedPnl = current.realizedPnl + (exitPrice - current.entryPrice) \* closeQty;
    const closed = remainingQuantity <= 0.00000001;
    const next: RuntimePosition = {
      ...current,
      remainingQuantity,
      lastMarkPrice: exitPrice,
      realizedPnl,
      unrealizedPnl: (exitPrice - current.entryPrice) \* remainingQuantity,
      status: closed ? 'closed' : 'open',
      exitReason: closed ? reason : current.exitReason,
      closedAt: closed ? nowIso() : current.closedAt,
      updatedAt: nowIso(),
    };
    this.positions = this.positions.map((item) => (item.id === positionId ? next : item));
    await this.persistence.savePositions(this.positions);
    return next;
  }

  async forceClose(positionId: string, exitPrice: number, reason: ExitReason): Promise<RuntimePosition | undefined> {
    return this.partialClose(positionId, 1, exitPrice, reason);
  }
}
```

## `src/domain/trading/riskEngine.ts`

```ts
import type { AccountCredential, BotSettings, RuntimePosition, SignalCandidate } from '../../core/types';

export class RiskEngine {
  assertCanEnter(input: {
    account: AccountCredential;
    settings: BotSettings;
    signal: SignalCandidate;
    positions: RuntimePosition\[];
    amountIdr: number;
    pairCooldownUntil?: string | null;
  }): void {
    const { account, settings, signal, positions, amountIdr, pairCooldownUntil } = input;

    if (!account.enabled) {
      throw new Error('Account nonaktif');
    }
    if (signal.score < settings.strategy.scoreAutoEntryThreshold \&\& settings.tradingMode === 'FULL\_AUTO') {
      throw new Error('Score di bawah auto-entry threshold');
    }
    if (signal.ticker.spreadPct > settings.risk.maxSpreadPct) {
      throw new Error('Spread melebihi batas risiko');
    }
    if (signal.ticker.liquidityScore < settings.risk.minLiquidityScore) {
      throw new Error('Likuiditas pair tidak memenuhi minimum');
    }
    if (amountIdr > settings.risk.maxModalPerTrade) {
      throw new Error('Nominal melebihi max modal per trade');
    }
    if (positions.filter((item) => item.status === 'open').length >= settings.risk.maxActivePositionsTotal) {
      throw new Error('Melebihi max active positions total');
    }
    if (positions.filter((item) => item.status === 'open' \&\& item.accountId === account.id).length >= settings.risk.maxActivePositionsPerAccount) {
      throw new Error('Melebihi max active positions per account');
    }
    if (positions.filter((item) => item.status === 'open' \&\& item.pair === signal.pair).length >= settings.risk.maxExposurePerPair) {
      throw new Error('Exposure per pair sudah penuh');
    }
    if (pairCooldownUntil \&\& new Date(pairCooldownUntil).getTime() > Date.now()) {
      throw new Error('Pair masih cooldown');
    }
  }

  evaluateExit(position: RuntimePosition): { shouldExit: boolean; reason?: RuntimePosition\['exitReason'] } {
    if (position.status !== 'open') {
      return { shouldExit: false };
    }

    const changePct = position.entryPrice > 0 ? ((position.lastMarkPrice - position.entryPrice) / position.entryPrice) \* 100 : 0;
    if (changePct <= -Math.abs(position.stopLossPct)) {
      return { shouldExit: true, reason: 'stop\_loss' };
    }
    if (changePct >= Math.abs(position.takeProfitPct)) {
      return { shouldExit: true, reason: 'take\_profit' };
    }
    const heldMs = Date.now() - new Date(position.openedAt).getTime();
    if (heldMs >= position.maxHoldMinutes \* 60\_000) {
      return { shouldExit: true, reason: 'max\_hold' };
    }
    return { shouldExit: false };
  }
}
```

## `src/domain/trading/executionEngine.ts`

```ts
import type { SignalCandidate, TradingMode } from '../../core/types';
import { logger } from '../../core/logger';
import { AccountRegistry } from '../accounts/accountRegistry';
import { IndodaxClient } from '../../integrations/indodax/client';
import { JournalService } from '../../services/journalService';
import { StateService } from '../../services/stateService';
import { SettingsService } from '../settings/settingsService';
import { nowIso } from '../../utils/time';
import { OrderManager } from './orderManager';
import { PositionManager } from './positionManager';
import { RiskEngine } from './riskEngine';

export class ExecutionEngine {
  constructor(
    private readonly accounts: AccountRegistry,
    private readonly settings: SettingsService,
    private readonly state: StateService,
    private readonly risk: RiskEngine,
    private readonly indodax: IndodaxClient,
    private readonly positions: PositionManager,
    private readonly orders: OrderManager,
    private readonly journal: JournalService,
  ) {}

  private shouldSimulate(mode: TradingMode): boolean {
    const settings = this.settings.get();
    return settings.uiOnly || settings.dryRun || settings.paperTrade || mode === 'ALERT\_ONLY' || mode === 'OFF';
  }

  async attemptAutoBuy(signal: SignalCandidate): Promise<string> {
    const settings = this.settings.get();
    if (settings.tradingMode !== 'FULL\_AUTO') {
      return `skip auto-buy ${signal.pair}: mode=${settings.tradingMode}`;
    }

    const account = this.accounts.getDefault();
    if (!account) {
      throw new Error('Default account tidak tersedia');
    }

    this.risk.assertCanEnter({
      account,
      settings,
      signal,
      positions: this.positions.listOpen(),
      amountIdr: settings.risk.maxModalPerTrade,
      pairCooldownUntil: this.state.get().pairCooldowns\[signal.pair] ?? null,
    });

    return this.buy(account.id, signal, settings.risk.maxModalPerTrade, 'auto-score');
  }

  async buy(accountId: string, signal: SignalCandidate, amountIdr: number, reason = 'manual-buy'): Promise<string> {
    const settings = this.settings.get();
    const account = this.accounts.getById(accountId);
    if (!account) {
      throw new Error('Account tidak ditemukan');
    }

    this.risk.assertCanEnter({
      account,
      settings,
      signal,
      positions: this.positions.listOpen(),
      amountIdr,
      pairCooldownUntil: this.state.get().pairCooldowns\[signal.pair] ?? null,
    });

    const estimatedQty = signal.ticker.lastPrice > 0 ? amountIdr / signal.ticker.lastPrice : 0;
    const order = await this.orders.create({
      accountId,
      pair: signal.pair,
      side: 'buy',
      type: 'limit',
      price: signal.ticker.bestAsk || signal.ticker.lastPrice,
      quantity: estimatedQty,
      reason,
      status: 'open',
    });

    if (this.shouldSimulate(settings.tradingMode)) {
      await this.orders.markFilled(order.id, estimatedQty, signal.ticker.bestAsk || signal.ticker.lastPrice);
      await this.positions.open({
        accountId,
        pair: signal.pair,
        entryPrice: signal.ticker.bestAsk || signal.ticker.lastPrice,
        quantity: estimatedQty,
        scoreAtEntry: signal.score,
        entryReason: reason,
        stopLossPct: 2,
        takeProfitPct: 3,
        trailingStopPct: 1,
        maxHoldMinutes: 90,
      });
      await this.journal.append({
        id: order.id,
        accountId,
        pair: signal.pair,
        side: 'buy',
        quantity: estimatedQty,
        price: signal.ticker.bestAsk || signal.ticker.lastPrice,
        fee: 0,
        pnl: 0,
        scoreSnapshot: signal.score,
        reason: `${reason} simulated`,
        createdAt: nowIso(),
      });
      await this.state.markTrade();
      return `BUY simulated ${signal.pair} qty=${estimatedQty.toFixed(8)}`;
    }

    const result = await this.indodax.placeBuyOrder(account, signal.pair, signal.ticker.bestAsk || signal.ticker.lastPrice, estimatedQty);
    logger.info({ result, pair: signal.pair, accountId }, 'buy order sent');
    await this.orders.markFilled(order.id, estimatedQty, signal.ticker.bestAsk || signal.ticker.lastPrice);
    await this.positions.open({
      accountId,
      pair: signal.pair,
      entryPrice: signal.ticker.bestAsk || signal.ticker.lastPrice,
      quantity: estimatedQty,
      scoreAtEntry: signal.score,
      entryReason: reason,
      stopLossPct: 2,
      takeProfitPct: 3,
      trailingStopPct: 1,
      maxHoldMinutes: 90,
    });
    await this.state.markTrade();
    return `BUY live ${signal.pair} qty=${estimatedQty.toFixed(8)}`;
  }

  async manualSell(positionId: string, fraction: number, reason: 'manual' | 'emergency' | 'force\_close' = 'manual'): Promise<string> {
    const position = this.positions.getById(positionId);
    if (!position || position.status !== 'open') {
      throw new Error('Position tidak ditemukan');
    }

    const exitPrice = position.lastMarkPrice || position.entryPrice;
    const sideReason = reason === 'manual' ? `manual-sell-${Math.round(fraction \* 100)}` : reason;
    const order = await this.orders.create({
      accountId: position.accountId,
      pair: position.pair,
      side: 'sell',
      type: 'limit',
      price: exitPrice,
      quantity: position.remainingQuantity \* fraction,
      reason: sideReason,
      status: 'open',
    });

    await this.orders.markFilled(order.id, position.remainingQuantity \* fraction, exitPrice);
    const updated = await this.positions.partialClose(position.id, fraction, exitPrice, reason === 'force\_close' ? 'force\_close' : reason === 'emergency' ? 'emergency' : 'manual');
    await this.journal.append({
      id: order.id,
      accountId: position.accountId,
      pair: position.pair,
      side: 'sell',
      quantity: position.remainingQuantity \* fraction,
      price: exitPrice,
      fee: 0,
      pnl: updated?.realizedPnl ?? 0,
      scoreSnapshot: position.scoreAtEntry,
      reason: sideReason,
      createdAt: nowIso(),
    });
    await this.state.markTrade();
    return `SELL ${position.pair} ${Math.round(fraction \* 100)}% selesai`;
  }

  async evaluateOpenPositions(): Promise<string\[]> {
    const messages: string\[] = \[];
    for (const position of this.positions.listOpen()) {
      const exit = this.risk.evaluateExit(position);
      if (!exit.shouldExit || !exit.reason) {
        continue;
      }
      await this.manualSell(position.id, 1, exit.reason === 'take\_profit' || exit.reason === 'stop\_loss' || exit.reason === 'max\_hold' ? 'force\_close' : 'force\_close');
      messages.push(`${position.pair} exit by ${exit.reason}`);
    }
    return messages;
  }

  async cancelAllOrders(): Promise<string> {
    const count = await this.orders.cancelAll('emergency cancel all');
    return `Canceled ${count} active orders`;
  }

  async sellAllPositions(): Promise<string> {
    const open = this.positions.listOpen();
    for (const position of open) {
      await this.manualSell(position.id, 1, 'emergency');
    }
    return `Closed ${open.length} positions`;
  }
}
```

## `src/integrations/telegram/keyboards.ts`

```ts
import { Markup } from 'telegraf';
import type { RuntimePosition, SignalCandidate, TradingMode } from '../../core/types';
import { buildCallback } from './callbackRouter';

export const mainMenuKeyboard = Markup.keyboard(\[
  \['▶️ Start Bot', '⏹️ Stop Bot', '📊 Status'],
  \['👀 Market Watch', '🔥 Hotlist', '📦 Positions'],
  \['🧾 Orders', '🟢 Manual Buy', '🔴 Manual Sell'],
  \['⚙️ Strategy Settings', '🛡️ Risk Settings', '👤 Accounts'],
  \['🪵 Logs', '🚨 Emergency Controls'],
]).resize();

export const emergencyKeyboard = Markup.inlineKeyboard(\[
  \[Markup.button.callback('Pause Auto', buildCallback('EMG', 'MODE', 'ALERT\_ONLY'))],
  \[Markup.button.callback('Pause All', buildCallback('EMG', 'MODE', 'OFF'))],
  \[Markup.button.callback('Cancel All Orders', buildCallback('EMG', 'CANCEL\_ALL'))],
  \[Markup.button.callback('Sell All Positions', buildCallback('EMG', 'SELL\_ALL'))],
]);

export const accountsKeyboard = Markup.inlineKeyboard(\[
  \[Markup.button.callback('List Accounts', buildCallback('ACC', 'LIST'))],
  \[Markup.button.callback('Upload JSON', buildCallback('ACC', 'UPLOAD'))],
  \[Markup.button.callback('Reload', buildCallback('ACC', 'RELOAD'))],
]);

export function tradingModeKeyboard(current: TradingMode) {
  return Markup.inlineKeyboard(\[
    \[Markup.button.callback(`${current === 'OFF' ? '✅ ' : ''}OFF`, buildCallback('SET', 'MODE', 'OFF'))],
    \[Markup.button.callback(`${current === 'ALERT\_ONLY' ? '✅ ' : ''}ALERT\_ONLY`, buildCallback('SET', 'MODE', 'ALERT\_ONLY'))],
    \[Markup.button.callback(`${current === 'SEMI\_AUTO' ? '✅ ' : ''}SEMI\_AUTO`, buildCallback('SET', 'MODE', 'SEMI\_AUTO'))],
    \[Markup.button.callback(`${current === 'FULL\_AUTO' ? '✅ ' : ''}FULL\_AUTO`, buildCallback('SET', 'MODE', 'FULL\_AUTO'))],
  ]);
}

export function hotlistKeyboard(hotlist: SignalCandidate\[]) {
  return Markup.inlineKeyboard(
    hotlist.slice(0, 8).map((item) => \[
      Markup.button.callback(`${item.pair} (${item.score.toFixed(0)})`, buildCallback('SIG', 'DETAIL', undefined, item.pair)),
      Markup.button.callback(`Buy ${item.pair}`, buildCallback('BUY', 'PICK', undefined, item.pair)),
    ]),
  );
}

export function positionsKeyboard(positions: RuntimePosition\[]) {
  return Markup.inlineKeyboard(
    positions.slice(0, 12).flatMap((item) => (\[
      \[Markup.button.callback(`${item.pair} ${item.remainingQuantity}`, buildCallback('POS', 'DETAIL', item.id))],
      \[
        Markup.button.callback('Sell 25%', buildCallback('POS', 'SELL25', item.id)),
        Markup.button.callback('Sell 50%', buildCallback('POS', 'SELL50', item.id)),
      ],
      \[
        Markup.button.callback('Sell 75%', buildCallback('POS', 'SELL75', item.id)),
        Markup.button.callback('Sell 100%', buildCallback('POS', 'SELL100', item.id)),
      ],
    ])),
  );
}
```

## `src/integrations/telegram/uploadHandler.ts`

```ts
import type { Context } from 'telegraf';
import { AccountRegistry } from '../../domain/accounts/accountRegistry';
import { AccountStore } from '../../domain/accounts/accountStore';

export class UploadHandler {
  constructor(
    private readonly store: AccountStore,
    private readonly registry: AccountRegistry,
  ) {}

  async handleDocument(ctx: Context): Promise<string> {
    const message = ctx.message as { document?: { file\_name?: string; file\_id: string } } | undefined;
    const doc = message?.document;
    if (!doc?.file\_name?.toLowerCase().endsWith('.json')) {
      throw new Error('Hanya file .json yang diizinkan');
    }

    const url = await ctx.telegram.getFileLink(doc.file\_id);
    const response = await fetch(url.toString());
    const text = await response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('File JSON tidak valid');
    }

    const accounts = await this.store.saveLegacyUpload(parsed);
    await this.registry.reload();
    return `Upload berhasil. ${accounts.length} account tersimpan di data/accounts/accounts.json`;
  }
}
```

## `src/integrations/telegram/handlers.ts`

```ts
import type { Context, Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import type { SignalCandidate } from '../../core/types';
import { AccountRegistry } from '../../domain/accounts/accountRegistry';
import { HotlistService } from '../../domain/market/hotlistService';
import { ExecutionEngine } from '../../domain/trading/executionEngine';
import { OrderManager } from '../../domain/trading/orderManager';
import { PositionManager } from '../../domain/trading/positionManager';
import { SettingsService } from '../../domain/settings/settingsService';
import { HealthService } from '../../services/healthService';
import { JournalService } from '../../services/journalService';
import { ReportService } from '../../services/reportService';
import { StateService } from '../../services/stateService';
import { isAllowedUser } from './auth';
import { buildCallback, parseCallback } from './callbackRouter';
import { accountsKeyboard, emergencyKeyboard, hotlistKeyboard, mainMenuKeyboard, positionsKeyboard, tradingModeKeyboard } from './keyboards';
import { UploadHandler } from './uploadHandler';

interface HandlerDeps {
  report: ReportService;
  health: HealthService;
  state: StateService;
  hotlist: HotlistService;
  positions: PositionManager;
  orders: OrderManager;
  accounts: AccountRegistry;
  settings: SettingsService;
  execution: ExecutionEngine;
  journal: JournalService;
  uploadHandler: UploadHandler;
}

interface UserFlowState {
  awaitingUpload: boolean;
  pendingBuyPair?: string;
  pendingSellPositionId?: string;
}

const flow = new Map<number, UserFlowState>();

function getFlow(userId: number): UserFlowState {
  const current = flow.get(userId) ?? { awaitingUpload: false };
  flow.set(userId, current);
  return current;
}

async function deny(ctx: Context): Promise<boolean> {
  const userId = ctx.from?.id;
  if (userId \&\& isAllowedUser(userId)) {
    return false;
  }
  await ctx.reply('Access denied');
  return true;
}

function getTopSignal(hotlist: HotlistService, pair?: string): SignalCandidate | undefined {
  if (!pair) {
    return hotlist.list()\[0];
  }
  return hotlist.get(pair) ?? hotlist.list().find((item) => item.pair === pair);
}

export function registerHandlers(bot: Telegraf, deps: HandlerDeps): void {
  bot.start(async (ctx) => {
    if (await deny(ctx)) return;
    await ctx.reply('Bot aktif. Gunakan tombol menu utama.', mainMenuKeyboard);
  });

  bot.hears('▶️ Start Bot', async (ctx) => {
    if (await deny(ctx)) return;
    await deps.state.setStarted(true);
    await ctx.reply('Engine started.', mainMenuKeyboard);
  });

  bot.hears('⏹️ Stop Bot', async (ctx) => {
    if (await deny(ctx)) return;
    await deps.state.setStarted(false);
    await ctx.reply('Engine stopped.', mainMenuKeyboard);
  });

  bot.hears('📊 Status', async (ctx) => {
    if (await deny(ctx)) return;
    const health = deps.health.snapshot({
      positions: deps.positions.list(),
      orders: deps.orders.list(),
      hotlist: deps.hotlist.list(),
    });
    await ctx.reply(deps.report.statusText({
      health,
      activeAccounts: deps.accounts.listEnabled().length,
      topSignal: deps.hotlist.list()\[0],
    }), mainMenuKeyboard);
  });

  bot.hears('🔥 Hotlist', async (ctx) => {
    if (await deny(ctx)) return;
    const list = deps.hotlist.list();
    await ctx.reply(deps.report.hotlistText(list), hotlistKeyboard(list));
  });

  bot.hears('👀 Market Watch', async (ctx) => {
    if (await deny(ctx)) return;
    await ctx.reply(deps.report.marketWatchText(deps.hotlist.list()), mainMenuKeyboard);
  });

  bot.hears('📦 Positions', async (ctx) => {
    if (await deny(ctx)) return;
    const open = deps.positions.listOpen();
    if (!open.length) {
      await ctx.reply('Belum ada posisi aktif.', mainMenuKeyboard);
      return;
    }
    await ctx.reply(deps.report.positionsText(open), positionsKeyboard(open));
  });

  bot.hears('🧾 Orders', async (ctx) => {
    if (await deny(ctx)) return;
    const lines = deps.orders.list().slice(0, 10).map((item) => `${item.pair} ${item.side} ${item.status} qty=${item.quantity.toFixed(8)} px=${item.price}`);
    await ctx.reply(lines.length ? lines.join('
') : 'Belum ada order.', mainMenuKeyboard);
  });

  bot.hears('🟢 Manual Buy', async (ctx) => {
    if (await deny(ctx)) return;
    const list = deps.hotlist.list();
    if (!list.length) {
      await ctx.reply('Hotlist kosong. Tunggu market watcher mengisi kandidat.', mainMenuKeyboard);
      return;
    }
    await ctx.reply('Pilih pair dari hotlist untuk manual buy.', hotlistKeyboard(list));
  });

  bot.hears('🔴 Manual Sell', async (ctx) => {
    if (await deny(ctx)) return;
    const open = deps.positions.listOpen();
    if (!open.length) {
      await ctx.reply('Belum ada posisi aktif.', mainMenuKeyboard);
      return;
    }
    await ctx.reply('Pilih posisi untuk dijual.', positionsKeyboard(open));
  });

  bot.hears('⚙️ Strategy Settings', async (ctx) => {
    if (await deny(ctx)) return;
    await ctx.reply(`Mode saat ini: ${deps.settings.get().tradingMode}`, tradingModeKeyboard(deps.settings.get().tradingMode));
  });

  bot.hears('🛡️ Risk Settings', async (ctx) => {
    if (await deny(ctx)) return;
    const risk = deps.settings.get().risk;
    await ctx.reply(\[
      `maxModalPerTrade=${risk.maxModalPerTrade}`,
      `maxActivePositionsTotal=${risk.maxActivePositionsTotal}`,
      `maxActivePositionsPerAccount=${risk.maxActivePositionsPerAccount}`,
      `maxExposurePerPair=${risk.maxExposurePerPair}`,
      `maxSpreadPct=${risk.maxSpreadPct}`,
      `maxSlippagePct=${risk.maxSlippagePct}`,
      `minLiquidityScore=${risk.minLiquidityScore}`,
    ].join('
'), mainMenuKeyboard);
  });

  bot.hears('👤 Accounts', async (ctx) => {
    if (await deny(ctx)) return;
    const lines = deps.accounts.listAll().map((item) => `• ${item.name} | ${item.enabled ? 'enabled' : 'disabled'}${item.isDefault ? ' | default' : ''}`);
    await ctx.reply(`Accounts:
${lines.join('
') || '-'}`, accountsKeyboard);
  });

  bot.hears('🪵 Logs', async (ctx) => {
    if (await deny(ctx)) return;
    const lines = deps.journal.list().slice(0, 10).map((item) => `${item.createdAt} | ${item.pair} | ${item.side} | qty=${item.quantity.toFixed(8)} | pnl=${item.pnl.toFixed(2)}`);
    await ctx.reply(lines.length ? lines.join('
') : 'Belum ada journal trade.', mainMenuKeyboard);
  });

  bot.hears('🚨 Emergency Controls', async (ctx) => {
    if (await deny(ctx)) return;
    await ctx.reply('Emergency controls:', emergencyKeyboard);
  });

  bot.action(/.\*/, async (ctx) => {
    if (await deny(ctx)) return;
    const parsed = parseCallback(ctx.callbackQuery \&\& 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '');
    if (!parsed) {
      await ctx.answerCbQuery('Callback tidak valid');
      return;
    }

    const userId = ctx.from?.id;
    const userFlow = userId ? getFlow(userId) : undefined;

    if (parsed.namespace === 'ACC' \&\& parsed.action === 'UPLOAD') {
      if (userFlow) {
        userFlow.awaitingUpload = true;
      }
      await ctx.reply('Silakan kirim file JSON legacy account sekarang.');
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'ACC' \&\& parsed.action === 'LIST') {
      const lines = deps.accounts.listAll().map((item) => `• ${item.name} | ${item.enabled ? 'enabled' : 'disabled'}${item.isDefault ? ' | default' : ''}`);
      await ctx.reply(lines.join('
') || 'Belum ada account.');
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'ACC' \&\& parsed.action === 'RELOAD') {
      await deps.accounts.reload();
      await ctx.reply('Accounts reloaded.');
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'SET' \&\& parsed.action === 'MODE' \&\& parsed.accountId) {
      await deps.settings.setTradingMode(parsed.accountId as any);
      await deps.state.setTradingMode(parsed.accountId as any);
      await ctx.reply(`Trading mode diubah ke ${parsed.accountId}`);
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'SIG' \&\& parsed.action === 'DETAIL' \&\& parsed.pair) {
      const signal = getTopSignal(deps.hotlist, parsed.pair);
      if (!signal) {
        await ctx.reply('Signal tidak ditemukan.');
      } else {
        await ctx.reply(deps.report.signalBreakdownText(signal));
      }
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'BUY' \&\& parsed.action === 'PICK' \&\& parsed.pair) {
      if (userFlow) {
        userFlow.pendingBuyPair = parsed.pair;
      }
      await ctx.reply(`Kirim nominal IDR untuk buy ${parsed.pair}. Contoh: 250000`);
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'POS' \&\& parsed.action.startsWith('SELL') \&\& parsed.accountId) {
      const fractionMap: Record<string, number> = { SELL25: 0.25, SELL50: 0.5, SELL75: 0.75, SELL100: 1 };
      const fraction = fractionMap\[parsed.action] ?? 1;
      const result = await deps.execution.manualSell(parsed.accountId, fraction, 'manual');
      await ctx.reply(result);
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'POS' \&\& parsed.action === 'DETAIL' \&\& parsed.accountId) {
      const position = deps.positions.getById(parsed.accountId);
      if (position) {
        await ctx.reply(`Position ${position.pair}
qty=${position.remainingQuantity}
entry=${position.entryPrice}
mark=${position.lastMarkPrice}`);
      }
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'EMG' \&\& parsed.action === 'MODE' \&\& parsed.accountId) {
      await deps.settings.setTradingMode(parsed.accountId as any);
      await deps.state.setTradingMode(parsed.accountId as any);
      await ctx.reply(`Emergency mode: ${parsed.accountId}`);
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'EMG' \&\& parsed.action === 'CANCEL\_ALL') {
      await ctx.reply(await deps.execution.cancelAllOrders());
      await ctx.answerCbQuery();
      return;
    }

    if (parsed.namespace === 'EMG' \&\& parsed.action === 'SELL\_ALL') {
      await ctx.reply(await deps.execution.sellAllPositions());
      await ctx.answerCbQuery();
      return;
    }

    await ctx.answerCbQuery('Aksi belum dikenali');
  });

  bot.on('document', async (ctx) => {
    if (await deny(ctx)) return;
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('User tidak dikenali.');
      return;
    }
    const userFlow = getFlow(userId);
    if (!userFlow.awaitingUpload) {
      await ctx.reply('Pilih menu Accounts -> Upload JSON terlebih dahulu.');
      return;
    }
    try {
      const message = await deps.uploadHandler.handleDocument(ctx);
      userFlow.awaitingUpload = false;
      await ctx.reply(message, mainMenuKeyboard);
    } catch (error) {
      await ctx.reply(error instanceof Error ? error.message : 'Upload gagal');
    }
  });

  bot.on('text', async (ctx) => {
    if (await deny(ctx)) return;
    const userId = ctx.from?.id;
    if (!userId) {
      return;
    }
    const userFlow = getFlow(userId);
    const text = (ctx.message as { text?: string }).text?.trim() ?? '';

    if (userFlow.pendingBuyPair) {
      const amountIdr = Number(text.replace(/\[^0-9.]/g, ''));
      if (!Number.isFinite(amountIdr) || amountIdr <= 0) {
        await ctx.reply('Nominal buy tidak valid. Kirim angka murni, misalnya 250000');
        return;
      }
      const signal = getTopSignal(deps.hotlist, userFlow.pendingBuyPair);
      const account = deps.accounts.getDefault();
      if (!signal || !account) {
        userFlow.pendingBuyPair = undefined;
        await ctx.reply('Signal atau default account tidak tersedia.');
        return;
      }
      const result = await deps.execution.buy(account.id, signal, amountIdr, 'manual-buy');
      userFlow.pendingBuyPair = undefined;
      await ctx.reply(result, mainMenuKeyboard);
    }
  });
}
```

## `src/integrations/telegram/bot.ts`

```ts
import type { Telegraf } from 'telegraf';
import { Telegraf as TelegrafBot } from 'telegraf';
import { env } from '../../config/env';
import { AccountRegistry } from '../../domain/accounts/accountRegistry';
import { HotlistService } from '../../domain/market/hotlistService';
import { ExecutionEngine } from '../../domain/trading/executionEngine';
import { OrderManager } from '../../domain/trading/orderManager';
import { PositionManager } from '../../domain/trading/positionManager';
import { SettingsService } from '../../domain/settings/settingsService';
import { HealthService } from '../../services/healthService';
import { JournalService } from '../../services/journalService';
import { ReportService } from '../../services/reportService';
import { StateService } from '../../services/stateService';
import { registerHandlers } from './handlers';
import { UploadHandler } from './uploadHandler';
import { AccountStore } from '../../domain/accounts/accountStore';

export class TelegramBot {
  private readonly bot: Telegraf;

  constructor(deps: {
    report: ReportService;
    health: HealthService;
    state: StateService;
    hotlist: HotlistService;
    positions: PositionManager;
    orders: OrderManager;
    accounts: AccountRegistry;
    accountStore: AccountStore;
    settings: SettingsService;
    execution: ExecutionEngine;
    journal: JournalService;
  }) {
    this.bot = new TelegrafBot(env.telegramToken);
    registerHandlers(this.bot, {
      ...deps,
      uploadHandler: new UploadHandler(deps.accountStore, deps.accounts),
    });
  }

  async start(): Promise<void> {
    await this.bot.launch();
  }

  async stop(): Promise<void> {
    await this.bot.stop();
  }
}
```

## `src/app.ts` (replace lagi agar trading core + Telegram benar-benar terhubung)

```ts
import { logger } from './core/logger';
import { LightScheduler } from './core/scheduler';
import { registerShutdown } from './core/shutdown';
import { AccountRegistry } from './domain/accounts/accountRegistry';
import { AccountStore } from './domain/accounts/accountStore';
import { HotlistService } from './domain/market/hotlistService';
import { MarketWatcher } from './domain/market/marketWatcher';
import { PairUniverse } from './domain/market/pairUniverse';
import { SignalEngine } from './domain/signals/signalEngine';
import { SettingsService } from './domain/settings/settingsService';
import { ExecutionEngine } from './domain/trading/executionEngine';
import { OrderManager } from './domain/trading/orderManager';
import { PositionManager } from './domain/trading/positionManager';
import { RiskEngine } from './domain/trading/riskEngine';
import { IndodaxClient } from './integrations/indodax/client';
import { TelegramBot } from './integrations/telegram/bot';
import { HealthService } from './services/healthService';
import { JournalService } from './services/journalService';
import { PersistenceService } from './services/persistenceService';
import { PollingService } from './services/pollingService';
import { ReportService } from './services/reportService';
import { StateService } from './services/stateService';

export async function createApp(): Promise<{ start: () => Promise<void>; stop: () => Promise<void> }> {
  const scheduler = new LightScheduler();
  const polling = new PollingService(scheduler);
  const persistence = new PersistenceService();
  const state = new StateService(persistence);
  const settings = new SettingsService(persistence);
  const journal = new JournalService(persistence);
  const orderManager = new OrderManager(persistence);
  const positionManager = new PositionManager(persistence);
  const accountStore = new AccountStore();
  const accountRegistry = new AccountRegistry(accountStore);

  await Promise.all(\[
    state.load(),
    settings.load(),
    journal.load(),
    orderManager.load(),
    positionManager.load(),
    accountRegistry.reload(),
  ]);

  const report = new ReportService();
  const health = new HealthService(state);
  const universe = new PairUniverse();
  const indodax = new IndodaxClient();
  const watcher = new MarketWatcher(indodax, universe);
  const signals = new SignalEngine(universe);
  const hotlist = new HotlistService();
  const risk = new RiskEngine();
  const execution = new ExecutionEngine(accountRegistry, settings, state, risk, indodax, positionManager, orderManager, journal);

  const telegram = new TelegramBot({
    report,
    health,
    state,
    hotlist,
    positions: positionManager,
    orders: orderManager,
    accounts: accountRegistry,
    accountStore,
    settings,
    execution,
    journal,
  });

  polling.register('market-watch', 2500, async () => {
    if (!state.get().started) {
      return;
    }
    const bundles = await watcher.batchSnapshot(4);
    for (const bundle of bundles) {
      await positionManager.updateMark(bundle.pair, bundle.ticker.lastPrice);
    }
    const scored = signals.scoreMany(bundles);
    const list = hotlist.update(scored);
    await persistence.saveHotlist(list);
    await persistence.savePairMetrics(universe.exportMetrics(watcher.exportHistory()));
    if (list\[0]) {
      await state.markSignal();
    }
    if (list\[0] \&\& settings.get().tradingMode === 'FULL\_AUTO' \&\& list\[0].score >= settings.get().strategy.scoreAutoEntryThreshold) {
      try {
        const result = await execution.attemptAutoBuy(list\[0]);
        logger.info({ result, pair: list\[0].pair }, 'auto-buy evaluated');
      } catch (error) {
        await state.markError(error instanceof Error ? error.message : 'auto-buy error');
      }
    }
  });

  polling.register('position-exit-check', 5000, async () => {
    if (!state.get().started) {
      return;
    }
    const exits = await execution.evaluateOpenPositions();
    if (exits.length) {
      logger.info({ exits }, 'position exits executed');
    }
  });

  polling.register('heartbeat', 5000, async () => {
    const current = state.get();
    await state.patch({
      uptimeMs: current.startedAt ? Math.max(0, Date.now() - new Date(current.startedAt).getTime()) : current.uptimeMs,
      pollingStats: {
        activeJobs: polling.stats().activeJobs,
        jobs: undefined as never,
        tickCount: current.pollingStats.tickCount + 1,
        lastTickAt: new Date().toISOString(),
      } as any,
    });
  });

  const start = async (): Promise<void> => {
    await state.setStarted(true);
    polling.start();
    await telegram.start();
    logger.info({ accounts: accountRegistry.listEnabled().length }, 'mafiamarkets app started');
  };

  const stop = async (): Promise<void> => {
    polling.stop();
    await telegram.stop();
    await state.patch({ started: false, marketWatcherRunning: false });
    logger.info('mafiamarkets app stopped');
  };

  registerShutdown(\[stop]);

  return { start, stop };
}
```

\---

## Batch 5 + Batch 6 — hapus / replace total

* `src/domain/trading/orderManager.ts`
* `src/domain/trading/positionManager.ts`
* `src/domain/trading/riskEngine.ts`
* `src/domain/trading/executionEngine.ts`
* `src/integrations/telegram/keyboards.ts`
* `src/integrations/telegram/uploadHandler.ts`
* `src/integrations/telegram/handlers.ts`
* `src/integrations/telegram/bot.ts`
* `src/app.ts`

## Setelah tempel batch ini

1. replace semua file batch 5 + 6 di atas
2. run `npm run build`
3. bila masih ada error, tinggal area final pass root/config yang perlu dirapikan sinkron penuh

## Efek batch ini

* order lifecycle sekarang ada create/update/fill/cancel/cancelAll
* position sekarang ada open/update mark/partial close/force close
* risk engine tidak lagi cuma tipis; sudah cek spread, liquidity, total/account exposure, cooldown
* execution engine sudah punya manual sell 25/50/75/100, cancel all, sell all, auto-buy path, exit evaluation
* Telegram UI sudah tidak lagi placeholder untuk menu inti utama
* upload legacy JSON sudah masuk ke `data/accounts/accounts.json`

## `src/config/env.ts`

```ts
import path from 'node:path';

function getString(keys: string\[], fallback = ''): string {
  for (const key of keys) {
    const value = process.env\[key];
    if (typeof value === 'string' \&\& value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
}

function getNumber(keys: string\[], fallback: number): number {
  const raw = getString(keys);
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getBoolean(keys: string\[], fallback: boolean): boolean {
  const raw = getString(keys);
  if (!raw) {
    return fallback;
  }
  return \['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function getAllowedUserIds(): number\[] {
  const raw = getString(\['TELEGRAM\_ALLOWED\_USER\_IDS'], '');
  if (!raw) {
    return \[];
  }
  return raw
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) \&\& item > 0);
}

const dataDir = getString(\['DATA\_DIR'], './data');
const logDir = getString(\['LOG\_DIR'], './logs');

export const env = {
  NODE\_ENV: getString(\['NODE\_ENV'], 'development'),
  LOG\_LEVEL: getString(\['LOG\_LEVEL'], 'info'),

  telegramToken: getString(\['TELEGRAM\_BOT\_TOKEN', 'TELEGRAM\_TOKEN']),
  TELEGRAM\_ALLOWED\_USER\_IDS: getAllowedUserIds(),
  TELEGRAM\_BOT\_UI\_ONLY: getBoolean(\['TELEGRAM\_BOT\_UI\_ONLY'], true),

  INDODAX\_PUBLIC\_BASE\_URL: getString(\['INDODAX\_PUBLIC\_BASE\_URL'], 'https://indodax.com'),
  INDODAX\_PRIVATE\_BASE\_URL: getString(\['INDODAX\_PRIVATE\_BASE\_URL'], 'https://indodax.com'),

  HTTP\_TIMEOUT\_MS: getNumber(\['HTTP\_TIMEOUT\_MS'], 10\_000),
  STATE\_FLUSH\_INTERVAL\_MS: getNumber(\['STATE\_FLUSH\_INTERVAL\_MS'], 5\_000),

  DATA\_DIR: path.resolve(dataDir),
  LOG\_DIR: path.resolve(logDir),

  DRY\_RUN: getBoolean(\['DRY\_RUN'], false),
  PAPER\_TRADE: getBoolean(\['PAPER\_TRADE'], false),

  MAX\_POSITION\_SIZE\_IDR: getNumber(\['MAX\_POSITION\_SIZE\_IDR'], 250\_000),
  MAX\_ACTIVE\_POSITIONS: getNumber(\['MAX\_ACTIVE\_POSITIONS'], 5),
  PAIR\_COOLDOWN\_MINUTES: getNumber(\['PAIR\_COOLDOWN\_MINUTES'], 20),
  MAX\_SPREAD\_PCT: getNumber(\['MAX\_SPREAD\_PCT'], 0.8),
  MAX\_SLIPPAGE\_PCT: getNumber(\['MAX\_SLIPPAGE\_PCT'], 1),
};

export function assertCriticalEnv(): void {
  if (!env.telegramToken) {
    throw new Error('TELEGRAM\_BOT\_TOKEN / TELEGRAM\_TOKEN wajib diisi');
  }
}
```

## `src/core/metrics.ts`

```ts
export interface RuntimeMetricSnapshot {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  timestamps: Record<string, string>;
}

export class MetricsRegistry {
  private readonly counters: Record<string, number> = {};
  private readonly gauges: Record<string, number> = {};
  private readonly timestamps: Record<string, string> = {};

  increment(name: string, by = 1): void {
    this.counters\[name] = (this.counters\[name] ?? 0) + by;
    this.timestamps\[name] = new Date().toISOString();
  }

  setGauge(name: string, value: number): void {
    this.gauges\[name] = value;
    this.timestamps\[name] = new Date().toISOString();
  }

  snapshot(): RuntimeMetricSnapshot {
    return {
      counters: { ...this.counters },
      gauges: { ...this.gauges },
      timestamps: { ...this.timestamps },
    };
  }
}
```

## `src/core/locks.ts`

```ts
export class KeyedLock {
  private readonly active = new Set<string>();

  async withKey<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.active.has(key)) {
      throw new Error(`Lock aktif untuk key: ${key}`);
    }

    this.active.add(key);
    try {
      return await fn();
    } finally {
      this.active.delete(key);
    }
  }

  isLocked(key: string): boolean {
    return this.active.has(key);
  }
}
```

## `src/integrations/telegram/auth.ts`

```ts
import { env } from '../../config/env';

export function isAllowedUser(userId: number): boolean {
  if (!env.TELEGRAM\_ALLOWED\_USER\_IDS.length) {
    return false;
  }
  return env.TELEGRAM\_ALLOWED\_USER\_IDS.includes(userId);
}
```

## `src/integrations/telegram/callbackRouter.ts`

```ts
export interface ParsedCallback {
  namespace: string;
  action: string;
  accountId?: string;
  pair?: string;
}

export function buildCallback(namespace: string, action: string, accountId?: string, pair?: string): string {
  const parts = \[namespace, action, accountId ?? '', pair ?? ''];
  return parts.join('|').slice(0, 64);
}

export function parseCallback(value: string): ParsedCallback | null {
  if (!value || value.length > 64) {
    return null;
  }

  const \[namespace, action, accountId, pair] = value.split('|');
  if (!namespace || !action) {
    return null;
  }

  return {
    namespace,
    action,
    accountId: accountId || undefined,
    pair: pair || undefined,
  };
}
```

## `src/app.ts` (final replace agar heartbeat/state lebih bersih)

```ts
import { logger } from './core/logger';
import { LightScheduler } from './core/scheduler';
import { registerShutdown } from './core/shutdown';
import { assertCriticalEnv } from './config/env';
import { AccountRegistry } from './domain/accounts/accountRegistry';
import { AccountStore } from './domain/accounts/accountStore';
import { HotlistService } from './domain/market/hotlistService';
import { MarketWatcher } from './domain/market/marketWatcher';
import { PairUniverse } from './domain/market/pairUniverse';
import { SignalEngine } from './domain/signals/signalEngine';
import { SettingsService } from './domain/settings/settingsService';
import { ExecutionEngine } from './domain/trading/executionEngine';
import { OrderManager } from './domain/trading/orderManager';
import { PositionManager } from './domain/trading/positionManager';
import { RiskEngine } from './domain/trading/riskEngine';
import { IndodaxClient } from './integrations/indodax/client';
import { TelegramBot } from './integrations/telegram/bot';
import { HealthService } from './services/healthService';
import { JournalService } from './services/journalService';
import { PersistenceService } from './services/persistenceService';
import { PollingService } from './services/pollingService';
import { ReportService } from './services/reportService';
import { StateService } from './services/stateService';

export async function createApp(): Promise<{ start: () => Promise<void>; stop: () => Promise<void> }> {
  assertCriticalEnv();

  const scheduler = new LightScheduler();
  const polling = new PollingService(scheduler);
  const persistence = new PersistenceService();
  const state = new StateService(persistence);
  const settings = new SettingsService(persistence);
  const journal = new JournalService(persistence);
  const orderManager = new OrderManager(persistence);
  const positionManager = new PositionManager(persistence);
  const accountStore = new AccountStore();
  const accountRegistry = new AccountRegistry(accountStore);

  await Promise.all(\[
    state.load(),
    settings.load(),
    journal.load(),
    orderManager.load(),
    positionManager.load(),
    accountRegistry.reload(),
  ]);

  const report = new ReportService();
  const health = new HealthService(state);
  const universe = new PairUniverse();
  const indodax = new IndodaxClient();
  const watcher = new MarketWatcher(indodax, universe);
  const signals = new SignalEngine(universe);
  const hotlist = new HotlistService();
  const risk = new RiskEngine();
  const execution = new ExecutionEngine(accountRegistry, settings, state, risk, indodax, positionManager, orderManager, journal);

  const telegram = new TelegramBot({
    report,
    health,
    state,
    hotlist,
    positions: positionManager,
    orders: orderManager,
    accounts: accountRegistry,
    accountStore,
    settings,
    execution,
    journal,
  });

  polling.register('market-watch', 2\_500, async () => {
    if (!state.get().started) {
      return;
    }

    const bundles = await watcher.batchSnapshot(4);
    for (const bundle of bundles) {
      await positionManager.updateMark(bundle.pair, bundle.ticker.lastPrice);
    }

    const scored = signals.scoreMany(bundles);
    const list = hotlist.update(scored);
    await persistence.saveHotlist(list);
    await persistence.savePairMetrics(universe.exportMetrics(watcher.exportHistory()));

    if (list\[0]) {
      await state.markSignal();
    }

    if (list\[0] \&\& settings.get().tradingMode === 'FULL\_AUTO' \&\& list\[0].score >= settings.get().strategy.scoreAutoEntryThreshold) {
      try {
        const result = await execution.attemptAutoBuy(list\[0]);
        logger.info({ result, pair: list\[0].pair }, 'auto-buy evaluated');
      } catch (error) {
        await state.markError(error instanceof Error ? error.message : 'auto-buy error');
      }
    }
  });

  polling.register('position-exit-check', 5\_000, async () => {
    if (!state.get().started) {
      return;
    }
    const exits = await execution.evaluateOpenPositions();
    if (exits.length) {
      logger.info({ exits }, 'position exits executed');
    }
  });

  polling.register('heartbeat', 5\_000, async () => {
    const current = state.get();
    await state.patch({
      uptimeMs: current.startedAt ? Math.max(0, Date.now() - new Date(current.startedAt).getTime()) : current.uptimeMs,
      pollingStats: {
        activeJobs: polling.stats().activeJobs,
        tickCount: current.pollingStats.tickCount + 1,
        lastTickAt: new Date().toISOString(),
      },
    });
  });

  const start = async (): Promise<void> => {
    await state.setStarted(true);
    polling.start();
    await telegram.start();
    logger.info({ accounts: accountRegistry.listEnabled().length }, 'mafiamarkets app started');
  };

  const stop = async (): Promise<void> => {
    polling.stop();
    await telegram.stop();
    await state.patch({ started: false, marketWatcherRunning: false });
    logger.info('mafiamarkets app stopped');
  };

  registerShutdown(\[stop]);

  return { start, stop };
}
```

## `src/bootstrap.ts`

```ts
import { mkdir } from 'node:fs/promises';
import { env } from './config/env';
import { createApp } from './app';
import { logger } from './core/logger';

async function main(): Promise<void> {
  await mkdir(env.DATA\_DIR, { recursive: true });
  await mkdir(env.LOG\_DIR, { recursive: true });

  const app = await createApp();
  await app.start();
}

main().catch((error: unknown) => {
  logger.error({ error }, 'bootstrap failed');
  process.exit(1);
});
```

## `package.json`

```json
{
  "name": "mafiamarkets",
  "version": "1.0.0",
  "private": true,
  "description": "Indodax scalping/anomaly Telegram trading bot with modular TypeScript architecture",
  "main": "dist/bootstrap.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx watch src/bootstrap.ts",
    "start": "node dist/bootstrap.js",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "axios": "^1.8.4",
    "dotenv": "^16.4.7",
    "pino": "^9.6.0",
    "telegraf": "^4.16.3",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.13.10",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}
```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": false,
    "types": \["node"]
  },
  "include": \["src/\*\*/\*.ts"],
  "exclude": \["dist", "node\_modules"]
}
```

## `README.md`

```md
# mafiamarkets

masih perlu implementasi dan upgrade

