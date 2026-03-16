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
