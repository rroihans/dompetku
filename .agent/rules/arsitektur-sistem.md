---
trigger: always_on
---

# Arsitektur Sistem & Integritas Data
- Gunakan prinsip **Double-Entry Bookkeeping** (Pembukuan Berpasangan).
- Setiap transaksi wajib memiliki `debitAkunId` dan `kreditAkunId`.
- **Database:** SQLite dengan Prisma ORM.
- **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI.
- Implementasikan **Idempotency Key** pada setiap mutasi data untuk mencegah duplikasi.
- Gunakan standar **PSAK Indonesia** untuk klasifikasi Akun (Aset, Kewajiban, Beban, Pendapatan).