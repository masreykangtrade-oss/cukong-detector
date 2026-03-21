Gunakan repository source code aktual sebagai sumber kebenaran utama.

Repository project GitHub:
https://github.com/masreykangtrade-oss/cukong-markets

Dokumen implementasi target utama:
https://github.com/masreykangtrade-oss/cukong-markets/blob/main/AUDIT_FORENSIK_PROMPT.md

Dokumen referensi tambahan, bukan setara source code:
- https://github.com/masreykangtrade-oss/cukong-markets/blob/main/REFACTOR_LOG.md
- https://github.com/masreykangtrade-oss/cukong-markets/blob/main/SESSION_CONTEXT_NEXT.md
- https://github.com/masreykangtrade-oss/cukong-markets/blob/main/README.md
- https://github.com/masreykangtrade-oss/cukong-markets/blob/main/cukong-markets-blueprint.md

HIERARKI KEBENARAN WAJIB:
- Source code repo saat ini = sumber kebenaran utama
- AUDIT_FORENSIK_PROMPT.md = target audit/implementasi
- REFACTOR_LOG.md, SESSION_CONTEXT_NEXT.md, README.md, blueprint = referensi tambahan
- Jika dokumen bertentangan dengan source code aktual, menangkan source code

TUJUAN UTAMA:
Lakukan audit keras terhadap source code aktual lalu langsung implementasikan perbaikan nyata agar jalur startup, execution, recovery, observability, dan deploy-readiness repo ini tidak lagi parsial, khususnya dalam konteks migrasi history/recovery Indodax.

ATURAN WAJIB:
1. Audit source aktual dulu, lalu langsung implementasikan perbaikan yang memang diperlukan.
2. Jangan berhenti di analisis.
3. Jangan percaya README, catatan lama, atau klaim arsitektur jika bertentangan dengan source code aktual.
4. Source of truth utama adalah file yang benar-benar dipakai runtime saat ini.
5. Semua verdict harus berbasis wiring runtime nyata, bukan sekadar ada file/interface/helper.
6. Jangan lakukan refactor kosmetik besar jika tidak diperlukan untuk correctness, startup reliability, recovery completeness, atau deploy-readiness.
7. Jika menemukan mismatch docs vs source, perbaiki docs agar jujur mengikuti executable truth.
8. Jangan menganggap masalah deploy VPS sebagai bug source kecuali memang ada akar masalah di repo.

KONTEKS TEMUAN YANG SUDAH ADA:
- Pada VPS sempat muncul error bootstrap saat menjalankan build production.
- Sebelumnya sempat ada masalah dependency runtime belum lengkap.
- Setelah dependency terpasang dan build berjalan, app masih gagal bootstrap tetapi logging startup hanya menampilkan error yang tidak informatif, sehingga root cause asli tertutup.
- Karena itu, observability startup/error handling bootstrap saat ini dianggap belum cukup baik untuk production debugging.
- Fokus audit harus membedakan dengan tegas:
  a. bug source code
  b. bug konfigurasi/deploy
  c. kelemahan observability
  d. mismatch dokumentasi

AREA PRIORITAS WAJIB DIAUDIT DAN DIPERBAIKI:
1. Startup/bootstrap path
   - audit src/bootstrap.ts, src/app.ts, config/env loading, dependency initialization
   - pastikan root cause startup error terlihat jelas di log production
   - jangan biarkan error bootstrap berakhir sebagai {} tanpa stack/cause yang berguna

2. Env contract & deploy-readiness
   - audit seluruh env wajib vs opsional
   - pastikan validasi env akurat, pesan error jelas, dan dokumentasi .env.example benar-benar ada, lengkap, dan sinkron
   - pastikan README setup env tidak bohong dan sesuai runtime truth

3. Execution/recovery Indodax
   - audit jalur order lifecycle, persistence, recovery state, history mode, callback/reconciliation flow
   - target utama: execution/recovery tidak lagi parsial
   - audit apakah migrasi history/recovery benar-benar lengkap, terutama pada startup/recovery setelah restart

4. Observability & production debugging
   - perbaiki logging agar error stack, cause, dan konteks penting terlihat
   - audit apakah logger/Pino sekarang menyembunyikan error object
   - tambahkan logging yang cukup untuk membedakan gagal di env validation, persistence init, port bind, callback server, recovery, Telegram launch, worker start, dan dependency init

