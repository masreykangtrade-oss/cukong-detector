# REFACTOR_LOG

Repository aktif: `https://github.com/bcbcrey-hue/cukong-markets`

Dokumen ini adalah sumber kebenaran final setelah audit readiness live terakhir pada target `https://kangtrade.top`.

---

## 1. Ringkasan audit terakhir

Fakta yang sudah dibuktikan pada sesi ini:

- `yarn install` berhasil
- target callback final repo sekarang tetap `https://kangtrade.top/indodax/callback`
- Telegram token valid lewat `getMe` read-only
- whitelist Telegram tetap ketat dan hanya membaca `TELEGRAM_ALLOWED_USER_IDS`
- credential Indodax valid untuk `getInfo` read-only
- implementasi Trade API v2 dibetulkan ke contract resmi terbaru:
  - base endpoint `https://tapi.indodax.com`
  - header `X-APIKEY`
  - signature atas query string
  - param `symbol`, `timestamp`, `recvWindow`
- callback server diperkeras agar host langsung publik menang atas spoof `X-Forwarded-Host`
- `.env.example`, `README.md`, `SESSION_CONTEXT_NEXT.md`, dan file ini sudah disinkronkan

Fakta yang juga dibuktikan dan **jangan di-overclaim**:

- domain publik `https://kangtrade.top/healthz` saat diuji masih mengembalikan HTML frontend, bukan health JSON repo ini
- callback publik `https://kangtrade.top/indodax/callback` saat diuji belum mencerminkan perilaku repo ini secara konsisten
- tanpa nginx/deploy runtime yang benar-benar memakai hasil render terbaru, live domain belum bisa dianggap sinkron
- tidak ada live trade yang dikirim pada sesi ini

---

## 2. Mismatch penting yang ditemukan

### 2.1 Domain publik belum sinkron dengan repo

- `GET https://kangtrade.top/healthz` masih mengembalikan HTML frontend, bukan JSON `/healthz` dari `src/server/appServer.ts`
- `GET https://kangtrade.top/indodax/callback` mengembalikan respons 405 yang bukan format repo ini (`fail`)
- `POST https://kangtrade.top/indodax/callback` mengembalikan `fail`, bukan perilaku `ok/403 fail` yang seharusnya dari callback server repo ini

Kesimpulan: domain publik saat ini belum terbukti memakai wiring nginx/runtime dari repo ini.

### 2.2 Implementasi Indodax v2 lama salah contract

Mismatch lama yang sudah diperbaiki di repo:

- v2 sebelumnya menarget `https://indodax.com/api/v2/...`
- v2 sebelumnya memakai header `Key`
- v2 sebelumnya menandatangani `pathname + query`
- v2 sebelumnya belum mengirim `timestamp/recvWindow`

Contract yang benar sekarang:

- base `https://tapi.indodax.com`
- header `X-APIKEY`
- `Sign = HMAC_SHA512(query_string)`
- query wajib memuat `symbol` dan timing params untuk signed request

---

## 3. File inti yang terdampak audit ini

- `.env.example`
- `README.md`
- `REFACTOR_LOG.md`
- `SESSION_CONTEXT_NEXT.md`
- `src/config/env.ts`
- `src/integrations/indodax/client.ts`
- `src/integrations/indodax/privateApi.ts`
- `src/integrations/indodax/callbackServer.ts`
- `deploy/nginx/mafiamarkets.nginx.conf.template`
- `scripts/render-nginx-conf.mjs`
- `tests/http_servers_probe.ts`
- `tests/nginx_renderer_probe.ts`
- `tests/private_api_v2_mapping_probe.ts`

---

## 4. Status per area

### 4.1 Env + callback + nginx contract

Sekarang sinkron di repo pada nilai target berikut:

- `PUBLIC_BASE_URL=https://kangtrade.top`
- `APP_PORT=3000`
- `INDODAX_CALLBACK_PATH=/indodax/callback`
- `INDODAX_CALLBACK_PORT=3001`
- `INDODAX_CALLBACK_ALLOWED_HOST=kangtrade.top`
- `INDODAX_ENABLE_CALLBACK_SERVER=true`
- `INDODAX_HISTORY_MODE=v2_prefer`
- `INDODAX_TRADE_API_V2_BASE_URL=https://tapi.indodax.com`

### 4.2 Telegram

- token valid secara read-only
- bot identity berhasil diambil
- webhook saat diuji tidak terpasang
- whitelist logic tetap strict dan default-deny bila user ID tidak ada di allow-list

### 4.3 Indodax

- `getInfo` legacy read-only valid dengan credential akun nyata
- jalur v2 sekarang sudah mengikuti docs resmi terbaru
- validasi live v2 harus diulang setelah build/test karena implementasi repo baru saja dibetulkan pada sesi ini

### 4.4 Callback server

- callback path env-driven
- host allow-list env-driven
- `/healthz` tersedia
- event diterima/ditolak tetap dipersist
- spoof `X-Forwarded-Host` tidak lagi boleh mengalahkan host publik valid

---

## 5. Backlog nyata yang tersisa

### P0

- buktikan domain publik benar-benar memakai hasil render nginx terbaru
- buktikan `GET https://kangtrade.top/healthz` mengembalikan JSON runtime repo ini
- buktikan callback publik live masuk ke callback server repo ini pada domain yang sama
- re-run validasi live read-only v2 setelah deployment/runtime domain sinkron

### P1

- perdalam recovery restart order live edge-case saat detail exchange parsial
- perkuat fallback accounting jika detail fee/fill exchange tidak lengkap

### P2

- tambah runbook backup/restore `data/`

---

## 6. Ringkasan jujur satu paragraf

Repo ini sekarang lebih siap daripada sebelumnya karena contract env, callback target, nginx renderer, whitelist Telegram, dan implementasi Trade API v2 sudah diselaraskan ke target akhir serta dokumentasi resmi vendor. Namun domain publik `kangtrade.top` yang aktif saat diuji masih belum membuktikan wiring repo ini di jalur `/healthz` dan `/indodax/callback`, sehingga readiness live penuh tetap belum boleh di-overclaim sampai runtime/deploy domain benar-benar sinkron dengan hasil render nginx terbaru.
