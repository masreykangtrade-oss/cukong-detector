import { logger } from '../../core/logger';

export interface IndodaxTickerEntry {
  high: number;
  low: number;
  vol_btc: number;
  vol_idr: number;
  last: number;
  buy: number;
  sell: number;
  server_time: number;
  name: string;
}

export interface IndodaxOrderbook {
  buy: Array<[number, number]>;
  sell: Array<[number, number]>;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapTickerEntry(name: string, raw: Record<string, unknown>): IndodaxTickerEntry {
  return {
    name,
    high: toNumber(raw.high),
    low: toNumber(raw.low),
    vol_btc: toNumber(raw.vol_btc),
    vol_idr: toNumber(raw.vol_idr),
    last: toNumber(raw.last),
    buy: toNumber(raw.buy),
    sell: toNumber(raw.sell),
    server_time: toNumber(raw.server_time),
  };
}

export class PublicApi {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 15_000,
  ) {}

  private async requestJson<T>(url: string, label: string): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new Error(`Public API ${label} request failed`, {
        cause: error instanceof Error ? error : new Error(String(error)),
      });
    }

    if (!response.ok) {
      throw new Error(`Public API ${label} failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  async getTickers(): Promise<Record<string, IndodaxTickerEntry>> {
    const json = await this.requestJson<{
      tickers?: Record<string, Record<string, unknown>>;
    }>(`${this.baseUrl}/tickers`, 'tickers');

    const entries = json.tickers ?? {};
    const result: Record<string, IndodaxTickerEntry> = {};

    for (const [pair, value] of Object.entries(entries)) {
      result[pair] = mapTickerEntry(pair, value);
    }

    return result;
  }

  async getDepth(pair: string): Promise<IndodaxOrderbook> {
    const json = await this.requestJson<{
      buy?: Array<[string | number, string | number]>;
      sell?: Array<[string | number, string | number]>;
    }>(`${this.baseUrl}/${pair}/depth`, `depth:${pair}`);

    return {
      buy: (json.buy ?? []).map(([price, amount]) => [toNumber(price), toNumber(amount)]),
      sell: (json.sell ?? []).map(([price, amount]) => [toNumber(price), toNumber(amount)]),
    };
  }

  async safeGetDepth(pair: string): Promise<IndodaxOrderbook> {
    try {
      return await this.getDepth(pair);
    } catch (error) {
      logger.warn({ pair, error }, 'failed to fetch orderbook depth');
      return { buy: [], sell: [] };
    }
  }
}