5. Worker/runtime path correctness
   - audit worker thread path resolution
   - pastikan aman saat dijalankan dari hasil build production, bukan hanya dev mode

6. Trading safety & correctness
   - audit apakah entry price dari signal selalu tervalidasi sebelum execution
   - audit apakah error handling live trading masih parsial
   - audit retry/error flow agar tidak berbahaya di kondisi gagal parsial
   - audit risk guard yang penting agar order tidak lahir dari data invalid

7. Rate limiting / resilience
   - audit apakah ada rate limiting / throttling / concurrency guard yang memadai terhadap API yang dipakai
   - jika belum ada dan memang diperlukan untuk correctness/stability, implementasikan

8. Docs truthfulness
   - perbarui README.md dan dokumen terkait agar sinkron dengan source code terbaru
   - perbarui dan bersihkan AUDIT_FORENSIK_PROMPT.md, REFACTOR_LOG.md, dan SESSION_CONTEXT_NEXT.md secara terarah agar sinkron dengan hasil kerja nyata
   - jangan menambahkan isi baru di atas isi lama yang bertabrakan
   - sinkronkan dokumen agar tetap konsisten dan mudah dipakai pada sesi berikutnya
   - perbarui cukong-markets-blueprint.md hanya jika memang perlu, agar tidak overclaim dan tetap jujur

HAL YANG HARUS DIVERIFIKASI SECARA NYATA:
- build lolos
- lint lolos
- script verifikasi/probes yang memang ada di repo benar-benar jalan
- startup production path bisa memberikan error yang jelas bila gagal
- bila bootstrap gagal, log harus menunjuk akar masalah nyata, bukan hanya error kosong
- recovery path tidak parsial
- wiring execution/recovery benar-benar terhubung, bukan hanya blueprint

BATASAN KEAMANAN WAJIB:
- Jangan pernah print token, API key, secret, atau credential penuh
- Jangan commit secret ke repo
- Jangan taruh secret ke README, .env.example, log, atau output final
- Gunakan secret hanya dari environment runtime yang sudah tersedia
- Jangan meminta saya mengirim ulang secret plaintext
- Jangan lakukan order buy/sell real
- Jangan lakukan live trading nyata
- Hanya boleh melakukan validasi aman seperti:
  - build
  - lint
  - probe
  - env validation
  - startup validation
  - auth check non-destruktif bila tersedia
  - market data fetch
  - callback path verification
  - recovery simulation / dry-run / paper validation
- Jika flow trade real belum terbukti aman end-to-end, tulis jujur belum siap live

DELIVERABLE WAJIB:
1. Audit keras per-file / per-modul untuk bagian yang relevan.
2. Daftar bug nyata yang ditemukan, dipisahkan antara:
   - source bug
   - deploy/config issue
   - observability issue
   - docs mismatch
3. Implementasi langsung pada repo untuk bug source yang memang perlu diperbaiki.
4. Perbaikan docs/env example bila tidak sinkron.
5. Ringkasan file apa saja yang diubah dan kenapa.
6. Hasil build/lint/probe.
7. Validasi operasional yang benar-benar dilakukan.
8. Verdict final tegas:
   - SIAP DEPLOY / BELUM SIAP DEPLOY
   - SIAP LIVE / BELUM SIAP LIVE
   - jika belum, jelaskan blocker yang tersisa secara jujur dan spesifik

LARANGAN:
- jangan hanya memberi analisis tanpa implementasi
- jangan menutupi ketidakpastian
- jangan mengklaim sudah aman jika recovery/execution masih parsial
- jangan memakai dokumen lama sebagai kebenaran jika source aktual berbeda
- jangan mencampur bug VPS dependency install dengan bug source repo kecuali memang terbukti ada akar source issue
- jangan melakukan aksi eksternal yang irreversible

CATATAN EKSEKUSI:
- Environment/secret sudah tersedia di runtime platform. Gunakan dari sana bila memang diperlukan.
- Jangan minta secret dicetak ke output.
- Kerjakan sekarang tanpa konfirmasi tambahan.
