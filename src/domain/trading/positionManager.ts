import { randomUUID } from 'node:crypto';
import type { PositionRecord } from '../../core/types';
import { PersistenceService } from '../../services/persistenceService';
import { nowIso } from '../../utils/time';

export interface OpenPositionInput {
  accountId: string;
  pair: string;
  quantity: number;
  entryPrice: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  sourceOrderId?: string;
}

export class PositionManager {
  private positions: PositionRecord[] = [];

  constructor(private readonly persistence: PersistenceService) {}

  async load(): Promise<PositionRecord[]> {
    const snapshot = await this.persistence.loadAll();
    this.positions = Array.isArray(snapshot.positions) ? snapshot.positions : [];
    return this.positions;
  }

  list(): PositionRecord[] {
    return [...this.positions];
  }

  listOpen(): PositionRecord[] {
    return this.positions.filter((item) => item.status !== 'CLOSED');
  }

  getById(positionId: string): PositionRecord | undefined {
    return this.positions.find((item) => item.id === positionId);
  }

  getOpenByPair(pair: string): PositionRecord[] {
    return this.positions.filter((item) => item.pair === pair && item.status !== 'CLOSED');
  }

  async open(input: OpenPositionInput): Promise<PositionRecord> {
    const now = nowIso();

    const position: PositionRecord = {
      id: randomUUID(),
      pair: input.pair,
      accountId: input.accountId,
      status: 'OPEN',
      side: 'long',
      quantity: input.quantity,
      entryPrice: input.entryPrice,
      averageEntryPrice: input.entryPrice,
      currentPrice: input.entryPrice,
      peakPrice: input.entryPrice,
      unrealizedPnl: 0,
      realizedPnl: 0,
      stopLossPrice: input.stopLossPrice,
      takeProfitPrice: input.takeProfitPrice,
      openedAt: now,
      updatedAt: now,
      closedAt: null,
      sourceOrderId: input.sourceOrderId,
    };

    this.positions = [position, ...this.positions];
    await this.persistence.savePositions(this.positions);
    return position;
  }

  async updateMark(pair: string, markPrice: number): Promise<void> {
    this.positions = this.positions.map((item) => {
      if (item.status === 'CLOSED' || item.pair !== pair) {
        return item;
      }

      return {
        ...item,
        currentPrice: markPrice,
        peakPrice: Math.max(item.peakPrice ?? item.currentPrice, markPrice),
        unrealizedPnl: (markPrice - item.averageEntryPrice) * item.quantity,
        updatedAt: nowIso(),
      };
    });

    await this.persistence.savePositions(this.positions);
  }

  async closePartial(
    positionId: string,
    closeQuantity: number,
    exitPrice: number,
  ): Promise<PositionRecord | undefined> {
    const current = this.getById(positionId);
    if (!current || current.status === 'CLOSED') {
      return undefined;
    }

    const safeCloseQuantity = Math.max(0, Math.min(current.quantity, closeQuantity));
    const remainingQuantity = Math.max(0, current.quantity - safeCloseQuantity);
    const realizedPnl =
      current.realizedPnl + (exitPrice - current.averageEntryPrice) * safeCloseQuantity;

    const next: PositionRecord = {
      ...current,
      quantity: remainingQuantity,
      currentPrice: exitPrice,
      peakPrice: Math.max(current.peakPrice ?? current.currentPrice, exitPrice),
      realizedPnl,
      unrealizedPnl: (exitPrice - current.averageEntryPrice) * remainingQuantity,
      status:
        remainingQuantity <= 1e-8
          ? 'CLOSED'
          : safeCloseQuantity > 0
            ? 'PARTIALLY_CLOSED'
            : current.status,
      updatedAt: nowIso(),
      closedAt: remainingQuantity <= 1e-8 ? nowIso() : current.closedAt,
    };

    this.positions = this.positions.map((item) => (item.id === positionId ? next : item));
    await this.persistence.savePositions(this.positions);
    return next;
  }

  async forceClose(positionId: string, exitPrice: number): Promise<PositionRecord | undefined> {
    const current = this.getById(positionId);
    if (!current || current.status === 'CLOSED') {
      return undefined;
    }

    return this.closePartial(positionId, current.quantity, exitPrice);
  }
}
