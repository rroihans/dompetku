---
trigger: always_on
---

# Arsitektur Sistem & Integritas Data
- Gunakan prinsip **Double-Entry Bookkeeping** (Pembukuan Berpasangan).
- Setiap transaksi wajib memiliki `debitAkunId` dan `kreditAkunId`.
- **Database:** Client-side IndexedDB dengan **Dexie.js**.
- **Tech Stack:** Next.js 16 (Static Export), TypeScript, Tailwind CSS v4, Shadcn UI.
- **Offline-First:** Semua logic berjalan di client. Tidak ada server-side execution.
- Implementasikan **Idempotency Key** pada setiap mutasi data untuk mencegah duplikasi.
- Gunakan standar **PSAK Indonesia** untuk klasifikasi Akun (Aset, Kewajiban, Beban, Pendapatan).