# PRD

## Original Problem Statement
Gunakan implementasi aktual repo `mafiamarkets-refactor-dua`, `REFACTOR_LOG.md`, `SESSION_CONTEXT_NEXT.md`, dan `mafiamarkets-blueprint.md` sebagai sumber kebenaran utama. Audit seluruh struktur repo dan file relevan dengan fokus logic inti, flow trading, state, persistence, Telegram flow, execution flow, dan keterhubungan modul. Tambahkan execution summary untuk event order penting dan trade outcome summary final, lalu lanjutkan prioritas P0 live execution hardening dengan fokus recovery restart live order edge-case dulu, kemudian fallback accounting saat detail trade exchange parsial/tidak lengkap. State order/position pasca restart harus aman, deterministik, dan tidak memicu duplicate submit / duplicate cancel / duplicate sell.

## Architecture Decisions
- Pertahankan arsitektur utama: `scanner -> signal -> intelligence -> execution`
- Pertahankan Telegram button UI sebagai UI operasional utama
- Gunakan `SummaryService` sebagai lapisan observability operasional untuk persistence + journal + logger + Telegram broadcast
- Tambah persistence JSONL khusus summary: `execution-summaries.jsonl` dan `trade-outcomes.jsonl`
- Perluas `OrderRecord` dengan `referencePrice` dan `closeReason`
- Perluas `PositionRecord` dengan lifecycle fields untuk summary final: `totalBoughtQuantity`, `totalSoldQuantity`, `averageExitPrice`, `totalEntryFeesPaid`
- Hardening recovery memakai urutan reconciliation: `openOrders -> getOrder -> orderHistory -> tradeHistory-derived snapshot`
- Auto-flow harus skip deterministik jika order aktif sejenis masih ada, bukan memaksa duplicate submit/sell

## What's Implemented
- Audit repo + sinkronisasi status aktual terhadap blueprint dan dokumen progres
- Execution summary aktif untuk BUY/SELL submitted, partially filled, filled, canceled, failed
- Trade outcome summary final aktif hanya saat posisi benar-benar `CLOSED`
- Summary dikirim ke persistence JSONL, journal JSONL, logger operasional, dan jalur Telegram broadcast
- Akurasi summary dibedakan jujur: `SIMULATED`, `OPTIMISTIC_LIVE`, `PARTIAL_LIVE`, `CONFIRMED_LIVE`
- Recovery restart live order diperkeras dengan fallback `orderHistory` dan snapshot berbasis `tradeHistory` saat `getOrder` gagal/tidak cukup
- `attemptAutoBuy()` skip deterministik saat BUY aktif sudah ada
- `evaluateOpenPositions()` skip deterministik saat posisi sudah punya SELL aktif
- `sellAllPositions()` sekarang melaporkan submitted vs skipped secara jujur
- README.md dan .env.example difinalisasi berdasarkan implementasi terbaru
- REFACTOR_LOG.md dan SESSION_CONTEXT_NEXT.md dibersihkan dan disinkronkan ulang
- Regression probes lulus: runtime, worker timeout, live execution hardening, failed summary path

## Prioritized Backlog
### P0
- Recovery restart live order untuk edge-case partial fill / cancel / close yang lebih sulit saat detail exchange parsial
- Fallback accounting ketika detail fee / executed trade exchange tidak lengkap penuh
- Verifikasi sumber trade exchange resmi tambahan bila dokumentasi resmi berubah

### P1
- Pindahkan pattern matching live path ke worker runtime bila perlu offload konsisten
- Upgrade `recentTrades` dari inferred flow ke native trade print bila ada sumber valid
- Pecah `executionEngine.ts` menjadi modul lebih kecil tanpa mengubah perilaku inti

### P2
- Validasi end-to-end Telegram live delivery saat kredensial/live validation diizinkan
- Tambahan runbook operasional di luar README dasar bila diperlukan

## Next Tasks
1. Perdalam recovery restart untuk kasus partial fill/cancel/close yang lebih ambigu
2. Perkuat fallback accounting saat fee/executed detail exchange parsial atau hilang
3. Setelah P0 lebih matang, modularisasi `executionEngine.ts` untuk menurunkan risiko regresi
