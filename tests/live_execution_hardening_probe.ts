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
import type { OpportunityAssessment, SignalCandidate } from '../src/core/types';
import { JournalService } from '../src/services/journalService';
import { PersistenceService, createDefaultSettings } from '../src/services/persistenceService';
import { StateService } from '../src/services/stateService';

class FakeLiveOrderApi {
  private readonly tradeQueue: Array<Record<string, unknown>> = [];
  private readonly orderQueue = new Map<string, Array<Record<string, unknown>>>();
  private readonly openOrdersQueue: Array<Record<string, unknown>> = [];

  queueTrade(response: Record<string, unknown>) {
    this.tradeQueue.push(response);
  }

  queueOpenOrders(response: Record<string, unknown>) {
    this.openOrdersQueue.push(response);
  }

  queueOrder(orderId: string, ...responses: Array<Record<string, unknown>>) {
    this.orderQueue.set(orderId, responses);
  }

  async trade() {
    const next = this.tradeQueue.shift();
    if (!next) {
      throw new Error('No queued live trade response');
    }
    return next;
  }

  async getOrder(_pair: string, orderId: string) {
    const queue = this.orderQueue.get(orderId);
    if (!queue || queue.length === 0) {
      throw new Error(`No queued getOrder response for ${orderId}`);
    }

    if (queue.length === 1) {
      return queue[0];
    }

    return queue.shift() as Record<string, unknown>;
  }

  async openOrders() {
    const next = this.openOrdersQueue.shift();
    if (!next) {
      return {
        success: 1,
        return: {
          orders: {},
        },
      };
    }

    return next;
  }

  async cancelOrder(_pair: string, orderId: string) {
    return {
      success: 1,
      return: {
        order_id: orderId,
        status: 'canceled',
      },
    };
  }
}

class FakeLiveIndodaxClient {
  constructor(private readonly api: FakeLiveOrderApi) {}

  forAccount() {
    return this.api;
  }
}

function makeOpportunity(pair: string, ask: number): OpportunityAssessment {
  const now = Date.now();
  const signalLike: SignalCandidate = {
    pair,
    score: 90,
    confidence: 0.9,
    reasons: ['test'],
    warnings: [],
    regime: 'BREAKOUT_SETUP',
    breakoutPressure: 90,
    volumeAcceleration: 80,
    orderbookImbalance: 0.2,
    spreadPct: 0.3,
    marketPrice: ask,
    bestBid: ask * 0.999,
    bestAsk: ask,
    liquidityScore: 90,
    change1m: 1,
    change5m: 2,
    contributions: [],
    timestamp: now,
  };

  return {
    pair,
    rawScore: signalLike.score,
    finalScore: 90,
    confidence: signalLike.confidence,
    pumpProbability: 0.9,
    continuationProbability: 0.8,
    trapProbability: 0.1,
    spoofRisk: 0.2,
    edgeValid: true,
    marketRegime: signalLike.regime,
    breakoutPressure: signalLike.breakoutPressure,
    volumeAcceleration: signalLike.volumeAcceleration,
    orderbookImbalance: signalLike.orderbookImbalance,
    change1m: signalLike.change1m,
    change5m: signalLike.change5m,
    entryTiming: {
      state: 'READY',
      quality: 90,
      reason: 'ready',
      leadScore: 88,
    },
    reasons: ['ok'],
    warnings: [],
    featureBreakdown: [],
    historicalContext: {
      pair,
      snapshotCount: 10,
      anomalyCount: 0,
      recentWinRate: 0.7,
      recentFalseBreakRate: 0.1,
      regime: 'BREAKOUT_SETUP',
      patternMatches: [],
      contextNotes: [],
      timestamp: now,
    },
    recommendedAction: 'ENTER',
    riskContext: ['ok'],
    historicalMatchSummary: 'ok',
    referencePrice: ask,
    bestBid: ask * 0.999,
    bestAsk: ask,
    spreadPct: 0.3,
    liquidityScore: 90,
    timestamp: now,
  };
}

