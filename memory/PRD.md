# PRD — cukong-markets audit & final sync

## Original Problem Statement
User meminta audit keras per-file untuk seluruh repo `https://github.com/bcbcrey-hue/cukong-markets`, lalu melakukan perbaikan nyata hanya bila diperlukan agar:
- seluruh modul besar yang diklaim di dokumen benar-benar terhubung nyata,
- seluruh status di dokumen menjadi jujur, konsisten, final, dan siap dipakai sebagai konteks sesi berikutnya,
- tidak ada campur aduk status lama vs status terbaru,
- tidak ada overclaim, placeholder palsu, dummy wiring, atau klaim “sudah” padahal belum nyambung.

Urutan kerja yang diminta:
1. audit seluruh area repo secara nyata,
2. perbaiki hanya mismatch nyata / bug correctness / env contract / build-typecheck-test-probe failure,
3. bersihkan `REFACTOR_LOG.md`, `SESSION_CONTEXT_NEXT.md`, `README.md`, `.env.example`,
4. validasi final,
5. beri verdict tegas `SIAP LIVE` atau `BELUM SIAP LIVE`.

Batasan penting dari user:
- jangan refactor ulang besar-besaran bila tidak perlu,
- pertahankan Telegram sebagai UI utama,
- pertahankan whitelist user,
- pertahankan legacy account upload format,
- pertahankan storage akun di `data/accounts/accounts.json`,
- pertahankan mode trading `OFF | ALERT_ONLY | SEMI_AUTO | FULL_AUTO`.

## Architecture Decisions
- Mempertahankan arsitektur Telegram-first backend TypeScript yang sudah ada.
- Menjadikan source of truth runtime publik/callback tetap env-driven melalui `PUBLIC_BASE_URL` dan `INDODAX_CALLBACK_PATH`.
- Menjaga route internal inti tetap stabil di `/healthz` dan `/indodax/callback`.
- Mempertahankan hybrid legacy `/tapi` + Trade API V2 karena memang masih dipakai execution/recovery/history; status ditulis jujur sebagai parsial.
- Tidak menambah refactor besar karena audit menunjukkan wiring internal utama sudah nyata dan lulus probe.
- Memisahkan dengan tegas blocker repo internal vs blocker deploy/runtime publik.

## What Has Been Implemented / Final State
- Audit source menyeluruh pada root docs/config, `src/config`, `src/core`, `src/storage`, `src/services`, semua domain utama, integrations, server, workers, tests, scripts, deploy/nginx, `package.json`, `tsconfig.json`.
- Ditemukan mismatch nyata bahwa `.env.example` belum ada; file tersebut dibuat dan disinkronkan dengan semua env yang benar-benar dipakai source.
- `README.md` dibersihkan agar jujur: menjelaskan implementasi nyata, hal yang masih parsial, kontrak env, callback URL final, peran nginx, Telegram UI utama, probe yang benar-benar tersedia, dan catatan deploy/infrastructure.
- `REFACTOR_LOG.md` dibersihkan menjadi satu log final yang sinkron dan siap dipakai sebagai source of truth sesi berikutnya.
- `SESSION_CONTEXT_NEXT.md` disinkronkan agar ringkas dan konsisten dengan README, REFACTOR_LOG, `.env.example`, dan `package.json`.
- Validasi nyata yang lulus: lint, build, dan seluruh probe utama pada folder `tests/`.
- Verifikasi publik tambahan menunjukkan `https://kangtrade.top/healthz` dan `https://kangtrade.top/indodax/callback` belum mengarah ke runtime repo ini; ini dicatat sebagai blocker luar repo.

## Prioritized Backlog

### P0
- Selaraskan deploy/infrastructure agar domain publik benar-benar mengarah ke app server `/healthz` dan callback server `/indodax/callback` milik repo ini.
- Pastikan nginx aktif di server publik benar-benar memakai artefak render terbaru dari repo ini.

### P1
- Sederhanakan compatibility layer legacy `/tapi` + V2 setelah live routing publik benar-benar stabil.
- Tambahkan script package khusus untuk menjalankan probe bila diinginkan, karena saat ini probe dijalankan langsung via `tsx`.

### P2
- Tambah observability deploy/runtime publik yang lebih eksplisit bila akses server/deploy tersedia.
- Evaluasi perapihan minor file besar hanya jika nanti sudah ada kebutuhan maintainability nyata.

## Next Tasks
1. Terapkan `.env` production yang benar.
2. Build dan render nginx dari repo ini.
3. Deploy app + callback server dengan routing domain yang tepat.
4. Verifikasi publik `https://<domain>/healthz` mengembalikan JSON health repo ini.
5. Verifikasi publik `https://<domain>/indodax/callback` dilayani callback server repo ini.
