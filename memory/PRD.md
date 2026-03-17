# PRD

## Original Problem Statement
Gunakan informasi repo GitHub mafiamarkets-refactor-dua, REFACTOR_LOG.md, SESSION_CONTEXT_NEXT.md, dan mafiamarkets-blueprint.md sebagai konteks utama dan sumber kebenaran. Audit seluruh struktur repository dan setiap file yang relevan, prioritaskan logic inti, alur trading, state, persistence, telegram flow, execution flow, dan keterhubungan antar modul. Jika ada mismatch antara implementasi repo, REFACTOR_LOG.md, SESSION_CONTEXT_NEXT.md, dan blueprint, utamakan implementasi aktual repo + blueprint lalu revisi dokumennya agar konsisten. Bersihkan REFACTOR_LOG.md menjadi satu log final yang akurat dan sinkronkan SESSION_CONTEXT_NEXT.md terhadapnya.

## Architecture Decisions
- Mempertahankan arsitektur final `scanner -> signal -> intelligence -> execution` dengan `src/app.ts` sebagai wiring utama runtime.
- Menetapkan `SignalCandidate` sebagai output baseline scoring dan `OpportunityAssessment` sebagai contract final sebelum execution.
- Mempertahankan Telegram button UI, whitelist `TELEGRAM_ALLOWED_USER_IDS`, format legacy upload account JSON, storage account di `data/accounts/accounts.json`, dan mode trading `OFF | ALERT_ONLY | SEMI_AUTO | FULL_AUTO`.
- Menjaga persistence berbasis JSON/JSONL untuk state, orders, positions, trades, journal, pair history, anomaly events, pattern outcomes, dan backtest results.
- Mempertahankan worker runtime untuk feature/pattern/backtest dan backtest replay berbasis pair-history JSONL.

## What Has Been Implemented
- Audit repo inti selesai pada layer core, services, market, signals, intelligence, history, microstructure, trading, telegram, workers, backtest, tests, dan dokumen root.
- `REFACTOR_LOG.md` dibersihkan menjadi log final yang akurat berdasarkan implementasi aktual repo, bukan status draft lama.
- `SESSION_CONTEXT_NEXT.md` diperbarui agar sinkron penuh dengan `REFACTOR_LOG.md`.
- Penyelarasan kecil implementasi dilakukan pada market/Indodax path:
  - `PairUniverse` sekarang membawa `high24h` / `low24h` dari ticker exchange.
  - `MarketWatcher` memakai nilai 24h tersebut untuk snapshot aktif.
  - `IndodaxClient` sekarang mengambil base URL public/private dari `env`.
- Status validasi terbaru sudah diverifikasi:
  - `yarn lint` lulus
  - `yarn build` lulus
  - `tests/runtime_backend_regression.ts` lulus
  - `tests/worker_timeout_probe.ts` lulus

## Prioritized Backlog
### P0
- Hardening live Indodax execution end-to-end.
- Response mapping live order, fill / partial fill semantics, dan cancel lifecycle exchange.
- Sinkronisasi runtime order/position state dengan state order exchange.
- Live sell path yang benar-benar terhubung ke exchange.

### P1
- Pindahkan pattern matching pada live path ke worker runtime bila dibutuhkan untuk konsistensi offload CPU.
- Bedakan simulated vs optimistic-live vs confirmed-live execution outcome dengan lebih eksplisit.
- Upgrade trade-flow dari inferred flow ke native trade stream jika sumber data memungkinkan.

### P2
- Finalisasi README root.
- Finalisasi `.env.example`.
- Rapikan runbook onboarding dan dokumentasi operasional harian.

## Next Tasks
1. Kerjakan hardening live execution Indodax terlebih dahulu.
2. Setelah itu finalisasi README dan `.env.example` sesuai contract aktif.
3. Baru lanjut ke pengayaan intelligence/Telegram bila memang diperlukan.
