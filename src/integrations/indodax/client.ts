import { env } from '../../config/env';
import type { StoredAccount } from '../../core/types';
import { PublicApi, type IndodaxOrderbook, type IndodaxTickerEntry } from './publicApi';
import { PrivateApi } from './privateApi';

export class IndodaxClient {
  constructor(
    private readonly publicApi = new PublicApi(env.indodaxPublicBaseUrl),
  ) {}

  async getTickers(): Promise<Record<string, IndodaxTickerEntry>> {
    return this.publicApi.getTickers();
  }

  async getDepth(pair: string): Promise<IndodaxOrderbook> {
    return this.publicApi.safeGetDepth(pair);
  }

  forAccount(account: StoredAccount): PrivateApi {
    return new PrivateApi({
      baseUrl: env.indodaxPrivateBaseUrl,
      apiKey: account.apiKey,
      apiSecret: account.apiSecret,
    });
  }
}
