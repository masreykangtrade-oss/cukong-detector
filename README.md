# Mafiamarkets Refactor TIGA

Backend TypeScript untuk bot intelijen market Indodax dengan UI operasional utama di Telegram.

## Status aktual repo

Repo ini sudah memakai alur runtime berikut:

`tickers + depth -> MarketWatcher -> SignalEngine -> intelligence pipeline -> OpportunityAssessment -> Hotlist -> ExecutionEngine`

Yang sudah aktif end-to-end:

- scanner market + hotlist berbasis opportunity
- intelligence pipeline (microstructure, history, probability, edge validation, entry timing)
- worker runtime untuk feature/pattern/backtest
- backtest replay dari pair-history JSONL
- live execution hardening baseline (openOrders-first sync, getOrder -> orderHistory/tradeHistory fallback, duplicate guard, aggressive BUY, TP default 15%)
- execution summary dan trade outcome summary ke Telegram/journal/log/persistence

## Fitur execution summary & trade outcome summary

### Execution summary

Event berikut sekarang menghasilkan summary yang konsisten:

- BUY submitted
- BUY partially filled
- BUY filled
- BUY canceled / failed
- SELL submitted
- SELL partially filled
- SELL filled
- SELL canceled / failed

Channel minimum yang aktif:

- Telegram broadcast ke `TELEGRAM_ALLOWED_USER_IDS`
- journal JSONL
- log operasional pino
- persistence JSONL khusus summary

File persistence summary:

- `data/history/execution-summaries.jsonl`
- `data/history/trade-outcomes.jsonl`

### Trade outcome summary

Trade outcome summary final hanya ditulis ketika posisi benar-benar `CLOSED`.

Semantik akurasi yang dipakai:

- `SIMULATED`
- `OPTIMISTIC_LIVE`
- `PARTIAL_LIVE`
- `CONFIRMED_LIVE`

Catatan penting:

- `CONFIRMED_LIVE` dipakai saat detail reconciliation exchange cukup kuat untuk event tersebut.
- jika fee / executed trade detail belum final, summary tetap ditulis jujur sebagai `OPTIMISTIC_LIVE` atau `PARTIAL_LIVE`.
- auto-buy dan auto-sell sekarang skip deterministik bila order aktif sejenis masih ada, supaya restart/loop monitor tidak memicu duplicate submit.

## Struktur repo penting

```text
src/
  app.ts
  bootstrap.ts
  config/
  core/
  domain/
    accounts/
    backtest/
    history/
    intelligence/
    market/
    microstructure/
    settings/
    signals/
    trading/
  integrations/
    indodax/
    telegram/
  services/
  storage/
  workers/
tests/
REFACTOR_LOG.md
SESSION_CONTEXT_NEXT.md
mafiamarkets-blueprint.md
```

## Environment

Salin nilai dari `.env.example` ke `.env` lalu isi token/kredensial yang benar.

Variabel paling penting:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USER_IDS`
- `DATA_DIR`
- `LOG_DIR`
- `TEMP_DIR`
- `INDODAX_PUBLIC_BASE_URL`
- `INDODAX_PRIVATE_BASE_URL`

## Perintah utama

```bash
yarn install
yarn lint
yarn build
yarn dev
```

## Probe / regression penting

```bash
TELEGRAM_BOT_TOKEN=testtoken TELEGRAM_ALLOWED_USER_IDS=1 DATA_DIR=/tmp/mafiamarkets-audit-regression LOG_DIR=/tmp/mafiamarkets-audit-regression/logs TEMP_DIR=/tmp/mafiamarkets-audit-regression/tmp yarn tsx /app/tests/runtime_backend_regression.ts

TELEGRAM_BOT_TOKEN=testtoken TELEGRAM_ALLOWED_USER_IDS=1 DATA_DIR=/tmp/mafiamarkets-audit-timeout LOG_DIR=/tmp/mafiamarkets-audit-timeout/logs TEMP_DIR=/tmp/mafiamarkets-audit-timeout/tmp yarn tsx /app/tests/worker_timeout_probe.ts

TELEGRAM_BOT_TOKEN=testtoken TELEGRAM_ALLOWED_USER_IDS=1 DATA_DIR=/tmp/mafiamarkets-live-hardening-probe-self LOG_DIR=/tmp/mafiamarkets-live-hardening-probe-self/logs TEMP_DIR=/tmp/mafiamarkets-live-hardening-probe-self/tmp yarn tsx /app/tests/live_execution_hardening_probe.ts

TELEGRAM_BOT_TOKEN=testtoken TELEGRAM_ALLOWED_USER_IDS=1 DATA_DIR=/tmp/mafiamarkets-it6-failed-self LOG_DIR=/tmp/mafiamarkets-it6-failed-self/logs TEMP_DIR=/tmp/mafiamarkets-it6-failed-self/tmp yarn tsx /app/tests/execution_summary_failed_probe.ts
```

## Data runtime yang dihasilkan

- `data/accounts/accounts.json`
- `data/state/runtime-state.json`
- `data/state/orders.json`
- `data/state/positions.json`
- `data/state/trades.json`
- `data/state/journal.jsonl`
- `data/history/pair-history.jsonl`
- `data/history/anomaly-events.jsonl`
- `data/history/pattern-outcomes.jsonl`
- `data/history/execution-summaries.jsonl`
- `data/history/trade-outcomes.jsonl`
- `data/backtest/*.json`

## Catatan kejujuran status

- jalur broadcast summary ke Telegram sudah ada, tetapi delivery Telegram live belum divalidasi end-to-end pada sesi ini karena diminta skip
- `recentTrades` di market intelligence masih inferred dari delta volume lokal, belum native trade feed exchange
- reconciliation fee / weighted fill sudah memakai `tradeHistory` bila tersedia; fallback saat detail exchange tidak lengkap masih punya backlog lanjutan

Lihat `REFACTOR_LOG.md` untuk status final lengkap dan `SESSION_CONTEXT_NEXT.md` untuk handoff ringkas sesi berikutnya.
