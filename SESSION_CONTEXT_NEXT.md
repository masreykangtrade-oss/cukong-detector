# SESSION_CONTEXT_NEXT

Repository aktif: `https://github.com/bcbcrey-hue/cukong-markets`

Gunakan file ini sebagai konteks cepat yang sinkron penuh dengan `REFACTOR_LOG.md`.

---

## 1. Posisi project yang harus dianggap benar

- target domain final repo: `https://kangtrade.top`
- target callback final repo: `https://kangtrade.top/indodax/callback`
- contract env non-secret sekarang sinkron di `.env.example`
- implementasi v2 Indodax sudah dipindah ke contract resmi `https://tapi.indodax.com`
- callback server sudah di-hardening terhadap spoof `X-Forwarded-Host`
- `README.md`, `.env.example`, `REFACTOR_LOG.md`, dan file ini sekarang sinkron

---

## 2. Truth penting per modul

### Trading / execution / history

- mode history tetap `v2_prefer | v2_only | legacy`
- default repo tetap `v2_prefer`
- method v2 yang dipakai sekarang:
  - `GET /api/v2/order/histories`
  - `GET /api/v2/myTrades`
- contract v2 yang benar sekarang:
  - base `https://tapi.indodax.com`
  - header `X-APIKEY`
  - signature query string
  - query memakai `symbol`, `timestamp`, `recvWindow`
- response v2 tetap dipetakan ke model internal legacy-compatible

### Callback / HTTP / deployment helpers

- app utama punya `/healthz`
- callback server hidup terpisah di port sendiri
- callback path tetap dari env (`INDODAX_CALLBACK_PATH`)
- host allow-list tetap dari env (`INDODAX_CALLBACK_ALLOWED_HOST`)
- callback event tetap dipersist ke JSONL + state snapshot
- nginx renderer aktif di `scripts/render-nginx-conf.mjs`
- nginx template aktif di `deploy/nginx/mafiamarkets.nginx.conf.template`
- nginx sekarang meneruskan `Host` dan `X-Forwarded-Host`

### Telegram

- Telegram UI tetap UI utama
- whitelist tetap strict berbasis `TELEGRAM_ALLOWED_USER_IDS`
- token sempat tervalidasi read-only via `getMe`
- webhook saat audit terakhir tidak terpasang

---

## 3. Hal yang sudah ditutup, jangan diulang

- mismatch doc/env target lama (`8787/8788`, `bot.example.com`, `/hooks/indodax`)
- implementasi v2 yang masih memakai base/header/signature lama
- callback host extraction yang terlalu percaya `X-Forwarded-Host`
- ketiadaan `.env.example`

---

## 4. Backlog aktif yang nyata

### P0

- buktikan domain `kangtrade.top` benar-benar memakai hasil render nginx terbaru
- buktikan `/healthz` publik mengarah ke runtime repo ini, bukan frontend HTML
- buktikan callback publik live benar-benar masuk ke callback server repo ini
- re-run validasi live read-only v2 setelah runtime/domain sinkron

### P1

- dalami recovery edge-case order live parsial/terminal
- perkuat fallback accounting jika detail fee/fill exchange parsial

### P2

- tambah runbook backup/restore `data/`

---

## 5. Rule kerja sesi berikutnya

- jangan overclaim live penuh sebelum domain publik sinkron
- pakai implementasi repo terbaru sebagai sumber utama, bukan asumsi lama
- jika audit domain masih menunjukkan HTML di `/healthz`, anggap deploy publik belum sinkron
- gunakan `REFACTOR_LOG.md` untuk detail lengkap dan file ini untuk ringkasan cepat

---

## 6. Validasi cepat yang bisa dipakai ulang

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
