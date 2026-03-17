# PRD

## Original Problem Statement
Gunakan implementasi aktual repo `mafiamarkets-refactor-dua`, `REFACTOR_LOG.md`, `SESSION_CONTEXT_NEXT.md`, dan `mafiamarkets-blueprint.md` sebagai sumber kebenaran utama. Audit seluruh struktur repo dan file relevan dengan fokus logic inti, flow trading, state, persistence, Telegram flow, execution flow, dan keterhubungan modul. Tambahkan execution summary untuk event order penting (BUY/SELL submitted, partially filled, filled, canceled/failed) dan trade outcome summary final saat posisi benar-benar closed. Summary wajib tersedia minimal melalui Telegram notification/message, journal/persistence, dan log operasional. Jangan overclaim confirmed pnl jika fee/executed detail belum final; bedakan optimistic-live vs confirmed-live; sinkronkan REFACTOR_LOG.md dan SESSION_CONTEXT_NEXT.md; setelah status P0 execution hardening sinkron, finalisasi README.md dan .env.example.

## Architecture Decisions
- Pertahankan arsitektur utama: `scanner -> signal -> intelligence -> execution`
- Pertahankan Telegram button UI sebagai UI operasional utama
- Tambah `SummaryService` sebagai lapisan observability operasional untuk persistence + journal + logger + Telegram broadcast
- Tambah persistence JSONL khusus summary: `execution-summaries.jsonl` dan `trade-outcomes.jsonl`
- Perluas `OrderRecord` dengan `referencePrice` dan `closeReason`
- Perluas `PositionRecord` dengan lifecycle fields yang cukup untuk summary final: `totalBoughtQuantity`, `totalSoldQuantity`, `averageExitPrice`, `totalEntryFeesPaid`
- Pertahankan BUY aggressive limit, openOrders-first reconciliation, getOrder fallback, duplicate guard, dan TP default 15%

## What's Implemented
- Audit repo + sinkronisasi status aktual terhadap blueprint dan dokumen progres
- Execution summary aktif untuk BUY/SELL submitted, partially filled, filled, canceled, failed
- Trade outcome summary final aktif hanya saat posisi benar-benar `CLOSED`
- Summary dikirim ke persistence JSONL, journal JSONL, logger operasional, dan jalur Telegram broadcast
- Akurasi summary dibedakan jujur: `SIMULATED`, `OPTIMISTIC_LIVE`, `PARTIAL_LIVE`, `CONFIRMED_LIVE`
- README.md dan .env.example difinalisasi berdasarkan implementasi terbaru
- Regression probes lulus: runtime, worker timeout, live execution hardening, failed summary path
- REFACTOR_LOG.md dan SESSION_CONTEXT_NEXT.md dibersihkan dan disinkronkan ulang

## Prioritized Backlog
### P0
- Recovery restart live order untuk edge-case partial fill / cancel / close saat detail exchange parsial
- Fallback accounting ketika detail fee / executed trade exchange tidak lengkap
- Verifikasi sumber trade exchange resmi tambahan bila dokumentasi resmi berubah

### P1
- Pindahkan pattern matching live path ke worker runtime bila perlu offload konsisten
- Upgrade `recentTrades` dari inferred flow ke native trade print bila ada sumber valid
- Pecah `executionEngine.ts` menjadi modul lebih kecil tanpa mengubah perilaku inti

### P2
- Validasi end-to-end Telegram live delivery saat kredensial/live validation diizinkan
- Tambahan runbook operasional bila diperlukan di luar README dasar

## Next Tasks
1. Hardening recovery restart untuk kasus live order parsial/terminal yang lebih sulit
2. Perkuat fallback accounting saat detail trade exchange tidak lengkap
3. Setelah P0 lebih matang, modularisasi `executionEngine.ts` untuk menurunkan risiko regresi
