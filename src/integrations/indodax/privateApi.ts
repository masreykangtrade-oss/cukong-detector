import crypto from 'node:crypto';

export interface IndodaxPrivateApiOptions {
  baseUrl: string;
  tradeApiV2BaseUrl?: string;
  apiKey: string;
  apiSecret: string;
}

export interface IndodaxPrivateEnvelope<T> {
  success: number;
  return?: T;
  error?: string;
  error_code?: string;
}

export interface IndodaxTradeReturn {
  order_id?: string | number;
  type?: 'buy' | 'sell';
  balance?: Record<string, string | number>;
  trades?: Array<Record<string, string | number>>;
  order_status?: {
    price?: string | number;
    max_volume?: string | number;
    volume?: string | number;
  };
}

export interface IndodaxGetOrderReturn {
  order?: Record<string, string | number>;
}

export interface IndodaxOpenOrdersReturn {
  orders?: Record<string, Array<Record<string, string | number>>>;
}

export interface IndodaxOrderHistoryReturn {
  orders?: Array<Record<string, string | number>>;
}

export interface IndodaxTradeHistoryReturn {
  trades?:
    | Array<Record<string, string | number>>
    | Record<string, Array<Record<string, string | number>>>;
}

export interface IndodaxHistoryQueryOptions {
  pair?: string;
  limit?: number;
  orderId?: string | number;
  startTime?: number;
  endTime?: number;
  sort?: 'asc' | 'desc';
}

export interface IndodaxCancelOrderReturn {
  order_id?: string | number;
  client_order_id?: string;
  status?: string;
}

function getSellAssetKey(pair: string): string {
  const [baseAsset] = pair.toLowerCase().split('_');
  return baseAsset || 'amount';
}

function normalizePair(pair?: string): string | undefined {
  if (!pair) {
    return undefined;
  }

  const normalized = pair.trim().toLowerCase().replace(/[\-/]/g, '_');
  if (normalized.includes('_')) {
    return normalized;
  }

  if (normalized.endsWith('idr') && normalized.length > 3) {
    return `${normalized.slice(0, -3)}_idr`;
  }

  return normalized;
}

function toTradeApiV2Symbol(pair?: string): string | undefined {
  return normalizePair(pair)?.replace(/_/g, '');
}