async function main() {
  const tempDataDir = process.env.DATA_DIR;
  assert.ok(tempDataDir, 'DATA_DIR must be provided for isolated test run');

  await fs.rm(tempDataDir, { recursive: true, force: true });
  await fs.mkdir(path.resolve(tempDataDir), { recursive: true });

  const persistence = new PersistenceService();
  await persistence.bootstrap();

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
  ]);

  await accountRegistry.saveLegacyUpload([{ name: 'TEST_MAIN', apiKey: 'k', apiSecret: 's' }]);
  const defaultAccount = accountRegistry.getDefault();
  assert.ok(defaultAccount, 'Default account should exist');

  const liveApi = new FakeLiveOrderApi();
  const execution = new ExecutionEngine(
    accountRegistry,
    settings,
    state,
    new RiskEngine(),
    new FakeLiveIndodaxClient(liveApi) as never,
    positionManager,
    orderManager,
    journal,
  );

  const strictSettings = {
    ...createDefaultSettings(),
    tradingMode: 'FULL_AUTO' as const,
    dryRun: false,
    paperTrade: false,
    uiOnly: false,
    risk: {
      ...createDefaultSettings().risk,
      maxOpenPositions: 10,
    },
  };
  await settings.replace(strictSettings);

  // Startup recovery should sync persisted live order via openOrders.
  const recoveredOrder = await orderManager.create({
    accountId: defaultAccount.id,
    pair: 'matic_idr',
    side: 'buy',
    type: 'limit',
    price: 2500,
    quantity: 40,
    source: 'AUTO',
    status: 'OPEN',
    exchangeOrderId: 'RECOVER-OPEN-1',
    exchangeStatus: 'submitted',
    exchangeUpdatedAt: new Date().toISOString(),
    notes: 'persisted before restart',
  });

  liveApi.queueOpenOrders({
    success: 1,
    return: {
      orders: {
        matic_idr: [
          {
            order_id: 'RECOVER-OPEN-1',
            type: 'buy',
            price: '2500',
            order_matic: '40',
            remain_matic: '15',
            status: 'open',
          },
        ],
      },
    },
  });

  const recoveryMessages = await execution.recoverLiveOrdersOnStartup();
  assert.ok(
    recoveryMessages.some((message) => message.includes('RECOVER-OPEN-1')),
    'recoverLiveOrdersOnStartup should report synced persisted live order',
  );

  const recoveredAfterStartup = orderManager.getById(recoveredOrder.id);
  assert.equal(
    recoveredAfterStartup?.status,
    'PARTIALLY_FILLED',
    'Startup recovery should derive partial fill state from openOrders',
  );
  assert.equal(
    recoveredAfterStartup?.filledQuantity,
    25,
    'Startup recovery should derive filled quantity from openOrders remain amount',
  );

  const recoveredPositionQty = positionManager
    .listOpen()
    .filter((position) => position.pair === 'matic_idr')
    .reduce((sum, position) => sum + position.quantity, 0);
  assert.equal(
    recoveredPositionQty,
    25,
    'Startup recovery should materialize recovered filled quantity into runtime positions',
  );

  // Live buy partial->filled sync should persist exchange order id and apply fill deltas.
  const partialOpportunity = makeOpportunity('doge_idr', 1000);
  const orderQuantity = 100_000 / partialOpportunity.bestAsk;
  const firstFilled = orderQuantity * 0.4;

  liveApi.queueTrade({ success: 1, return: { order_id: 'BUY-PARTIAL-1' } });
  liveApi.queueOpenOrders({
    success: 1,
    return: {
      orders: {
        matic_idr: [
          {
            order_id: 'RECOVER-OPEN-1',
            type: 'buy',
            price: '2500',
            order_matic: '40',
            remain_matic: '15',
            status: 'open',
          },
        ],
        doge_idr: [
          {
            order_id: 'BUY-PARTIAL-1',
            type: 'buy',
            price: String(partialOpportunity.bestAsk),
            order_doge: String(orderQuantity),
            remain_doge: String(orderQuantity - firstFilled),
            status: 'open',
          },
        ],
      },
    },
  });
  liveApi.queueOrder(
    'BUY-PARTIAL-1',
    {
      success: 1,
      return: {
        order: {
          order_id: 'BUY-PARTIAL-1',
          price: String(partialOpportunity.bestAsk),
          status: 'open',
          order_doge: String(orderQuantity),
          remain_doge: String(orderQuantity - firstFilled),
        },
      },
    },
    {
      success: 1,
      return: {
        order: {
          order_id: 'BUY-PARTIAL-1',
          price: String(partialOpportunity.bestAsk),
          status: 'filled',
          order_doge: String(orderQuantity),
          remain_doge: '0',
        },
      },
    },
  );

  const partialMessage = await execution.buy(defaultAccount.id, partialOpportunity, 100_000, 'AUTO');
  assert.ok(partialMessage.includes('status=PARTIALLY_FILLED') || partialMessage.includes('status=OPEN'));

  const partialOrder = orderManager.list().find((o) => o.exchangeOrderId === 'BUY-PARTIAL-1');
  assert.ok(partialOrder, 'Live buy should persist exchange order id');
  assert.ok((partialOrder?.filledQuantity ?? 0) > 0, 'Initial live sync should capture partial fill quantity');

  const beforeSyncTotal = positionManager
    .listOpen()
    .filter((p) => p.pair === 'doge_idr')
    .reduce((sum, p) => sum + p.quantity, 0);

  await execution.syncActiveOrders();

  const afterOpenOrdersSync = orderManager.list().find((o) => o.exchangeOrderId === 'BUY-PARTIAL-1');
  assert.equal(
    afterOpenOrdersSync?.status,
    'PARTIALLY_FILLED',
    'openOrders sync should preserve partial state while order is still open',
  );

  liveApi.queueOpenOrders({
    success: 1,
    return: {
      orders: {},
    },
  });

  liveApi.queueOrder('RECOVER-OPEN-1', {
    success: 1,
    return: {
      order: {
        order_id: 'RECOVER-OPEN-1',
        price: '2500',
        status: 'open',
        order_matic: '40',
        remain_matic: '15',
      },
    },
  });

  await execution.syncActiveOrders();

  const afterSyncOrder = orderManager.list().find((o) => o.exchangeOrderId === 'BUY-PARTIAL-1');
  assert.equal(afterSyncOrder?.status, 'FILLED', 'syncActiveOrders should move order to FILLED after exchange fill');

  const afterSyncTotal = positionManager
    .listOpen()
    .filter((p) => p.pair === 'doge_idr')
    .reduce((sum, p) => sum + p.quantity, 0);
  assert.ok(afterSyncTotal > beforeSyncTotal, 'syncActiveOrders should apply additional fill delta to positions');

  // Duplicate active buy guard should block same pair/account live submission.
  const dupBuyOpportunity = makeOpportunity('trx_idr', 5000);
  const dupBuyQty = 100_000 / dupBuyOpportunity.bestAsk;
  liveApi.queueTrade({ success: 1, return: { order_id: 'BUY-DUP-1' } });
  liveApi.queueOpenOrders({
    success: 1,
    return: {
      orders: {
        trx_idr: [
          {
            order_id: 'BUY-DUP-1',
            type: 'buy',
            price: String(dupBuyOpportunity.bestAsk),
            order_trx: String(dupBuyQty),
            remain_trx: String(dupBuyQty),
            status: 'open',
          },
        ],
      },
    },
  });
  liveApi.queueOrder('BUY-DUP-1', {
    success: 1,
    return: {
      order: {
        order_id: 'BUY-DUP-1',
        price: String(dupBuyOpportunity.bestAsk),
        status: 'open',
        order_trx: String(dupBuyQty),
        remain_trx: String(dupBuyQty),
      },
    },
  });
  await execution.buy(defaultAccount.id, dupBuyOpportunity, 100_000, 'AUTO');

  await assert.rejects(
    () => execution.buy(defaultAccount.id, dupBuyOpportunity, 100_000, 'AUTO'),
    /Masih ada order BUY aktif/,
    'Duplicate active BUY should be rejected before sending live order',
  );

  // Duplicate active sell guard should block same position while prior sell still open.
  const seededPosition = await positionManager.open({
    accountId: defaultAccount.id,
    pair: 'ada_idr',
    quantity: 50,
    entryPrice: 10_000,
    stopLossPrice: null,
    takeProfitPrice: null,
  });
  liveApi.queueTrade({ success: 1, return: { order_id: 'SELL-DUP-1' } });
  liveApi.queueOpenOrders({
    success: 1,
    return: {
      orders: {
        ada_idr: [
          {
            order_id: 'SELL-DUP-1',
            type: 'sell',
            price: '10000',
            order_ada: '20',
            remain_ada: '20',
            status: 'open',
          },
        ],
      },
    },
  });
  liveApi.queueOrder('SELL-DUP-1', {
    success: 1,
    return: {
      order: {
        order_id: 'SELL-DUP-1',
        price: '10000',
        status: 'open',
        order_ada: '20',
        remain_ada: '20',
      },
    },
  });
  await execution.manualSell(seededPosition.id, 20, 'AUTO');

  await assert.rejects(
    () => execution.manualSell(seededPosition.id, 5, 'AUTO'),
    /Masih ada order SELL aktif/,
    'Duplicate active SELL should be rejected before sending live order',
  );

  // cancelAllOrders should cancel all active live orders locally.
  const cancelSummary = await execution.cancelAllOrders();
  assert.ok(cancelSummary.includes('Canceled'), 'cancelAllOrders should return summary');

  const canceledBuy = orderManager.list().find((o) => o.exchangeOrderId === 'BUY-DUP-1');
  const canceledSell = orderManager.list().find((o) => o.exchangeOrderId === 'SELL-DUP-1');
  assert.equal(canceledBuy?.status, 'CANCELED', 'Active buy should be marked CANCELED after cancelAllOrders');
  assert.equal(canceledSell?.status, 'CANCELED', 'Active sell should be marked CANCELED after cancelAllOrders');

  console.log('PASS live_execution_hardening_probe');
}

main().catch((error) => {
  console.error('FAIL live_execution_hardening_probe');
  console.error(error);
  process.exit(1);
});
