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
