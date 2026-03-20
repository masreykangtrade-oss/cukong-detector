# PRD

## Original Problem Statement
Gunakan repository ini sebagai sumber kebenaran utama dan selesaikan migrasi history/recovery Indodax agar jalur execution/recovery tidak lagi parsial. Fokus: order history canonical ke GET /api/v2/order/histories, trade history canonical ke GET /api/v2/myTrades, hapus fallback runtime utama ke legacy orderHistory/tradeHistory, implementasikan windowed search <=7 hari dengan chunked lookup deterministik, pertahankan method resmi lain seperti trade/openOrders/getOrder/cancelOrder di /tapi.

## Architecture Decisions
- Runtime history/recovery default sekarang V2-only; INDODAX_HISTORY_MODE=legacy tetap ada hanya sebagai jalur eksplisit/manual.
- order history recovery memakai explicit startTime/endTime dengan bounded window search <=7 hari dan chunked lookup deterministik.
- trade history recovery memakai myTradesV2 dengan symbol + orderId; method resmi lain tetap di /tapi sesuai docs resmi.

## Implemented
- PrivateApi V2 wrapper diselaraskan ke docs resmi: orderHistoriesV2 tanpa orderId, myTradesV2 dengan orderId, normalizer payload resmi V2.
- ExecutionEngine sekarang canonical ke V2 untuk history/recovery runtime utama tanpa fallback ke legacy orderHistory/tradeHistory.
- Probe/test diperbarui untuk >24 jam, >7 hari chunked lookup, callback reconcile, dan runtime hardening; lint/build/probes lulus.
- README, REFACTOR_LOG, dan SESSION_CONTEXT_NEXT disinkronkan ke source aktual.

## Prioritized Backlog
### P0
- Verifikasi deploy/runtime publik agar domain aktif benar-benar mengarah ke runtime repo ini.
### P1
- Pecah executionEngine.ts menjadi modul sync/recovery lebih kecil untuk menurunkan risiko regresi.
### P2
- Tambah smoke test bootstrap penuh app start -> health -> callback -> recovery dalam satu skenario.

## Next Tasks
- Pertahankan probe V2 history sebagai release gate.
- Lanjut ke verifikasi runtime publik atau refactor modular execution engine jika dibutuhkan.
