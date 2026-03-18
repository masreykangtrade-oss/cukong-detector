# PRD — Final Audit Readiness Kangtrade / Telegram / Indodax

## Original Problem Statement
User meminta audit readiness live terakhir pada repo `https://github.com/bcbcrey-hue/cukong-markets` dengan target publik `https://kangtrade.top` dan callback final `https://kangtrade.top/indodax/callback`, menggunakan secret runtime nyata tanpa pernah mencetak secret penuh. Scope utama: sinkronisasi domain/callback/nginx/env contract, verifikasi Telegram whitelist dan token, verifikasi vendor Indodax secara aman tanpa live trade berisiko, hardening ringan, smoke test aman, perbaikan mismatch yang masih tersisa, serta update README / REFACTOR_LOG / SESSION_CONTEXT_NEXT / .env.example.

## Architecture Decisions
- Pertahankan arsitektur runtime utama `scanner -> signal -> intelligence -> execution`; hindari refactor besar.
- Pertahankan callback server Indodax sebagai server terpisah port agar health app dan callback tetap terisolasi.
- Sync repo ke target operasional final: `kangtrade.top`, `/indodax/callback`, port `3000/3001`.
- Koreksi contract Indodax Trade API v2 mengikuti docs resmi terbaru: base `https://tapi.indodax.com`, header `X-APIKEY`, signature atas query string, dan param `symbol/timestamp/recvWindow`.
- Tambahkan hardening ringan pada callback host extraction: host langsung publik harus menang atas spoof `X-Forwarded-Host`.
- Tambahkan fail-fast ringan untuk env routing penting saat `NODE_ENV=production`.

## What’s Implemented
- Menambahkan `.env.example` bersih dan sinkron dengan target live final tanpa secret.
- Mengubah fallback routing utama di `src/config/env.ts` ke `APP_PORT=3000` dan `INDODAX_CALLBACK_PORT=3001` serta menambah `INDODAX_TRADE_API_V2_BASE_URL`.
- Memperbaiki `src/integrations/indodax/privateApi.ts` agar v2 memakai contract resmi terbaru dan tetap memetakan response ke shape internal legacy-compatible.
- Memperbarui `src/integrations/indodax/client.ts` agar memakai base URL v2 baru dari env.
- Menambahkan hardening di `src/integrations/indodax/callbackServer.ts` agar host publik valid tidak kalah oleh spoof header forwarded.
- Memperbarui nginx template + renderer agar sinkron dengan `kangtrade.top`, `/indodax/callback`, `3000/3001`, dan meneruskan `X-Forwarded-Host`.
- Memperbarui probe: `private_api_v2_mapping_probe`, `http_servers_probe`, `nginx_renderer_probe`, `app_lifecycle_servers_probe`.
- Memperbarui `README.md`, `REFACTOR_LOG.md`, dan `SESSION_CONTEXT_NEXT.md` agar sinkron penuh dengan audit final.
- Menjalankan smoke test aman read-only ke Telegram dan Indodax vendor nyata; tidak ada live trade yang dikirim.

## Verification Executed
Lulus:
- `yarn install`
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
- testing agent iteration 10 backend audit

Smoke test live-readonly yang benar-benar dilakukan:
- `Telegram getMe` valid
- `Telegram getWebhookInfo` valid (webhook tidak terpasang)
- `Indodax getInfo` valid
- `GET https://tapi.indodax.com/api/v2/order/histories?...` valid 200 read-only
- `GET https://tapi.indodax.com/api/v2/myTrades?...` valid 200 read-only
- `GET https://kangtrade.top/healthz` masih mismatch (HTML frontend)
- `GET/POST https://kangtrade.top/indodax/callback` masih mismatch dengan contract repo

## Prioritized Backlog
### P0
- Sinkronkan runtime/nginx publik `kangtrade.top` ke hasil render repo terbaru.
- Buktikan `/healthz` publik mengarah ke JSON runtime repo ini.
- Buktikan callback publik live benar-benar dilayani callback server repo ini.
- Re-run public smoke test setelah domain/runtime sinkron.

### P1
- Perkuat recovery edge-case order live parsial/terminal.
- Perkuat fallback accounting bila detail fill/fee exchange parsial.

### P2
- Tambah runbook backup/restore folder `data/`.

## Next Tasks
1. Terapkan config nginx hasil render terbaru pada runtime publik `kangtrade.top`.
2. Verifikasi ulang `/healthz` publik dan callback publik setelah runtime sinkron.
3. Re-run validasi live-readonly vendor dan Telegram pada domain publik yang sudah benar.
4. Baru setelah itu simpulkan live readiness penuh.
