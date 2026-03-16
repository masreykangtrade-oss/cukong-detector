import { logger } from './core/logger';
import { LightScheduler } from './core/scheduler';
import { registerShutdown } from './core/shutdown';
import { env } from './config/env';
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

export async function createApp(): Promise<{
  start: () => Promise<void>;
  stop: () => Promise<void>;
}> {
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

  await Promise.all([
    state.load(),
    settings.load(),
    journal.load(),
    orderManager.load(),
    positionManager.load(),
    accountRegistry.reload(),
  ]);

  const report = new ReportService();
  const health = new HealthService(persistence, state);
  await health.load();

  const universe = new PairUniverse();
  const indodax = new IndodaxClient();
  const watcher = new MarketWatcher(indodax, universe);
  const signals = new SignalEngine(universe);
  const hotlist = new HotlistService();
  const risk = new RiskEngine();

  const execution = new ExecutionEngine(
    accountRegistry,
    settings,
    state,
    risk,
    indodax,
    positionManager,
    orderManager,
    journal,
  );

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

  polling.register('market-watch', env.pollingIntervalMs, async () => {
    const runtime = state.get();

    if (runtime.status !== 'RUNNING' || runtime.emergencyStop) {
      return;
    }

    const bundles = await watcher.batchSnapshot(4);

    for (const bundle of bundles) {
      await positionManager.updateMark(bundle.pair, bundle.ticker.lastPrice);
      await state.markPairSeen(bundle.pair);
    }

    const scored = signals.scoreMany(bundles);
    const hotlistItems = hotlist.update(scored);

    await persistence.saveHotlist(hotlistItems);
    await persistence.savePairMetrics(universe.exportMetrics(watcher.exportHistory()));
    await state.setSignals(scored);
    await state.setHotlist(hotlistItems);

    if (hotlistItems[0]) {
      await state.markSignal(hotlistItems[0].pair);
    }

    const currentSettings = settings.get();
    const top = hotlistItems[0];

    if (
      top &&
      currentSettings.tradingMode === 'FULL_AUTO' &&
      top.score >= currentSettings.strategy.scoreAutoEntryThreshold
    ) {
      try {
        const result = await execution.attemptAutoBuy(top);
        logger.info({ pair: top.pair, result }, 'auto-buy evaluated');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'auto-buy error';
        await state.setStatus('ERROR');
        await journal.error('AUTO_BUY_FAILED', message, {
          pair: top.pair,
        });
      }
    }
  });

  polling.register('position-exit-check', 5_000, async () => {
    const runtime = state.get();

    if (runtime.status !== 'RUNNING' || runtime.emergencyStop) {
      return;
    }

    const exits = await execution.evaluateOpenPositions();

    if (exits.length > 0) {
      logger.info({ exits }, 'position exits executed');
    }
  });

  polling.register('heartbeat', 5_000, async () => {
    const runtime = state.get();

    await state.patch({
      uptimeMs: runtime.startedAt
        ? Math.max(0, Date.now() - new Date(runtime.startedAt).getTime())
        : runtime.uptimeMs,
      pollingStats: {
        activeJobs: polling.stats().activeJobs,
        tickCount: runtime.pollingStats.tickCount + 1,
        lastTickAt: new Date().toISOString(),
      },
    });

    await health.build({
      scannerRunning: runtime.status === 'RUNNING',
      telegramRunning: true,
      tradingEnabled: settings.get().tradingMode !== 'OFF' && !runtime.emergencyStop,
      positions: positionManager.list(),
      orders: orderManager.list(),
      notes: [
        `mode=${settings.get().tradingMode}`,
        `accountsEnabled=${accountRegistry.listEnabled().length}`,
      ],
    });
  });

  const start = async (): Promise<void> => {
    await state.setStatus('STARTING');
    await state.setTradingMode(settings.get().tradingMode);

    polling.start();
    await telegram.start();

    await state.setStatus('RUNNING');

    await health.build({
      scannerRunning: true,
      telegramRunning: true,
      tradingEnabled: settings.get().tradingMode !== 'OFF',
      positions: positionManager.list(),
      orders: orderManager.list(),
      notes: [`startupMode=${settings.get().tradingMode}`],
    });

    await journal.info('APP_STARTED', 'mafiamarkets app started', {
      accounts: accountRegistry.listEnabled().length,
      mode: settings.get().tradingMode,
    });

    logger.info(
      {
        accounts: accountRegistry.listEnabled().length,
        mode: settings.get().tradingMode,
      },
      'mafiamarkets app started',
    );
  };

  const stop = async (): Promise<void> => {
    await state.setStatus('STOPPING');

    polling.stop();
    await telegram.stop();

    await state.setStatus('STOPPED');

    await health.build({
      scannerRunning: false,
      telegramRunning: false,
      tradingEnabled: false,
      positions: positionManager.list(),
      orders: orderManager.list(),
      notes: ['shutdown'],
    });

    await journal.info('APP_STOPPED', 'mafiamarkets app stopped');

    logger.info('mafiamarkets app stopped');
  };

  registerShutdown([stop]);

  return { start, stop };
}
