# SESSION_CONTEXT_NEXT.md

## Repo
`https://github.com/masreykangtrade-oss/mafiamarkets`

## Status sesi sebelumnya
Refactor yang **sudah dibahas dan ditulis draft replacement-nya**:
- Batch 1A: `src/config/env.ts`, `src/core/types.ts`
- Batch 1B: `src/storage/jsonStore.ts`, `src/core/logger.ts`, `src/core/scheduler.ts`, `src/core/shutdown.ts`
- Batch 1C: `src/services/persistenceService.ts`, `src/services/stateService.ts`, `src/services/healthService.ts`, `src/services/journalService.ts`, `src/domain/settings/settingsService.ts`
- Batch 1D: `src/integrations/telegram/auth.ts`, `src/integrations/telegram/callbackRouter.ts`, `src/integrations/telegram/keyboards.ts`, `src/integrations/telegram/uploadHandler.ts`, `src/integrations/telegram/handlers.ts`, `src/integrations/telegram/bot.ts`

## Status penting
Perubahan di atas:
- **sudah dirancang**
- **sudah ditulis replacement code di chat**
- **belum diterapkan langsung ke repo GitHub**

## Keputusan arsitektur yang sudah final
- Telegram **button UI** tetap jadi UI utama
- whitelist tetap pakai `TELEGRAM_ALLOWED_USER_IDS`
- legacy upload account JSON tetap dipertahankan
- runtime account file tetap di `data/accounts/accounts.json`
- trading mode tetap: `OFF | ALERT_ONLY | SEMI_AUTO | FULL_AUTO`
- pipeline target: `scanner -> signal -> intelligence -> execution`

## Fokus yang belum dikerjakan
- `src/services/reportService.ts`
- `src/domain/accounts/accountStore.ts`
- `src/domain/accounts/accountRegistry.ts`
- `src/domain/accounts/accountValidator.ts`
- `src/app.ts`
- `src/bootstrap.ts`
- seluruh layer Indodax, market, trading, intelligence, worker, backtest

## Langkah lanjut paling logis
1. refactor `reportService.ts`
2. sanity/refactor `accountStore.ts`
3. sanity/refactor `accountRegistry.ts`
4. sanity pass `accountValidator.ts`
5. refactor `app.ts`
6. refactor `bootstrap.ts`

## Catatan tujuan akhir
Target akhir tetap:
**mesin intelijen market Indodax yang membaca jejak bandar, memisahkan peluang asli dari jebakan, lalu mengubahnya menjadi keputusan trading yang bisa dijalankan**
