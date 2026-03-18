# PRD — Runtime Public Sync Closure

## Original Problem Statement
User meminta fokus penuh ke penutupan blocker runtime publik aktif: sinkronkan runtime publik dengan hasil render terbaru, ulang smoke test publik `/healthz` dan `/indodax/callback`, lalu laporkan dengan tegas apa yang sudah terbukti dari repo, apa yang sudah terbukti dari runtime publik aktif, dan apa yang masih belum terbukti. Selain itu, `README.md`, `REFACTOR_LOG.md`, dan `SESSION_CONTEXT_NEXT.md` harus jujur menyatakan status komponen besar dari blueprint apakah sudah benar-benar implemented & connected atau belum.

## Architecture Decisions
- Tidak melakukan refactor besar lagi; fokus pada pembuktian operasional runtime publik.
- Menjaga route inti tetap `/healthz` dan `/indodax/callback`.
- Menggunakan hasil render nginx terbaru sebagai kontrak target yang seharusnya dipakai runtime publik.
- Karena akses hanya repo + smoke test publik, keputusan teknis diambil secara jujur berbasis bukti HTTP, DNS/IP, supervisor, dan log runtime yang tersedia.

## What’s Implemented
- Menjalankan investigasi deployment/runtime mismatch dengan `deployment_agent`.
- Memverifikasi supervisor dan log platform lokal: runtime preview repo saat ini masih memakai supervisor template FastAPI/React lama dan proses backend/frontend `FATAL`.
- Memverifikasi smoke test publik terbaru:
  - `GET https://kangtrade.top/healthz`
  - `GET https://kangtrade.top/indodax/callback`
  - `POST https://kangtrade.top/indodax/callback`
  - `GET https://<preview-url>/healthz`
- Memverifikasi resolusi DNS/IP untuk membedakan custom domain aktif vs preview runtime repo.
- Memperbarui `README.md`, `REFACTOR_LOG.md`, dan `SESSION_CONTEXT_NEXT.md` agar eksplisit menyebut:
  - komponen blueprint besar yang sudah implemented & connected di repo,
  - apa yang belum terbukti dari runtime publik aktif,
  - blocker operasional publik yang masih nyata.

## Verification Executed
Temuan nyata:
- Preview runtime repo: `502 The preview environment is not responding`
- `kangtrade.top` merespons dari `nginx/1.24.0 (Ubuntu)` pada IP `103.160.62.162`
- `GET https://kangtrade.top/healthz` → `200 text/html` (bukan health JSON repo)
- `GET https://kangtrade.top/indodax/callback` → `405` dengan body custom yang bukan contract repo
- `POST https://kangtrade.top/indodax/callback` → `200 fail`

Kesimpulan verifikasi:
- Hasil render terbaru repo sudah ada dan benar sebagai target contract
- Runtime publik aktif belum terbukti memakai hasil render itu
- Tidak ada bukti bahwa custom domain aktif sekarang mengarah ke runtime repo yang sedang diaudit

## Prioritized Backlog
### P0
- Sinkronkan runtime publik aktif agar benar-benar memakai hasil render terbaru.
- Pastikan preview/runtime repo hidup normal, bukan 502.
- Setelah itu, ulang smoke test publik `/healthz` dan `/indodax/callback`.

### P1
- Jika kelak window compatibility aman, evaluasi rename artefak nginx legacy filename.

### P2
- Tambah checklist operasional untuk verifikasi DNS/domain vs preview runtime sebelum menyimpulkan sync publik.

## Next Tasks
1. Perbaiki runtime/deploy aktif agar bukan lagi supervisor template lama / preview 502.
2. Pastikan custom domain publik benar-benar menunjuk ke runtime yang memakai hasil render terbaru.
3. Ulang smoke test publik.
4. Baru setelah itu simpulkan blocker P0 publik benar-benar selesai atau belum.
