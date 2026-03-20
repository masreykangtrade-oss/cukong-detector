# PRD

## Original Problem Statement
Gunakan repository source code aktual `masreykangtrade-oss/cukong-markets` sebagai sumber kebenaran utama. Target utama mengikuti `AUDIT_FORENSIK_PROMPT.md`, dengan aturan audit keras: audit ulang file load-bearing, implement patch produksi yang menutup gap target utama, jangan refactor di luar konteks, jalankan lint/build/probe relevan, sinkronkan README + dokumen audit/log/context ke kondisi source nyata, dan beri verdict live-test jujur. User mengizinkan live buy/sell nyata untuk validasi akhir, dengan syarat secret hanya dipakai saat runtime/test dan tidak pernah ditulis ke repo.

## Architecture Decisions
- Tetap mempertahankan arsitektur backend TypeScript Telegram-first yang sudah ada.
- Menambahkan pemisahan eksplisit `executionMode` LIVE vs SIMULATED tanpa membongkar flow existing.
- Jalur resmi perubahan mode eksekusi dipasang di Telegram Strategy Settings agar operator tidak perlu edit file manual.
- Verifikasi repo diresmikan lewat `tsconfig.probes.json`, `scripts/run-probes.mjs`, `yarn typecheck:probes`, `yarn test:probes`, dan `yarn verify`.
- Source of truth interval dirapikan: market scan memakai `settings.scanner.marketWatchIntervalMs`, polling runtime memakai `settings.scanner.pollingIntervalMs`.
- Menjaga callback runtime tetap pada contract `/indodax/callback`, dan menambah probe end-to-end `order_id/orderId/id -> reconcileFromCallback()`.

## What's Implemented
- `executionMode` kini tampil di `/healthz`, Telegram status, dan log startup.
- Telegram Strategy Settings sekarang punya kontrol resmi `Execution Simulated` dan `Execution Live`.
- `PollingService.activeJobs` diperbaiki agar hanya menghitung job aktif.
- `manualOrder()` BUY sekarang menolak request tanpa `price` valid.
- Renderer nginx kini sinkron ke artifact `deploy/nginx/cukong-markets.nginx.conf`.
- `.env.example` ditambahkan dan disinkronkan dengan kontrak env source.
- Script resmi repo ditambahkan: `typecheck:probes`, `test:probes`, `verify`.
- Probe baru `tests/callback_reconciliation_probe.ts` membuktikan callback reconciliation end-to-end.
- README, REFACTOR_LOG, SESSION_CONTEXT_NEXT, dan AUDIT_FORENSIK_PROMPT disinkronkan ke kondisi source + validasi nyata.
- Live exchange self-test berhasil: round-trip BUY lalu SELL `xrp_idr` via `ExecutionEngine` selesai `CONFIRMED_LIVE`.

## Prioritized Backlog
### P0
- Sinkronkan ingress/runtime publik agar `https://kangtrade.top/healthz` mengembalikan health JSON repo ini.
- Sinkronkan route publik `POST /indodax/callback` agar benar-benar menuju callback server repo ini.

### P1
- Tambahkan satu smoke test terpadu bootstrap -> app start -> `/healthz` -> callback -> recovery -> status report.
- Pecah `ExecutionEngine` menjadi modul lebih kecil untuk menurunkan risiko regresi.

### P2
- Setelah ingress publik sinkron, audit ulang live-readiness end-to-end termasuk callback publik dan Telegram operasional live.
- Evaluasi penyederhanaan compatibility layer legacy `/tapi` + V2 setelah jalur live publik stabil.

## Next Tasks
1. Deploy artifact nginx terbaru dan sinkronkan route publik.
2. Re-run smoke publik `/healthz` dan `POST /indodax/callback`.
3. Tambahkan smoke test terpadu satu paket.
4. Lanjut modularisasi `ExecutionEngine` bila scope berikutnya fokus maintainability.
