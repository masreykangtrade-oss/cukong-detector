import { logger } from '../../core/logger';
import type { IndodaxClient } from '../../integrations/indodax/client';
import type { IndodaxOrderbook } from '../../integrations/indodax/publicApi';
import type { PairUniverse } from './pairUniverse';

export interface MarketSnapshot {
  pair: string;
  ticker: {
    lastPrice: number;
    bestBid: number;
    bestAsk: number;
    spreadPct: number;
    liquidityScore: number;
    change1m: number;
    change5m: number;
    volumeIdr: number;
    volumeBtc: number;
  };
  orderbook: {
    bids: Array<[number, number]>;
    asks: Array<[number, number]>;
    bestBidSize: number;
    bestAskSize: number;
    bidDepthTop5: number;
    askDepthTop5: number;
    imbalanceTop5: number;
  };
  observedAt: string;
}

function sumTopN(side: Array<[number, number]>, n = 5): number {
  return side.slice(0, n).reduce((sum, [, size]) => sum + size, 0);
}

function calcImbalance(book: IndodaxOrderbook): number {
  const bid = sumTopN(book.buy, 5);
  const ask = sumTopN(book.sell, 5);
  const total = bid + ask;
  if (total <= 0) {
    return 0;
  }
  return (bid - ask) / total;
}

export class MarketWatcher {
  private history = new Map<
    string,
    Array<{
      price: number;
      at: string;
    }>
  >();

  constructor(
    private readonly indodax: IndodaxClient,
    private readonly universe: PairUniverse,
  ) {}

  private updateHistory(pair: string, price: number, at: string): void {
    const current = this.history.get(pair) ?? [];
    current.push({ price, at });

    while (current.length > 300) {
      current.shift();
    }

    this.history.set(pair, current);
  }

  private percentChange(current: number, previous?: number): number {
    if (!previous || previous <= 0) {
      return 0;
    }

    return ((current - previous) / previous) * 100;
  }

  private computeLiquidityScore(bestBid: number, bestAsk: number, book: IndodaxOrderbook): number {
    const spread = bestAsk > 0 ? ((bestAsk - bestBid) / bestAsk) * 100 : 0;
    const depth = sumTopN(book.buy, 5) + sumTopN(book.sell, 5);

    const spreadScore = Math.max(0, 100 - spread * 100);
    const depthScore = Math.min(100, depth);

    return (spreadScore * 0.6) + (depthScore * 0.4);
  }

  async batchSnapshot(limit = 10): Promise<MarketSnapshot[]> {
    const tickers = await this.indodax.getTickers();
    const metrics = this.universe.updateFromTickers(tickers);
    const targets = metrics
      .sort((a, b) => b.volumeIdr - a.volumeIdr)
      .slice(0, limit);

    const snapshots: MarketSnapshot[] = [];

    for (const item of targets) {
      try {
        const orderbook = await this.indodax.getDepth(item.pair);
        const now = new Date().toISOString();

        this.updateHistory(item.pair, item.lastPrice, now);

        const pairHistory = this.history.get(item.pair) ?? [];
        const prev1m = pairHistory[Math.max(0, pairHistory.length - 12)]?.price;
        const prev5m = pairHistory[Math.max(0, pairHistory.length - 60)]?.price;

        snapshots.push({
          pair: item.pair,
          ticker: {
            lastPrice: item.lastPrice,
            bestBid: item.bestBid,
            bestAsk: item.bestAsk,
            spreadPct: item.bestAsk > 0 ? ((item.bestAsk - item.bestBid) / item.bestAsk) * 100 : 0,
            liquidityScore: this.computeLiquidityScore(item.bestBid, item.bestAsk, orderbook),
            change1m: this.percentChange(item.lastPrice, prev1m),
            change5m: this.percentChange(item.lastPrice, prev5m),
            volumeIdr: item.volumeIdr,
            volumeBtc: item.volumeBtc,
          },
          orderbook: {
            bids: orderbook.buy,
            asks: orderbook.sell,
            bestBidSize: orderbook.buy[0]?.[1] ?? 0,
            bestAskSize: orderbook.sell[0]?.[1] ?? 0,
            bidDepthTop5: sumTopN(orderbook.buy, 5),
            askDepthTop5: sumTopN(orderbook.sell, 5),
            imbalanceTop5: calcImbalance(orderbook),
          },
          observedAt: now,
        });
      } catch (error) {
        logger.warn({ pair: item.pair, error }, 'failed to build market snapshot');
      }
    }

    return snapshots;
  }

  exportHistory(): Record<string, Array<{ price: number; at: string }>> {
    return Object.fromEntries(this.history.entries());
  }
}
