# REFACTOR_LOG.md

## Tujuan dokumen
Dokumen ini merangkum **progres refactor yang dibahas dan disusun pada sesi ini saja** untuk repository:

`https://github.com/masreykangtrade-oss/mafiamarkets`

Dokumen ini dibuat untuk dipakai sebagai **konteks kerja di sesi berikutnya** sebelum melanjutkan refactor.

## Status penting
Seluruh progres di bawah ini adalah:
- **sudah dirancang**
- **sudah dijabarkan batch demi batch**
- **sudah ditulis replacement code/final draft per file di chat ini**

Namun:
- **belum diterapkan langsung ke repository GitHub pada sesi ini**
- jadi statusnya adalah **refactor plan + file replacement draft finalized in-session**, bukan commit yang sudah masuk repo

---

## 1. Batch yang sudah selesai

### Batch 1A — Core contract foundation
Fokus:
- menyatukan kontrak konfigurasi runtime
- menyatukan kontrak type inti lintas sistem
- menghapus pola config/type lama yang saling bertabrakan

### Batch 1B — Core runtime foundation
Fokus:
- membangun ulang storage abstraction
- menyatukan logger dengan kontrak env baru
- merapikan scheduler agar type-safe
- membangun graceful shutdown yang konsisten

### Batch 1C — State and persistence layer reset
Fokus:
- menyatukan persistence gateway
- menyatukan runtime state, settings, health, journal
- menghapus model state/persistence lama yang tidak sinkron

### Batch 1D — Telegram contract reset
Fokus:
- menyatukan auth Telegram
- menyatukan callback routing
- menyatukan keyboard contract
- mempertahankan upload akun legacy JSON
- menyatukan handler Telegram dengan service contract baru

---

## 2. File yang sudah direfactor

### Batch 1A
1. `src/config/env.ts`
2. `src/core/types.ts`

### Batch 1B
3. `src/storage/jsonStore.ts`
4. `src/core/logger.ts`
5. `src/core/scheduler.ts`
6. `src/core/shutdown.ts`

### Batch 1C
7. `src/services/persistenceService.ts`
8. `src/services/stateService.ts`
9. `src/services/healthService.ts`
10. `src/services/journalService.ts`
11. `src/domain/settings/settingsService.ts`

### Batch 1D
12. `src/integrations/telegram/auth.ts`
13. `src/integrations/telegram/callbackRouter.ts`
14. `src/integrations/telegram/keyboards.ts`
15. `src/integrations/telegram/uploadHandler.ts`
16. `src/integrations/telegram/handlers.ts`
17. `src/integrations/telegram/bot.ts`

---

## 3. Perubahan utama yang dilakukan pada setiap batch

### Batch 1A — Core contract foundation

#### `src/config/env.ts`
- dibangun ulang menjadi single source of truth untuk seluruh konfigurasi runtime
- semua field config disatukan dalam format flat/camelCase
- ditambahkan parser util untuk string, number, boolean, enum, dan number list
- dihapus kebutuhan pola lama seperti `env.paths.*`, `env.trading.*`, dan akses field uppercase yang tidak konsisten
- ditambahkan config awal untuk worker, backtest, scanner, risk, dan threshold probabilitas/spoof

#### `src/core/types.ts`
- dibangun ulang sebagai kontrak type inti lintas seluruh sistem
- type disatukan untuk akun, settings, scanner, ticker/orderbook/trade prints, signal, hotlist, microstructure, historical context, opportunity assessment, order/position/trade, runtime state, health, journal, dan backtest
- dipisahkan dengan jelas:
  - `SignalCandidate` sebagai output scanner/scoring awal
  - `OpportunityAssessment` sebagai output intelligence akhir
- menghapus arah type lama yang saling bentrok

### Batch 1B — Core runtime foundation

#### `src/storage/jsonStore.ts`
- dibangun ulang sebagai generic `JsonStore<T>` yang valid untuk TypeScript strict
- ditambahkan helper `read`, `write`, `update`, `reset`, `exists`, `ensureDir`
- ditambahkan `JsonLinesStore<T>` untuk journal, pair history, anomaly events, dan pattern outcomes
- menghilangkan blocker lama dari generic/type yang rusak

