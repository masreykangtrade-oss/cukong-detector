# PRD - Hardening Execution/Recovery, Observability, dan Safety

## Original Problem Statement
Audit dan implementasikan hardening nyata untuk execution/recovery Indodax, observability production debugging, worker/runtime path correctness, trading safety & correctness, retry/error flow agar tidak berbahaya di kondisi gagal parsial, rate limiting/resilience yang memang diperlukan, serta docs truthfulness agar sinkron dengan source aktual.

## Architecture Decisions
- Source code runtime tetap sumber kebenaran utama
- Pertahankan arsitektur existing; fokus hardening correctness, startup reliability, recovery completeness, dan docs sync
- GET-only retry aman untuk endpoint public/private read path; POST trading/cancel tetap non-retry agar tidak memicu duplicate live orders
- Jalur live-submit ambigu diperlakukan sebagai `submission_uncertain`, bukan langsung rejected
- Reconcile `submission_uncertain` dilakukan non-destruktif via `openOrders` lalu history search bila match unik tersedia
- Order `submission_uncertain` tanpa `exchangeOrderId` tidak boleh di-local-cancel secara membabi buta

## What's Implemented
- `src/domain/trading/executionEngine.ts`
  - hardening `submission_uncertain` untuk transport timeout/network failure
  - reconcile otomatis via `openOrders`/history untuk match unik
  - recovery startup dan sync aktif sekarang ikut memproses order `submission_uncertain`
  - `cancelAllOrders()` skip unsafe local cancel untuk order uncertain tanpa `exchangeOrderId`
- `src/integrations/indodax/publicApi.ts`
  - retry aman sekali untuk GET retriable failures
- `src/integrations/indodax/privateApi.ts`
  - retry aman sekali untuk GET V2 retriable failures
  - POST trading/cancel tetap tanpa retry
- Probe resmi ditambah:
  - `tests/live_submission_uncertain_probe.ts`
  - `tests/cancel_submission_uncertain_probe.ts`
- `scripts/run-probes.mjs` diperbarui agar dua safety gate baru masuk suite resmi
- Docs diperbarui: `README.md`, `REFACTOR_LOG.md`, `SESSION_CONTEXT_NEXT.md`, `AUDIT_FORENSIK_PROMPT.md`, dan sinkronisasi `test_reports/iteration_15.json`

## Validation Actually Run
- `yarn lint`
- `yarn build`
- `yarn typecheck:probes`
- `yarn test:probes`
- testing agent reports:
  - `/app/test_reports/iteration_14.json`
  - `/app/test_reports/iteration_15.json`

## Prioritized Backlog
### P0
- Real non-destructive exchange shadow validation untuk membuktikan perilaku `submission_uncertain` terhadap exchange nyata
- Pecah `ExecutionEngine` agar submit/reconcile/cancel/recovery tidak menumpuk di satu file sangat besar

### P1
- Tambah probe spesifik untuk retry GET terhadap 429/5xx agar resilience policy juga dibuktikan eksplisit
- Tambah telemetry/journal yang lebih ringkas untuk unresolved `submission_uncertain`

### P2
- Evaluasi limiter eksplisit berbasis quota jika beban API naik di atas pola serial saat ini

## Next Tasks
- Fokus terbaik berikutnya: validasi exchange non-destruktif/shadow-run dan modularisasi `ExecutionEngine` supaya repo bisa bergerak dari SIAP DEPLOY menuju live readiness yang lebih bisa dibuktikan.
