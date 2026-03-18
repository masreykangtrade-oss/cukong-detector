# PRD — Env-Driven Domain/Callback Architecture Finalization

## Original Problem Statement
User meminta tahap lanjutan yang fokus pada arsitektur config env-driven sebagai source of truth: domain publik dan callback final harus berasal dari env runtime, route internal inti tetap `/healthz` dan `/indodax/callback`, nginx hanya wiring/proxy, Telegram tetap panel utama via long polling, callback publik dipisahkan dari vendor outbound API Indodax, kontrak legacy `/tapi` dan Trade API 2.0 harus dipisahkan jelas, tidak ada refactor besar, dan dokumen `README.md`, `.env.example`, `REFACTOR_LOG.md`, `SESSION_CONTEXT_NEXT.md`, serta `package.json` harus sinkron penuh dengan implementasi terbaru.

## Architecture Decisions
- Pertahankan route internal inti tetap statis: `/healthz` dan `/indodax/callback`.
- Pertahankan callback final publik dibentuk dari `PUBLIC_BASE_URL + INDODAX_CALLBACK_PATH`, tetapi validasi `INDODAX_CALLBACK_PATH` agar tetap `/indodax/callback` supaya route internal tidak drift.
- Pisahkan concern menjadi empat area: domain/callback publik, route internal stabil, Telegram long polling UI, dan vendor outbound Indodax.
- Pertahankan legacy `/tapi` hanya untuk compatibility/recovery yang masih diperlukan; arah history baru ke Trade API 2.0.
- Gunakan nginx template + renderer sebagai lapisan wiring dari env, bukan sebagai tempat logika bisnis domain/callback.

## What’s Implemented
- Menambahkan guard `readStablePath()` di `src/config/env.ts` agar `INDODAX_CALLBACK_PATH` tetap `/indodax/callback` dan startup fail-fast bila ada drift.
- Menambahkan guard yang sama di `scripts/render-nginx-conf.mjs` agar render nginx juga gagal jika callback path diubah ke path lain.
- Menambahkan script `render:nginx` di `package.json` agar workflow renderer sinkron dengan dokumentasi.
- Menambahkan `INDODAX_PUBLIC_BASE_URL` dan `INDODAX_PRIVATE_BASE_URL` ke `.env.example` agar vendor outbound config terlihat terpisah dari domain publik.
- Memperjelas README bahwa:
  - callback final dibentuk dari env,
  - route internal tetap statis,
  - Telegram long polling terpisah dari callback publik,
  - vendor outbound Indodax dipisahkan dari public callback config.
- Membersihkan `REFACTOR_LOG.md` menjadi log final yang fokus pada arsitektur env-driven, static vs env-driven vs template-rendered, status contract Indodax, dan blocker nyata.
- Menyinkronkan `SESSION_CONTEXT_NEXT.md` dengan log final, README, `.env.example`, dan `package.json`.
- Sebelumnya pada sesi yang sama, implementasi Indodax V2 juga sudah diperbaiki ke contract resmi: base `https://tapi.indodax.com`, header `X-APIKEY`, query-string signature, dan timing params.

## Verification Executed
Lulus:
- `yarn lint`
- `yarn build`
- `yarn render:nginx`
- `tests/private_api_v2_mapping_probe.ts`
- `tests/http_servers_probe.ts`
- `tests/nginx_renderer_probe.ts`
- `tests/app_lifecycle_servers_probe.ts`
- testing agent iteration 11

Smoke/negative checks yang benar-benar dilakukan:
- import config dengan `INDODAX_CALLBACK_PATH=/hooks/indodax` sekarang gagal dengan error fail-fast yang benar
- render nginx dengan callback path valid tetap berhasil
- callback URL terderivasi tetap `PUBLIC_BASE_URL + INDODAX_CALLBACK_PATH`

## Prioritized Backlog
### P0
- Buktikan domain publik aktif benar-benar memakai wiring repo ini.
- Buktikan `/healthz` publik mengarah ke runtime repo.
- Buktikan `/indodax/callback` publik mengarah ke callback server repo.

### P1
- Kurangi kompleksitas compatibility layer legacy + V2 di execution/recovery tanpa refactor besar.

### P2
- Tambah runbook ops untuk backup/restore `data/` dan release checklist env-rendered nginx.

## Next Tasks
1. Terapkan `yarn render:nginx` output ke ingress/runtime publik.
2. Re-cek `/healthz` dan `/indodax/callback` dari domain publik.
3. Pertahankan guard stable path sebagai regression gate wajib.
4. Setelah ingress publik sinkron, lanjutkan audit operasional live bila dibutuhkan.