#### `src/core/logger.ts`
- logger diselaraskan dengan `env` baru
- ditambahkan redaction untuk field sensitif seperti `apiKey`, `apiSecret`, `token`, dan header otentikasi
- ditambahkan helper `createChildLogger()`

#### `src/core/scheduler.ts`
- dibangun ulang menjadi scheduler ringan yang type-safe
- kontrak job diperjelas: `name`, `intervalMs`, `run`, `runOnStart`
- ditambahkan observability status job
- ditambahkan proteksi overlap job execution

#### `src/core/shutdown.ts`
- dibangun ulang untuk graceful shutdown yang konsisten
- ditambahkan `createShutdownManager()` dan `registerShutdown()`
- mendukung banyak shutdown handler
- mencegah trigger shutdown ganda
- lifecycle siap dipakai untuk app, worker, bot, dan persistence flush

### Batch 1C — State and persistence layer reset

#### `src/services/persistenceService.ts`
- dibangun ulang sebagai gateway tunggal untuk runtime state, settings, health, orders, positions, trades, journal, history, anomaly, dan pattern logs
- ditambahkan helper default factory:
  - `createDefaultRuntimeState()`
  - `createDefaultSettings()`
  - `createDefaultHealth()`
- persistence disatukan dengan `JsonStore` dan `JsonLinesStore`
- ditambahkan helper snapshot untuk hotlist, opportunity, dan backtest log

#### `src/services/stateService.ts`
- dibangun ulang untuk memegang `RuntimeState` in-memory secara bersih
- ditambahkan operasi state utama seperti `setStatus`, `setTradingMode`, `setEmergencyStop`, `setPairCooldown`, `markPairSeen`, `setSignals`, `setHotlist`, `setOpportunities`
- bentuk state lama yang tidak sinkron dihapus

#### `src/services/healthService.ts`
- dibangun ulang untuk membangun `HealthSnapshot` dari state baru
- health dihitung berdasarkan runtime status, scanner status, Telegram status, trading status, jumlah pair aktif, open positions, pending orders, dan worker status
- tidak lagi bergantung pada type lama yang tidak valid

#### `src/services/journalService.ts`
- dibangun ulang sebagai event journal umum, bukan trade log saja
- mendukung event `INFO`, `WARN`, `ERROR`, `SIGNAL`, `TRADE`, `POSITION`, `SYSTEM`, `BACKTEST`
- ditambahkan helper `load`, `list`, `recent`, `append`, `info`, `warn`, `error`

#### `src/domain/settings/settingsService.ts`
- dibangun ulang agar sinkron dengan `BotSettings` baru
- ditambahkan operasi granular seperti `setTradingMode`, `patchRisk`, `patchStrategy`, `patchScanner`, `patchWorkers`, `patchBacktest`, `setUiOnly`, `setDryRun`, `setPaperTrade`
- penggunaan `Partial` lama yang rusak dihilangkan

### Batch 1D — Telegram contract reset

#### `src/integrations/telegram/auth.ts`
- dibangun ulang agar sinkron dengan `env.telegramAllowedUserIds`
- ditambahkan helper `isTelegramUserAllowed()` dan `denyTelegramAccess()`

#### `src/integrations/telegram/callbackRouter.ts`
- dibangun ulang dengan callback payload terstruktur
- ditambahkan namespace callback: `NAV`, `ACC`, `SET`, `SIG`, `BUY`, `POS`, `EMG`, `BKT`
- ditambahkan helper `buildCallback()` dan `parseCallback()`

#### `src/integrations/telegram/keyboards.ts`
- dibangun ulang agar seluruh keyboard konsisten dengan UX final bot
- menu utama Telegram berbasis tombol ditegaskan sebagai UI utama
- ditambahkan keyboard untuk main menu, emergency controls, accounts, trading mode, hotlist, dan positions
- dependency type lama diganti ke type baru seperti `HotlistEntry`, `PositionRecord`, dan `TradingMode`

