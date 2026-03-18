import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { AccountRegistry } from '../src/domain/accounts/accountRegistry';
import { AccountStore } from '../src/domain/accounts/accountStore';
import { SettingsService } from '../src/domain/settings/settingsService';
import { ExecutionEngine } from '../src/domain/trading/executionEngine';
import { OrderManager } from '../src/domain/trading/orderManager';
import { PositionManager } from '../src/domain/trading/positionManager';
import { RiskEngine } from '../src/domain/trading/riskEngine';
import { JournalService } from '../src/services/journalService';
import { PersistenceService, createDefaultSettings } from '../src/services/persistenceService';
import { ReportService } from '../src/services/reportService';
import { StateService } from '../src/services/stateService';
import { SummaryService } from '../src/services/summaryService';

class TrackingHistoryApi {
  public counters = {
    v2Orders: 0,
    v2Trades: 0,
    legacyOrders: 0,
    legacyTrades: 0,
  };

  constructor(
    private readonly config: {
      v2OrderHistory?: Record<string, unknown> | Error;
      v2TradeHistory?: Record<string, unknown> | Error;
      legacyOrderHistory?: Record<string, unknown> | Error;
      legacyTradeHistory?: Record<string, unknown> | Error;
    },
  ) {}

  async openOrders() {
    return {
      success: 1,
      return: { orders: {} },
    };
  }

  async getOrder() {
    throw new Error('getOrder unavailable for history mode probe');
  }

  async orderHistoriesV2() {
    this.counters.v2Orders += 1;
    if (this.config.v2OrderHistory instanceof Error) {
      throw this.config.v2OrderHistory;
    }
    return this.config.v2OrderHistory ?? { success: 1, return: { orders: [] } };
  }

  async myTradesV2() {
    this.counters.v2Trades += 1;
    if (this.config.v2TradeHistory instanceof Error) {
      throw this.config.v2TradeHistory;
    }
    return this.config.v2TradeHistory ?? { success: 1, return: { trades: [] } };
  }

  async orderHistory() {
    this.counters.legacyOrders += 1;
    if (this.config.legacyOrderHistory instanceof Error) {
      throw this.config.legacyOrderHistory;
    }
    return this.config.legacyOrderHistory ?? { success: 1, return: { orders: [] } };
  }

  async tradeHistory() {
    this.counters.legacyTrades += 1;
    if (this.config.legacyTradeHistory instanceof Error) {
      throw this.config.legacyTradeHistory;
    }
    return this.config.legacyTradeHistory ?? { success: 1, return: { trades: [] } };
  }
}

class FakeIndodaxClient {
  constructor(private readonly api: TrackingHistoryApi) {}

  forAccount() {
    return this.api;
  }
}

