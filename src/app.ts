import { env } from './config/env';
import type { TradingMode } from './core/types';
import { AccountRegistry } from './domain/accounts/accountRegistry';
import { AccountStore } from './domain/accounts/accountStore';
import { SettingsService } from './domain/settings/settingsService';
import { createTelegramBot } from './integrations/telegram/bot';
import { HealthService } from './services/healthService';
import { JournalService } from './services/journalService';
import { PersistenceService } from './services/persistenceService';
import { ReportService } from './services/reportService';
import { StateService } from './services/stateService';

export interface AppContext {
  env: typeof env;
  persistenceService: PersistenceService;
  stateService: StateService;
  healthService: HealthService;
  journalService: JournalService;
  settingsService: SettingsService;
  reportService: ReportService;
  accountStore: AccountStore;
  accountRegistry: AccountRegistry;
}

export interface AppRuntime {
  context: AppContext;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isStarted: () => boolean;
}

export async function createApp(): Promise<AppRuntime> {
  const persistenceService = new PersistenceService();
  await persistenceService.ensureReady();

  const stateService = new StateService(persistenceService);
  const healthService = new HealthService(persistenceService);
  const journalService = new JournalService(persistenceService);
  const settingsService = new SettingsService(persistenceService);
  const reportService = new ReportService();
  const accountStore = new AccountStore();
  const accountRegistry = new AccountRegistry(accountStore);

  await accountRegistry.initialize();

  const currentSettings = await settingsService.getSettings();
  const initialMode = (currentSettings.tradingMode ?? env.defaultTradingMode) as TradingMode;

  await stateService.initialize?.();
  await healthService.markBooting?.({
    mode: initialMode,
    activeAccounts: accountRegistry.countEnabled(),
  });

  const context: AppContext = {
    env,
    persistenceService,
    stateService,
    healthService,
    journalService,
    settingsService,
    reportService,
    accountStore,
    accountRegistry,
  };

  const telegram = await createTelegramBot({
    env,
    accountRegistry,
    stateService,
    healthService,
    settingsService,
    reportService,
    journalService,
  });

  let started = false;

  return {
    context,
    isStarted: () => started,
    start: async () => {
      if (started) {
        return;
      }

      await accountRegistry.reload();

      await telegram.launch();

      await healthService.markStarted?.({
        mode: initialMode,
        activeAccounts: accountRegistry.countEnabled(),
      });

      await journalService.appendSystem?.('APP_STARTED', {
        mode: initialMode,
        activeAccounts: accountRegistry.countEnabled(),
      });

      started = true;
    },
    stop: async () => {
      if (!started) {
        return;
      }

      await telegram.stop('app shutdown');

      await healthService.markStopped?.();
      await journalService.appendSystem?.('APP_STOPPED', {});

      started = false;
    },
  };
}
