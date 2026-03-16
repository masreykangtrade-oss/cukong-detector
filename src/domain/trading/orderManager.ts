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