function buildV2OrderPayload(pair: string, orderId: string, quantity: number, price: number) {
  const [asset] = pair.split('_');
  return {
    success: 1,
    return: {
      orders: [
        {
          order_id: orderId,
          pair,
          status: 'filled',
          price,
          [`order_${asset}`]: quantity,
          remaining: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ],
    },
  };
}

function buildV2TradePayload(pair: string, orderId: string, quantity: number, price: number, fee = 5) {
  const [asset] = pair.split('_');
  return {
    success: 1,
    return: {
      trades: [
        {
          order_id: orderId,
          pair,
          price,
          [asset]: quantity,
          fee_idr: fee,
          timestamp: Date.now(),
        },
      ],
    },
  };
}

function buildLegacyOrderPayload(pair: string, orderId: string, quantity: number, price: number) {
  const [asset] = pair.split('_');
  return {
    success: 1,
    return: {
      orders: [
        {
          order_id: orderId,
          pair,
          status: 'filled',
          price,
          [`order_${asset}`]: quantity,
          [`remain_${asset}`]: 0,
          submit_time: Date.now(),
          finish_time: Date.now(),
        },
      ],
    },
  };
}

function buildLegacyTradePayload(pair: string, orderId: string, quantity: number, price: number, fee = 5) {
  const [asset] = pair.split('_');
  return {
    success: 1,
    return: {
      trades: [
        {
          order_id: orderId,
          price,
          [asset]: quantity,
          fee_idr: fee,
          timestamp: Date.now(),
        },
      ],
    },
  };
}

async function createHarness(tempDataDir: string, api: TrackingHistoryApi) {
  await fs.rm(tempDataDir, { recursive: true, force: true });
  await fs.mkdir(path.resolve(tempDataDir), { recursive: true });

  const persistence = new PersistenceService();
  await persistence.bootstrap();

  const state = new StateService(persistence);
  const settings = new SettingsService(persistence);
  const journal = new JournalService(persistence);
  const report = new ReportService();
  const orderManager = new OrderManager(persistence);
  const positionManager = new PositionManager(persistence);
  const accountStore = new AccountStore();
  const accountRegistry = new AccountRegistry(accountStore);
  const summary = new SummaryService(persistence, journal, report, accountRegistry);

  await Promise.all([
    state.load(),
    settings.load(),
    journal.load(),
    orderManager.load(),
    positionManager.load(),
  ]);

  await accountRegistry.saveLegacyUpload([{ name: 'TEST_MAIN', apiKey: 'k', apiSecret: 's' }]);
  const account = accountRegistry.getDefault();
  assert.ok(account, 'Default account should exist');

  await settings.replace({
    ...createDefaultSettings(),
    tradingMode: 'FULL_AUTO',
    dryRun: false,
    paperTrade: false,
    uiOnly: false,
  });

  const execution = new ExecutionEngine(
    accountRegistry,
    settings,
    state,
    new RiskEngine(),
    new FakeIndodaxClient(api) as never,
    positionManager,
    orderManager,
    journal,
    summary,
  );

  return {
    execution,
    orderManager,
    positionManager,
    persistence,
    account,
  };
}

async function seedActiveOrder(
  orderManager: OrderManager,
  accountId: string,
  pair: string,
  orderId: string,
  quantity: number,
  price: number,
) {
  return orderManager.create({
    accountId,
    pair,
    side: 'buy',
    type: 'limit',
    price,
    quantity,
    source: 'AUTO',
    status: 'OPEN',
    exchangeOrderId: orderId,
    exchangeStatus: 'submitted',
    exchangeUpdatedAt: new Date().toISOString(),
    referencePrice: price,
    notes: 'history probe',
  });
}

async function main() {
  const baseTempDir = process.env.DATA_DIR;
  assert.ok(baseTempDir, 'DATA_DIR must be provided for isolated test run');
  const previousMode = process.env.INDODAX_HISTORY_MODE;

  try {
    process.env.INDODAX_HISTORY_MODE = 'v2_prefer';
    {
      const api = new TrackingHistoryApi({
        v2OrderHistory: buildV2OrderPayload('xlm_idr', 'V2-ORDER-1', 200, 101),
        v2TradeHistory: buildV2TradePayload('xlm_idr', 'V2-ORDER-1', 200, 101, 5),
      });
      const harness = await createHarness(path.resolve(baseTempDir, 'v2-prefer-success'), api);
      await seedActiveOrder(harness.orderManager, harness.account!.id, 'xlm_idr', 'V2-ORDER-1', 200, 100);

      await harness.execution.recoverLiveOrdersOnStartup();

      const order = harness.orderManager.list()[0];
      const position = harness.positionManager.listOpen()[0];
      assert.equal(order?.status, 'FILLED', 'v2_prefer should reconcile order via v2 payload');
      assert.equal(order?.feeAmount, 5, 'v2_prefer should keep fee accounting via myTrades v2');
      assert.equal(position?.quantity, 200, 'v2_prefer should materialize filled quantity into position state');
      assert.equal(api.counters.v2Orders > 0, true, 'v2 order history should be called in v2_prefer mode');
      assert.equal(api.counters.v2Trades > 0, true, 'v2 myTrades should be called in v2_prefer mode');
      assert.equal(api.counters.legacyOrders, 0, 'legacy orderHistory should not be used when v2 succeeds');
      assert.equal(api.counters.legacyTrades, 0, 'legacy tradeHistory should not be used when v2 succeeds');
    }

    process.env.INDODAX_HISTORY_MODE = 'v2_prefer';
    {
      const api = new TrackingHistoryApi({
        v2OrderHistory: new Error('v2 order history unavailable'),
        v2TradeHistory: new Error('v2 myTrades unavailable'),
        legacyOrderHistory: buildLegacyOrderPayload('ada_idr', 'LEGACY-FALLBACK-1', 50, 10000),
        legacyTradeHistory: buildLegacyTradePayload('ada_idr', 'LEGACY-FALLBACK-1', 50, 10000, 8),
      });
      const harness = await createHarness(path.resolve(baseTempDir, 'v2-prefer-fallback'), api);
      await seedActiveOrder(harness.orderManager, harness.account!.id, 'ada_idr', 'LEGACY-FALLBACK-1', 50, 10000);

      await harness.execution.recoverLiveOrdersOnStartup();

      const order = harness.orderManager.list()[0];
      assert.equal(order?.status, 'FILLED', 'v2_prefer should fallback to legacy history when v2 fails');
      assert.equal(order?.feeAmount, 8, 'legacy fallback should preserve fee accounting');
      assert.equal(api.counters.v2Orders > 0, true, 'v2 path should be attempted before fallback');
      assert.equal(api.counters.v2Trades > 0, true, 'v2 myTrades should be attempted before fallback');
      assert.equal(api.counters.legacyOrders > 0, true, 'legacy orderHistory should be used as fallback');
      assert.equal(api.counters.legacyTrades > 0, true, 'legacy tradeHistory should be used as fallback');
    }

    process.env.INDODAX_HISTORY_MODE = 'legacy';
    {
      const api = new TrackingHistoryApi({
        v2OrderHistory: buildV2OrderPayload('doge_idr', 'LEGACY-ONLY-1', 100, 1000),
        v2TradeHistory: buildV2TradePayload('doge_idr', 'LEGACY-ONLY-1', 100, 1000, 3),
        legacyOrderHistory: buildLegacyOrderPayload('doge_idr', 'LEGACY-ONLY-1', 100, 1000),
        legacyTradeHistory: buildLegacyTradePayload('doge_idr', 'LEGACY-ONLY-1', 100, 1000, 3),
      });
      const harness = await createHarness(path.resolve(baseTempDir, 'legacy-only'), api);
      await seedActiveOrder(harness.orderManager, harness.account!.id, 'doge_idr', 'LEGACY-ONLY-1', 100, 1000);

      await harness.execution.recoverLiveOrdersOnStartup();

      const order = harness.orderManager.list()[0];
      assert.equal(order?.status, 'FILLED', 'legacy mode should still reconcile live history');
      assert.equal(api.counters.v2Orders, 0, 'legacy mode must not call v2 order histories');
      assert.equal(api.counters.v2Trades, 0, 'legacy mode must not call v2 myTrades');
      assert.equal(api.counters.legacyOrders > 0, true, 'legacy mode must use legacy orderHistory');
      assert.equal(api.counters.legacyTrades > 0, true, 'legacy mode must use legacy tradeHistory');
    }

    process.env.INDODAX_HISTORY_MODE = 'v2_only';
    {
      const api = new TrackingHistoryApi({
        v2OrderHistory: new Error('v2 unavailable'),
        v2TradeHistory: new Error('v2 unavailable'),
        legacyOrderHistory: buildLegacyOrderPayload('btc_idr', 'V2-ONLY-1', 1, 1000000000),
        legacyTradeHistory: buildLegacyTradePayload('btc_idr', 'V2-ONLY-1', 1, 1000000000, 12),
      });
      const harness = await createHarness(path.resolve(baseTempDir, 'v2-only'), api);
      await seedActiveOrder(harness.orderManager, harness.account!.id, 'btc_idr', 'V2-ONLY-1', 1, 1000000000);

      const messages = await harness.execution.recoverLiveOrdersOnStartup();
      const order = harness.orderManager.list()[0];

      assert.equal(messages.length, 0, 'v2_only should not silently fallback to legacy when v2 fails');
      assert.equal(order?.status, 'OPEN', 'v2_only should leave order unresolved if v2 data is unavailable');
      assert.equal(api.counters.legacyOrders, 0, 'v2_only must not call legacy orderHistory');
      assert.equal(api.counters.legacyTrades, 0, 'v2_only must not call legacy tradeHistory');
      assert.equal(api.counters.v2Orders > 0, true, 'v2_only should still attempt v2 order history');
      assert.equal(api.counters.v2Trades > 0, true, 'v2_only should still attempt v2 myTrades');
    }

    console.log('PASS indodax_history_v2_probe');
  } finally {
    if (previousMode === undefined) {
      delete process.env.INDODAX_HISTORY_MODE;
    } else {
      process.env.INDODAX_HISTORY_MODE = previousMode;
    }
  }
}

main().catch((error) => {
  console.error('FAIL indodax_history_v2_probe');
  console.error(error);
  process.exit(1);
});