function normalizeOrderSide(value: unknown, fallback?: 'buy' | 'sell'): 'buy' | 'sell' | '' {
  if (typeof value === 'boolean') {
    return value ? 'buy' : 'sell';
  }

  if (typeof value !== 'string') {
    return fallback ?? '';
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'buy' || normalized === 'sell') {
    return normalized;
  }

  return fallback ?? '';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

function collectItems(payload: unknown, keys: string[]): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload.map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.map((item) => asRecord(item)).filter(Boolean) as Array<Record<string, unknown>>;
    }

    const nestedRecord = asRecord(value);
    if (nestedRecord) {
      const nested = collectItems(nestedRecord, keys);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function stringifyHeaders(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

export class PrivateApi {
  private readonly baseUrl: string;
  private readonly tradeApiV2BaseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(options: IndodaxPrivateApiOptions) {
    this.baseUrl = options.baseUrl;
    this.tradeApiV2BaseUrl = options.tradeApiV2BaseUrl ?? 'https://tapi.indodax.com';
    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
  }

  private sign(payload: string): string {
    return crypto.createHmac('sha512', this.apiSecret).update(payload).digest('hex');
  }

  private assertSuccess(method: string, payload: unknown): void {
    const record = asRecord(payload);
    if (!record) {
      return;
    }

    if (record.success !== undefined && Number(record.success) !== 1) {
      throw new Error(String(record.error ?? `Private API ${method} failed`));
    }

    if (record.error) {
      throw new Error(String(record.error));
    }
  }

  private async post<T>(
    method: string,
    params: Record<string, string | number> = {},
  ): Promise<IndodaxPrivateEnvelope<T>> {
    const nonce = Date.now();
    const body = new URLSearchParams({
      method,
      nonce: String(nonce),
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    });

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Key: this.apiKey,
        Sign: this.sign(body.toString()),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Private API ${method} failed: ${response.status}`);
    }

    const payload = (await response.json()) as IndodaxPrivateEnvelope<T>;

    if (Number(payload.success) !== 1) {
      throw new Error(payload.error ?? `Private API ${method} failed`);
    }

    return payload;
  }

  private async getV2<T>(
    path: string,
    params: Record<string, string | number | undefined> = {},
  ): Promise<T> {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)]),
    );

    if (!query.has('timestamp') && !query.has('nonce')) {
      query.set('timestamp', String(Date.now()));
    }
    if (query.has('timestamp') && !query.has('recvWindow')) {
      query.set('recvWindow', '5000');
    }

    const requestUrl = new URL(path, this.tradeApiV2BaseUrl);
    requestUrl.search = query.toString();

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'X-APIKEY': this.apiKey,
        Sign: this.sign(query.toString()),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorPayload = await response
        .json()
        .catch(async () => ({ error: await response.text().catch(() => '') }));
      const errorRecord = asRecord(errorPayload);
      throw new Error(
        String(
          errorRecord?.error ??
            errorRecord?.message ??
            `Private API GET ${requestUrl.pathname} failed: ${response.status}`,
        ),
      );
    }

    const payload = (await response.json()) as T;
    this.assertSuccess(requestUrl.pathname, payload);
    return payload;
  }

  private normalizeV2OrderHistoryItem(
    item: Record<string, unknown>,
    pair?: string,
  ): Record<string, string | number> | null {
    const normalizedPair = normalizePair(
      pair ?? String(readValue(item, ['pair', 'market', 'symbol', 'trade_pair']) ?? ''),
    );
    const asset = getSellAssetKey(normalizedPair ?? 'amount_idr');
    const filled = readValue(item, ['filled_qty', 'filled_quantity', 'executed_qty', 'executedQty']);
    const remaining = readValue(item, ['remaining_qty', 'remain_qty', 'remaining', 'leaves_qty', 'remain']);
    const quantity =
      readValue(item, [`order_${asset}`, asset, 'amount', 'quantity', 'qty', 'volume', 'oriQty']) ??
      ((Number(filled ?? 0) || Number(remaining ?? 0)) > 0
        ? (Number(filled ?? 0) + Number(remaining ?? 0))
        : undefined);
    const computedRemaining =
      remaining ??
      (quantity !== undefined && filled !== undefined
        ? typeof quantity === 'string' || typeof filled === 'string'
          ? String(Math.max(0, Number(quantity) - Number(filled)))
          : Math.max(0, Number(quantity) - Number(filled))
        : 0);
    const orderId = readValue(item, ['order_id', 'id', 'orderId']);

    if (orderId === undefined || orderId === null) {
      return null;
    }

    return {
      order_id: String(orderId),
      pair: normalizedPair ?? pair ?? '',
      type: normalizeOrderSide(readValue(item, ['type', 'side'])),
      price: readValue(item, ['price', 'order_price', 'avg_price', 'average_price']) as string | number,
      [`order_${asset}`]: quantity as string | number,
      [`remain_${asset}`]: computedRemaining as string | number,
      status: String(
        readValue(item, ['status', 'order_status', 'state']) ??
          (Number(computedRemaining ?? 0) <= 0 ? 'filled' : 'open'),
      ),
      submit_time: readValue(item, ['submit_time', 'created_at', 'createdAt', 'timestamp', 'time', 'submitTime']) as
        | string
        | number,
      finish_time: readValue(item, ['finish_time', 'updated_at', 'updatedAt', 'closed_at', 'closedAt', 'finishTime']) as
        | string
        | number,
    };
  }

  private normalizeV2TradeItem(
    item: Record<string, unknown>,
    pair?: string,
  ): Record<string, string | number> | null {
    const normalizedPair = normalizePair(
      pair ?? String(readValue(item, ['pair', 'market', 'symbol', 'trade_pair']) ?? ''),
    );
    const asset = getSellAssetKey(normalizedPair ?? 'amount_idr');
    const orderId = readValue(item, ['order_id', 'orderId']);

    if (orderId === undefined || orderId === null) {
      return null;
    }

    const feeAsset = String(
      readValue(item, ['fee_asset', 'commission_asset', 'feeAsset', 'commissionAsset']) ??
        (normalizedPair?.split('_')[1] ?? 'idr'),
    ).toLowerCase();
    const normalizedSide = normalizeOrderSide(
      readValue(item, ['type', 'side']),
      normalizeOrderSide(readValue(item, ['isBuyer'])) || undefined,
    );

    return {
      trade_id: String(readValue(item, ['trade_id', 'id', 'tradeId']) ?? ''),
      order_id: String(orderId),
      pair: normalizedPair ?? pair ?? '',
      type: normalizedSide,
      price: readValue(item, ['price', 'avg_price', 'average_price']) as string | number,
      [asset]: (readValue(item, [asset, 'amount', 'quantity', 'qty', 'executed_qty']) ?? 0) as
        | string
        | number,
      [`fee_${feeAsset}`]: (readValue(item, [`fee_${feeAsset}`, 'fee', 'commission']) ?? 0) as
        | string
        | number,
      timestamp: readValue(item, ['timestamp', 'created_at', 'createdAt', 'executed_at', 'time']) as
        | string
        | number,
    };
  }

  getInfo<T>(): Promise<IndodaxPrivateEnvelope<T>> {
    return this.post<T>('getInfo');
  }

  trade(
    pair: string,
    type: 'buy' | 'sell',
    price: number,
    amount: number,
  ): Promise<IndodaxPrivateEnvelope<IndodaxTradeReturn>> {
    const amountField = type === 'buy' ? 'idr' : getSellAssetKey(pair);

    return this.post<IndodaxTradeReturn>('trade', {
      pair,
      type,
      price,
      [amountField]: amount,
    });
  }

  cancelOrder(
    pair: string,
    orderId: string | number,
    type: 'buy' | 'sell',
  ): Promise<IndodaxPrivateEnvelope<IndodaxCancelOrderReturn>> {
    return this.post<IndodaxCancelOrderReturn>('cancelOrder', {
      pair,
      order_id: orderId,
      type,
    });
  }

  openOrders(pair?: string): Promise<IndodaxPrivateEnvelope<IndodaxOpenOrdersReturn>> {
    return this.post<IndodaxOpenOrdersReturn>('openOrders', pair ? { pair } : {});
  }

  orderHistory(pair?: string): Promise<IndodaxPrivateEnvelope<IndodaxOrderHistoryReturn>> {
    return this.post<IndodaxOrderHistoryReturn>('orderHistory', pair ? { pair } : {});
  }

  async orderHistoriesV2(
    options: IndodaxHistoryQueryOptions = {},
  ): Promise<IndodaxPrivateEnvelope<IndodaxOrderHistoryReturn>> {
    const symbol = toTradeApiV2Symbol(options.pair);
    if (!symbol) {
      throw new Error('pair is required for orderHistoriesV2');
    }

    const payload = await this.getV2<unknown>('/api/v2/order/histories', {
      symbol,
      startTime: options.startTime,
      endTime: options.endTime,
      limit: options.limit,
      sort: options.sort,
    });

    const items = collectItems(payload, ['data', 'results', 'items', 'orders', 'histories']);
    return {
      success: 1,
      return: {
        orders: items
          .map((item) => this.normalizeV2OrderHistoryItem(item, options.pair))
          .filter(Boolean) as Array<Record<string, string | number>>,
      },
    };
  }

  tradeHistory(pair?: string): Promise<IndodaxPrivateEnvelope<IndodaxTradeHistoryReturn>> {
    return this.post<IndodaxTradeHistoryReturn>('tradeHistory', pair ? { pair } : {});
  }

  async myTradesV2(
    options: IndodaxHistoryQueryOptions = {},
  ): Promise<IndodaxPrivateEnvelope<IndodaxTradeHistoryReturn>> {
    const symbol = toTradeApiV2Symbol(options.pair);
    if (!symbol) {
      throw new Error('pair is required for myTradesV2');
    }

    const payload = await this.getV2<unknown>('/api/v2/myTrades', {
      symbol,
      startTime: options.startTime,
      endTime: options.endTime,
      limit: options.limit,
      orderId: options.orderId,
      sort: options.sort,
    });

    const items = collectItems(payload, ['data', 'results', 'items', 'trades']);
    return {
      success: 1,
      return: {
        trades: items
          .map((item) => this.normalizeV2TradeItem(item, options.pair))
          .filter(Boolean) as Array<Record<string, string | number>>,
      },
    };
  }

  getOrder(
    pair: string,
    orderId: string | number,
  ): Promise<IndodaxPrivateEnvelope<IndodaxGetOrderReturn>> {
    return this.post<IndodaxGetOrderReturn>('getOrder', {
      pair,
      order_id: orderId,
    });
  }
}
