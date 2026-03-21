import { env } from '../../config/env';
import type { StoredAccount } from '../../core/types';
import { PublicApi, type IndodaxOrderbook, type IndodaxTickerEntry } from './publicApi';
import { getPrivatePacer } from './pacing';
import { PrivateApi } from './privateApi';

export class IndodaxClient {
  private readonly privateApiByAccount = new Map<string, PrivateApi>();

  constructor(
    private readonly publicApi = new PublicApi(
      env.indodaxPublicBaseUrl,
      env.indodaxTimeoutMs,
    ),
  ) {}

  async getTickers(): Promise<Record<string, IndodaxTickerEntry>> {
    return this.publicApi.getTickers();
  }

  async getDepth(pair: string): Promise<IndodaxOrderbook> {
    return this.publicApi.safeGetDepth(pair);
  }

  forAccount(account: StoredAccount): PrivateApi {
    const cacheKey = account.id.trim().toLowerCase();
    const cached = this.privateApiByAccount.get(cacheKey);
    if (cached) {
      return cached;
    }

    const api = new PrivateApi({
      baseUrl: env.indodaxPrivateBaseUrl,
      tradeApiV2BaseUrl: env.indodaxTradeApiV2BaseUrl,
      timeoutMs: env.indodaxTimeoutMs,
      pacer: getPrivatePacer(cacheKey),
      apiKey: account.apiKey,
      apiSecret: account.apiSecret,
    });
    this.privateApiByAccount.set(cacheKey, api);
    return api;
  }
}
