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
