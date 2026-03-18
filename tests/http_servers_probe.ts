import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { IndodaxCallbackServer } from '../src/integrations/indodax/callbackServer';
import { AppServer } from '../src/server/appServer';
import { JournalService } from '../src/services/journalService';
import { PersistenceService } from '../src/services/persistenceService';
import { StateService } from '../src/services/stateService';
import { HealthService } from '../src/services/healthService';

async function main() {
  const tempDataDir = process.env.DATA_DIR;
  assert.ok(tempDataDir, 'DATA_DIR must be provided for isolated test run');

  await fs.rm(tempDataDir, { recursive: true, force: true });
  await fs.mkdir(path.resolve(tempDataDir), { recursive: true });

  const persistence = new PersistenceService();
  await persistence.bootstrap();

  const state = new StateService(persistence);
  const health = new HealthService(persistence, state);
  const journal = new JournalService(persistence);

  await Promise.all([state.load(), health.load(), journal.load()]);
  await health.build({
    scannerRunning: true,
    telegramRunning: true,
    tradingEnabled: true,
    positions: [],
    orders: [],
  });

  const appServer = new AppServer(health);
  const callbackServer = new IndodaxCallbackServer(persistence, journal);

  try {
    await appServer.start();
    await callbackServer.start();

    const appHealthResponse = await fetch(`http://127.0.0.1:${appServer.getPort()}/healthz`);
    assert.equal(appHealthResponse.status, 200, 'App server /healthz must respond 200');
    const appHealth = (await appHealthResponse.json()) as {
      callback: { path: string; port: number; allowedHost: string | null };
    };
    assert.equal(appHealth.callback.path, process.env.INDODAX_CALLBACK_PATH, 'App server must expose callback path from env');

    const callbackHealthResponse = await fetch(`http://127.0.0.1:${callbackServer.getPort()}/healthz`);
    assert.equal(callbackHealthResponse.status, 200, 'Callback server /healthz must respond 200');
    const callbackHealth = (await callbackHealthResponse.json()) as { callbackPath: string; enabled: boolean };
    assert.equal(callbackHealth.callbackPath, process.env.INDODAX_CALLBACK_PATH, 'Callback health must reflect env path');
    assert.equal(callbackHealth.enabled, true, 'Callback health must reflect enabled env');

    const callbackOkResponse = await fetch(
      `http://127.0.0.1:${callbackServer.getPort()}${process.env.INDODAX_CALLBACK_PATH}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-host': process.env.INDODAX_CALLBACK_ALLOWED_HOST ?? '',
        },
        body: JSON.stringify({ event: 'withdraw_update', status: 'ok' }),
      },
    );
    assert.equal(await callbackOkResponse.text(), 'ok', 'Callback server must reply ok for accepted callback');

    const callbackFailResponse = await fetch(
      `http://127.0.0.1:${callbackServer.getPort()}${process.env.INDODAX_CALLBACK_PATH}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-host': 'evil.example.com',
        },
        body: JSON.stringify({ event: 'withdraw_update', status: 'ok' }),
      },
    );
    assert.equal(callbackFailResponse.status, 403, 'Callback server must reject host not in env allow-list');
    assert.equal(await callbackFailResponse.text(), 'fail', 'Rejected callback must reply fail');

    const callbackEvents = await persistence.readIndodaxCallbackEvents();
    const callbackState = await persistence.readIndodaxCallbackState();

    assert.equal(callbackEvents.length, 2, 'Callback events must be persisted to JSONL');
    assert.equal(callbackEvents[0]?.path, process.env.INDODAX_CALLBACK_PATH, 'Callback event path must come from env');
    assert.equal(callbackState.acceptedCount, 1, 'Accepted callbacks must be counted in persisted state');
    assert.equal(callbackState.rejectedCount, 1, 'Rejected callbacks must be counted in persisted state');
    assert.ok(callbackState.lastReceivedAt, 'Callback state must persist last received timestamp');

    console.log('PASS http_servers_probe');
  } finally {
    await callbackServer.stop();
    await appServer.stop();
  }
}

main().catch((error) => {
  console.error('FAIL http_servers_probe');
  console.error(error);
  process.exit(1);
});