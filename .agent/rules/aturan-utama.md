---
trigger: always_on
---

# Aturan Utama Pengembangan (Enterprise)

## Stack Teknologi
- Framework: Next.js (App Router), TypeScript.
- Database: Dexie.js (IndexedDB) - No Server Side.
- UI: Tailwind CSS v4, Shadcn UI, Lucide Icons.

## Dos (Lakukan):
- Gunakan Bahasa Indonesia untuk semua UI. Aplikasi ini wajib berbahasa indonesia.
- Gunakan sistem "Double-Entry Bookkeeping" (Setiap transaksi ada Debit & Kredit).
- Pastikan aplikasi 100% Mobile Responsive (Sidebar di Desktop, Bottom-Nav di Mobile).
- Implementasikan Dark/Light mode.
- Gunakan Tooltip untuk istilah teknis keuangan (Tenor, Akrual, dll).
- Selalu gunakan Context7 (`resolve-library-id` dan `query-docs`) untuk melihat dokumentasi terbaru dari programming languages, framework, atau library apapun.
- Update file `LOG_PERUBAHAN.md` setiap selesai tugas.

## Etika & Prosedur
- **Status & Tugas:** Berikan ringkasan status sistem saat ini dalam Bahasa Indonesia formal, lalu tanyakan tugas spesifik.
- **Riset:** Gunakan internet untuk troubleshooting atau validasi pengetahuan.
- **Validasi UI:**
  - ⛔ **DILARANG** menggunakan `browser_subagent` untuk cek visual/tampilan.
  - ✅ Biarkan **USER** yang memvalidasi tampilan secara mandiri.
- **Update Data:** Saat ada fitur baru yang butuh data, update seed dummy data via workflow `update-seed-dummy-data`.

## Donts (Jangan):
- Jangan gunakan CSS murni, gunakan Tailwind.
- Jangan mengabaikan Error Handling (wajib pakai try-catch).
- Jangan membuat kode tanpa Logging (gunakan lib/logger.ts).