# Cukong-Markets

Backend TypeScript untuk bot operasional market Indodax dengan UI utama di Telegram.

## Target live final repo ini

- domain publik acuan: `https://kangtrade.top`
- callback publik final: `https://kangtrade.top/indodax/callback`
- app utama: `APP_PORT=3000`
- callback server: `INDODAX_CALLBACK_PORT=3001`
- history mode default: `INDODAX_HISTORY_MODE=v2_prefer`
- base endpoint Trade API v2: `https://tapi.indodax.com`

## Arsitektur aktif

Runtime utama repo tetap:

`tickers + depth -> MarketWatcher -> SignalEngine -> intelligence pipeline -> OpportunityAssessment -> Hotlist -> ExecutionEngine`

Komponen yang sudah terhubung:

- scanner market + hotlist berbasis `OpportunityAssessment`
- pipeline intelligence + worker runtime + backtest
- hardening execution (openOrders-first, getOrder, history fallback, duplicate guard)
- summary execution/trade ke Telegram + journal + persistence
- mode history Indodax `v2_prefer | v2_only | legacy`
- callback server Indodax terpisah port, env-driven, dan persist event
- nginx template + renderer berbasis `.env`

## Telegram UI operasional

Main menu operasional berisi 7 kategori:

1. `⚡ Execute Trade`
2. `🚨 Emergency Controls`
3. `📡 Monitoring / Laporan`
4. `📦 Positions / Orders / Manual Trade`
5. `⚙️ Settings`
6. `👤 Accounts`
7. `🧪 Backtest`

Whitelist akses tetap ketat lewat `TELEGRAM_ALLOWED_USER_IDS`.

## Env contract

Salin `.env.example` menjadi `.env`, lalu isi minimal:

- `PUBLIC_BASE_URL`
- `APP_PORT`
- `APP_BIND_HOST`
- `INDODAX_CALLBACK_PATH`
- `INDODAX_CALLBACK_PORT`
- `INDODAX_CALLBACK_BIND_HOST`
- `INDODAX_CALLBACK_ALLOWED_HOST`
- `INDODAX_ENABLE_CALLBACK_SERVER`
- `INDODAX_HISTORY_MODE`
- `INDODAX_TRADE_API_V2_BASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USER_IDS`
- `DATA_DIR`
- `LOG_DIR`
- `TEMP_DIR`

Default contoh non-secret yang sekarang sinkron:

```bash
PUBLIC_BASE_URL=https://kangtrade.top
APP_PORT=3000
APP_BIND_HOST=0.0.0.0
INDODAX_CALLBACK_PATH=/indodax/callback
INDODAX_CALLBACK_PORT=3001
INDODAX_CALLBACK_BIND_HOST=0.0.0.0
INDODAX_CALLBACK_ALLOWED_HOST=kangtrade.top
INDODAX_ENABLE_CALLBACK_SERVER=true
INDODAX_HISTORY_MODE=v2_prefer
INDODAX_TRADE_API_V2_BASE_URL=https://tapi.indodax.com
```

## Callback URL final

Callback URL publik selalu diturunkan dari:

`PUBLIC_BASE_URL + INDODAX_CALLBACK_PATH`

Dengan contract target saat ini, hasil finalnya wajib menjadi:

`https://kangtrade.top/indodax/callback`

## Cara render nginx config

Setelah `.env` siap, jalankan:

```bash
node scripts/render-nginx-conf.mjs
```

Output final berada di:

```bash
deploy/nginx/mafiamarkets.nginx.conf
```

Template nginx sekarang meneruskan:

- `Host`
- `X-Forwarded-Host`
- `X-Forwarded-For`
- `X-Forwarded-Proto`

## Cara cek runtime lokal

Health app utama:

```bash
curl http://127.0.0.1:${APP_PORT}/healthz
```

Health callback:

```bash
curl http://127.0.0.1:${INDODAX_CALLBACK_PORT}/healthz
```

## Cara menjalankan

```bash
yarn install
yarn lint
yarn build
yarn dev
```

Jika `INDODAX_ENABLE_CALLBACK_SERVER=true`, callback server ikut start saat app dijalankan.

## Probe / regression penting

Probe yang harus lulus:

- `yarn lint`
- `yarn build`
- `tests/runtime_backend_regression.ts`
- `tests/worker_timeout_probe.ts`
- `tests/live_execution_hardening_probe.ts`
- `tests/execution_summary_failed_probe.ts`
- `tests/telegram_menu_navigation_probe.ts`
- `tests/telegram_slippage_confirmation_probe.ts`
- `tests/indodax_history_v2_probe.ts`
- `tests/private_api_v2_mapping_probe.ts`
- `tests/http_servers_probe.ts`
- `tests/nginx_renderer_probe.ts`
- `tests/app_lifecycle_servers_probe.ts`

## Catatan jujur

- validasi read-only Telegram dan legacy `getInfo` vendor bisa dilakukan aman
- Trade API v2 Indodax memakai base resmi `https://tapi.indodax.com`, header `X-APIKEY`, dan query signature
- callback server lokal sudah memprioritaskan host langsung agar spoof `X-Forwarded-Host` tidak mengalahkan host publik valid
- live domain publik tetap harus benar-benar memakai nginx hasil render terbaru agar `/healthz` dan callback target sesuai repo ini

Lihat `REFACTOR_LOG.md` untuk audit lengkap dan `SESSION_CONTEXT_NEXT.md` untuk konteks sesi berikutnya.
