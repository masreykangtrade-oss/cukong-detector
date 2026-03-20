Next focus yang relevan:
1) selaraskan deploy/infrastructure agar domain publik benar-benar memakai runtime repo ini
2) tambah probe integrasi bootstrap penuh yang menyatukan app start → /healthz → callback → recovery → status report sebagai satu smoke test
3) bila perlu, sederhanakan compatibility layer legacy + V2 setelah jalur live publik benar-benar stabil

TUJUAN UTAMA:
Lakukan implementasi nyata agar jalur execution/recovery TIDAK LAGI PARSIAL dalam konteks migrasi history/recovery Indodax.

DEFINISI "TIDAK PARSIAL" YANG DIMAKSUD:
- Recovery dan reconciliation order/fill/history TIDAK BOLEH lagi hybrid legacy + V2.
- Untuk kebutuhan history/recovery:
  - order history HARUS memakai GET /api/v2/order/histories
  - trade history HARUS memakai GET /api/v2/myTrades
- Runtime path untuk history/recovery tidak boleh fallback lagi ke legacy orderHistory / tradeHistory.
- Jangan overclaim migrasi penuh seluruh private API bila docs resmi belum mendukung itu.

BATASAN WAJIB:
1. JANGAN refactor besar yang tidak perlu.
2. JANGAN ubah Telegram UX/menu yang sudah ada kecuali diperlukan untuk wiring status/config.
3. JANGAN hapus method private API legacy lain yang masih resmi dan masih dipakai sah menurut docs, seperti:
   - trade
   - openOrders
   - getOrder
   - cancelOrder
   Kecuali kamu menemukan bukti resmi yang lebih baru di docs bahwa method itu juga harus dipindahkan.
4. Fokuskan migrasi hanya pada jalur history/recovery/reconcile agar verdict parsial bisa hilang secara jujur.
5. Jangan memberi klaim “full V2 migration” untuk seluruh stack trading jika yang selesai hanya history/recovery.
6. Gunakan source repo aktual dan docs resmi sebagai sumber kebenaran. Jangan mengada-ada endpoint yang tidak ada di docs.

FAKTA RESMI YANG WAJIB DIIKUTI:
- orderHistory legacy dipindah ke GET /api/v2/order/histories
- tradeHistory legacy dipindah ke GET /api/v2/myTrades
- docs resmi V2 order history mendukung parameter:
  symbol, startTime, endTime, limit, sort
- docs resmi V2 trade history mendukung parameter:
  symbol, orderId, startTime, endTime, limit, sort
- default range V2 adalah 24 jam terakhir bila startTime/endTime tidak dikirim
- maksimum range per request adalah 7 hari

AUDIT MASALAH NYATA YANG HARUS KAMU VERIFIKASI DAN PERBAIKI:
1. ExecutionEngine saat ini masih partial karena recovery memelihara compatibility legacy + V2.
2. orderHistoriesV2 di repo harus dipastikan dipakai sebagai jalur canonical untuk order history recovery.
3. Jangan andalkan query default 24 jam untuk recovery order history.
4. Karena docs V2 order history TIDAK mendukung orderId filter sebagai parameter resmi, implementasikan strategi pencarian yang benar:
   - gunakan symbol wajib
   - gunakan startTime/endTime windowed search
   - lakukan pencarian bertahap per chunk <= 7 hari
   - cocokkan hasil berdasarkan order.exchangeOrderId / clientOrderId / timestamp / pair secara deterministik
5. myTradesV2 boleh memakai symbol + orderId bila tersedia, sesuai docs.
6. Semua fallback runtime ke legacy tradeHistory / orderHistory harus dihapus dari execution/recovery path utama.
7. Mode history env tidak boleh lagi membuat runtime utama hybrid. Jika perlu:
   - jadikan v2_only sebagai mode default/final
   - atau hilangkan branching legacy dari runtime path production
   - tetapi jangan sampai merusak backward compatibility yang tidak relevan dengan history migration

SELALU CEK SEMUA FILE YANG WAJIB DIAUDIT DAN DIPERBAIKI:

HASIL IMPLEMENTASI YANG WAJIB ADA:
A. Private API wrapper
- orderHistoriesV2 harus mengikuti docs resmi V2 secara ketat
- myTradesV2 harus mengikuti docs resmi V2 secara ketat
- signing/header/query untuk V2 harus tetap benar
- normalizer response harus kompatibel dengan payload resmi V2 tanpa menebak-nebak field yang tidak perlu

