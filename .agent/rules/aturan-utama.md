---
trigger: always_on
---

# Aturan Utama Pengembangan (Enterprise)

## Stack Teknologi
- Framework: Next.js (App Router), TypeScript.
- Database: Prisma ORM dengan SQLite.
- UI: Tailwind CSS, Shadcn UI, Lucide Icons.

## Dos (Lakukan):
- Gunakan Bahasa Indonesia untuk semua UI.
- Gunakan sistem "Double-Entry Bookkeeping" (Setiap transaksi ada Debit & Kredit).
- Pastikan aplikasi 100% Mobile Responsive (Sidebar di Desktop, Bottom-Nav di Mobile).
- Implementasikan Dark/Light mode.
- Gunakan Tooltip untuk istilah teknis keuangan (Tenor, Akrual, dll).
- Selalu gunakan Context7 (`resolve-library-id` dan `query-docs`) untuk melihat dokumentasi terbaru dari programming languages, framework, atau library apapun.
- Update file `LOG_PERUBAHAN.md` setiap selesai tugas.

## Donts (Jangan):
- Jangan gunakan CSS murni, gunakan Tailwind.
- Jangan mengabaikan Error Handling (wajib pakai try-catch).
- Jangan membuat kode tanpa Logging (gunakan lib/logger.ts).