#### `src/integrations/telegram/uploadHandler.ts`
- flow upload akun legacy JSON dipertahankan
- ditambahkan validasi file `.json`
- file Telegram diunduh dan diparse dengan aman
- hasil disimpan ke `data/accounts/accounts.json` lewat `AccountStore`
- registry di-reload setelah upload sukses

#### `src/integrations/telegram/handlers.ts`
- dibangun ulang agar sinkron dengan service layer baru
- flow utama Telegram disatukan untuk start bot, stop bot, status, market watch, hotlist, positions, orders, manual buy, manual sell, strategy settings, risk settings, accounts, logs, dan emergency controls
- callback handling dibuat konsisten untuk upload accounts, reload accounts, ubah trading mode, detail signal, pilih manual buy pair, partial/manual sell position, emergency mode, cancel all orders, dan sell all positions
- ditambahkan user flow state internal untuk pending upload JSON dan pending manual buy pair
- dependency terhadap method lama yang sudah tidak ada dihapus

#### `src/integrations/telegram/bot.ts`
- dibangun ulang sebagai wrapper Telegram yang lebih bersih
- dependensi Telegram disatukan melalui `TelegramBotDeps`
- `registerHandlers()` dihubungkan dengan `UploadHandler`
- start/stop bot diselaraskan dengan contract baru

---

## 4. Kontrak final penting yang sudah diputuskan

Hal-hal ini sudah diputuskan sebagai arah final dan harus dipertahankan pada sesi lanjutannya:
- Telegram **button UI** tetap menjadi UI utama
- whitelist user tetap berbasis `TELEGRAM_ALLOWED_USER_IDS`
- legacy upload account tetap diterima dalam format:
  ```json
  [
    { "name": "REY", "apiKey": "ISI_API_KEY", "apiSecret": "ISI_API_SECRET" }
  ]
  ```
- storage akun runtime tetap di:
  `data/accounts/accounts.json`
- trading mode tetap:
  `OFF | ALERT_ONLY | SEMI_AUTO | FULL_AUTO`
- arsitektur bergerak menuju:
  **scanner → signal → intelligence → execution**
- target akhir bot tetap:
  **mesin intelijen market Indodax yang membaca jejak bandar, memisahkan peluang asli dari jebakan, lalu mengubahnya menjadi keputusan trading yang bisa dijalankan**

---

## 5. Belum dikerjakan pada sesi ini

Bagian berikut **belum direfactor di sesi ini**:
- `src/services/reportService.ts`
- `src/domain/accounts/accountStore.ts`
- `src/domain/accounts/accountRegistry.ts`
- `src/domain/accounts/accountValidator.ts` sanity pass
- `src/integrations/http/httpClient.ts`
- `src/integrations/indodax/*`
- `src/domain/market/*`
- `src/domain/trading/*`
- `src/app.ts`
- `src/bootstrap.ts`
- seluruh layer intelligence baru
- worker runtime
- backtest engine
- final README dan `.env.example`

---

## 6. Titik lanjut paling logis untuk sesi berikutnya

Urutan paling aman setelah progres sesi ini:
1. `src/services/reportService.ts`
2. `src/domain/accounts/accountStore.ts`
3. `src/domain/accounts/accountRegistry.ts`
4. `src/domain/accounts/accountValidator.ts` sanity pass
5. `src/app.ts`
6. `src/bootstrap.ts`

Setelah itu baru lanjut ke:
- `src/integrations/http/httpClient.ts`
- `src/integrations/indodax/*`
- `src/domain/market/*`
- `src/domain/trading/*`

Lalu batch berikutnya:
- intelligence engine
- historical context
- worker runtime
- backtest engine

---

## 7. Ringkasan singkat satu paragraf
Pada sesi ini, refactor yang berhasil disusun sampai tuntas baru mencakup fondasi kontrak inti, runtime core, persistence/state/settings/health/journal, dan reset kontrak Telegram. Semua perubahan sudah dijabarkan sebagai replacement draft final per file, tetapi belum diterapkan langsung ke repo GitHub. Sesi berikutnya paling logis melanjutkan `reportService`, layer accounts, lalu `app.ts` dan `bootstrap.ts` agar wiring utama bot mulai sinkron dengan fondasi baru.