B. Execution / recovery
- loadTradeStats harus canonical ke V2
- loadOrderHistorySnapshot harus canonical ke V2
- fallback legacy history harus dihapus dari jalur runtime utama
- reconcile startup, sync live order, callback-triggered reconcile, dan post-restart recovery harus tetap jalan
- partial fill, weighted average fill, fee, dan position updates tetap benar

C. Windowed search yang benar untuk order history V2
- jangan query order history V2 hanya dengan symbol + limit lalu berharap order lama ketemu
- implementasikan pencarian berbasis waktu dari sekitar submit_time / createdAt order lokal
- bila waktu pasti tidak tersedia, gunakan fallback pencarian bertahap yang bounded dan deterministic
- setiap request maksimum 7 hari sesuai docs
- hentikan pencarian saat order target sudah ditemukan
- beri logging/journal yang jelas bila order tetap tidak ditemukan

D. Konfigurasi
- ubah default agar runtime tidak lagi hybrid legacy+V2 untuk history
- bila env INDODAX_HISTORY_MODE masih dipertahankan, pastikan:
  - default final adalah non-partial
  - mode legacy tidak lagi jadi jalur normal yang diandalkan
  - dokumentasi menjelaskan status sebenarnya dengan jujur

E. Dokumentasi
- Perbarui README.md dan dokumen terkait agar sinkron dengan source code terbaru. Source code tetap sumber kebenaran utama; dokumen hanya boleh merefleksikan kondisi source yang nyata.
- Perbarui dan bersihkan `AUDIT_FORENSIK_PROMPT.md`, `REFACTOR_LOG.md`, dan `SESSION_CONTEXT_NEXT.md` secara terarah agar sinkron dengan hasil kerja nyata dan mudah dijadikan acuan sesi berikutnya.
- JANGAN menambahkan isi baru di atas isi lama yang bertabrakan; sinkronkan setiap dokumen agar tetap konsisten dan mudah dipakai pada sesi selanjutnya.
- Acuan perbaikan sesi berikutnya harus terutama disinkronkan ke `REFACTOR_LOG.md` dan `SESSION_CONTEXT_NEXT.md`. `AUDIT_FORENSIK_PROMPT.md` harus tetap dijaga sebagai target/checklist utama, bukan dump catatan sesi.
- Perbarui `cukong-markets-blueprint.md` hanya jika memang perlu, agar tidak overclaim dan tetap jujur.
- Jangan mengubah dokumen hanya demi kosmetik. Semua perubahan dokumen harus jujur, faktual, dan sinkron dengan tindakan serta hasil implementasi nyata.
- jelaskan secara eksplisit bahwa:
  - migrasi yang diselesaikan adalah history/recovery ke V2
  - method lain seperti trade/openOrders/getOrder/cancelOrder masih tetap memakai jalur resmi yang masih didokumentasikan

F. Test / probe
Tambahkan atau perbaiki test/probe yang membuktikan:
- recovery order history V2 bekerja untuk order > 24 jam
- recovery order history V2 tetap bekerja untuk order > 7 hari melalui chunked lookup
- myTradesV2 + orderId dipakai benar
- startup recovery tidak lagi membutuhkan legacy orderHistory/tradeHistory
- callback reconcile tetap hidup
- compile/build/probe lulus

ATURAN EKSEKUSI:
- Audit keras source aktual dulu.
- Langsung implementasikan perbaikan nyata.
- Jangan berhenti di analisis.
- Jangan minta konfirmasi lanjutan.
- Jangan membuat placeholder atau TODO.
- Jangan meninggalkan jalur setengah jadi.
- Bila ada mismatch antara source dan docs, ikuti docs resmi dan perbaiki source.
- Bila ada area yang tidak bisa dimigrasikan penuh karena docs resmi belum menyediakan endpoint pengganti, tulis jujur dan JANGAN memaksa migrasi palsu.

FORMAT OUTPUT YANG SAYA MAU:
1. Audit singkat tapi tegas: kenapa sebelumnya masih parsial.
2. File apa saja yang diubah dan kenapa.
3. Implementasi apa yang benar-benar diselesaikan.
4. Bukti bahwa recovery/history sekarang non-parsial.
5. Hal apa yang memang masih tetap memakai /tapi dan kenapa itu masih benar menurut docs resmi.
6. Verdict final tegas salah satu:
   - NON-PARSIAL UNTUK HISTORY/RECOVERY DAN SIAP DIPAKAI
   - MASIH PARSIAL
