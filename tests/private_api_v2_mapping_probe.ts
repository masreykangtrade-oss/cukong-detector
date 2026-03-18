import assert from 'node:assert/strict';

import { PrivateApi } from '../src/integrations/indodax/privateApi';

async function main() {
  const originalFetch = global.fetch;
  const calledRequests: Array<{ url: string; headers: Record<string, string> }> = [];

  try {
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const headers = Object.fromEntries(new Headers(init?.headers).entries());
      calledRequests.push({ url, headers });

      if (url.includes('/api/v2/order/histories')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: '123',
                pair: 'btc_idr',
                status: 'filled',
                price: '100',
                quantity: '2',
                remaining: '0',
                created_at: 1700000000,
                updated_at: 1700000001,
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              order_id: '123',
              pair: 'btc_idr',
              price: '101',
              quantity: '2',
              fee: '1',
              fee_asset: 'idr',
              timestamp: 1700000002,
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof global.fetch;

    const api = new PrivateApi({
      baseUrl: 'https://indodax.com/tapi',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    });

    const orderHistory = await api.orderHistoriesV2({
      pair: 'btc_idr',
      orderId: '123',
      limit: 50,
    });
    const myTrades = await api.myTradesV2({
      pair: 'btc_idr',
      orderId: '123',
      limit: 50,
    });

    assert.equal(calledRequests.length, 2, 'Both v2 endpoints must be requested');
    assert.match(calledRequests[0]?.url ?? '', /\/api\/v2\/order\/histories/, 'order history must use v2 endpoint path');
    assert.match(calledRequests[1]?.url ?? '', /\/api\/v2\/myTrades/, 'trade history must use v2 endpoint path');
    assert.equal(calledRequests[0]?.headers.key, 'test-key', 'v2 requests must send API key header');
    assert.ok(calledRequests[0]?.headers.sign, 'v2 requests must send signature header');

    assert.equal(orderHistory.return?.orders?.[0]?.order_id, '123', 'v2 order history must map id -> order_id');
    assert.equal(orderHistory.return?.orders?.[0]?.order_btc, '2', 'v2 order history must map quantity to order_<asset>');
    assert.equal(orderHistory.return?.orders?.[0]?.remain_btc, '0', 'v2 order history must map remaining to remain_<asset>');

    const firstTrade = Array.isArray(myTrades.return?.trades) ? myTrades.return?.trades[0] : undefined;
    assert.equal(firstTrade?.order_id, '123', 'v2 myTrades must preserve order_id');
    assert.equal(firstTrade?.btc, '2', 'v2 myTrades must map quantity to base asset field');
    assert.equal(firstTrade?.fee_idr, '1', 'v2 myTrades must map fee field to fee_<asset>');

    console.log('PASS private_api_v2_mapping_probe');
  } finally {
    global.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error('FAIL private_api_v2_mapping_probe');
  console.error(error);
  process.exit(1);
});