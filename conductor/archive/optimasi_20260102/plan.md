# Plan: Optimasi Database & Penguatan Detail Fitur

## Phase 1: Optimasi Database & Performa
- [ ] Task: Tambahkan index pada tabel `Transaksi` di `schema.prisma` (tanggal, kategori, debitAkunId, kreditAkunId).
- [ ] Task: Jalankan `npx prisma migrate dev` untuk menerapkan perubahan skema.
- [ ] Task: Implementasikan fungsi `pruneOldLogs` di `src/app/actions/debug.ts` (hapus log > 30 hari).
- [ ] Task: Hubungkan `pruneOldLogs` ke proses inisialisasi aplikasi/dashboard.
- [ ] Task: Optimasi query agregat di `src/app/actions/analytics.ts` untuk meningkatkan kecepatan muat dashboard.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Optimasi Database & Performa' (Protocol in workflow.md)

## Phase 2: Penguatan Detail Akun & Transaksi
- [ ] Task: Update logic Server Action `src/app/actions/akun.ts` untuk menyertakan data trend saldo akun.
- [ ] Task: Tambahkan informasi "Saldo Setelah Transaksi" (Running Balance) pada query riwayat transaksi di `src/app/actions/transaksi.ts`.
- [ ] Task: Update UI halaman Akun untuk menampilkan grafik trend saldo dan transaksi terbaru per akun.
- [ ] Task: Update UI tabel/list transaksi untuk menyertakan kolom "Saldo" (running balance).
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Penguatan Detail Akun & Transaksi' (Protocol in workflow.md)

## Phase 3: Penguatan Detail Anggaran
- [ ] Task: Tambahkan kalkulasi "Sisa Hari" dan "Saran Pengeluaran Harian" di Server Action `src/app/actions/anggaran.ts`.
- [ ] Task: Update UI komponen Budget di halaman Anggaran untuk menampilkan detail informasi sisa hari dan saran harian.
- [ ] Task: Jalankan build & lint check untuk memastikan tidak ada regresi.
- [ ] Task: Update `LOG_PERUBAHAN.md`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Penguatan Detail Anggaran' (Protocol in workflow.md)
