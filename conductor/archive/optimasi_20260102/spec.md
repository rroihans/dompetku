# Spec: Optimasi Database & Penguatan Detail Fitur

## Overview
Track ini berfokus pada peningkatan performa aplikasi melalui optimasi database SQLite dan penambahan detail informasi pada fitur-fitur utama (Akun, Transaksi, Anggaran) agar aplikasi memberikan insight yang lebih mendalam tanpa menambahkan modul baru.

## Functional Requirements

### 1. Optimasi Database (SQLite)
- **Indexing:** Menambahkan index pada tabel `Transaksi` untuk kolom `tanggal`, `kategori`, `debitAkunId`, dan `kreditAkunId` guna mempercepat query analytics dan filter riwayat.
- **Auto-Pruning Log:** Mengimplementasikan fungsi pembersihan otomatis pada tabel `LogSistem` untuk menghapus data yang lebih tua dari 30 hari. Fungsi ini akan dipicu saat aplikasi dibuka (Sync on Open).
- **Query Optimization:** Refaktor Server Actions pada `analytics.ts` untuk mengurangi beban komputasi saat menghitung agregat besar.

### 2. Penguatan Detail Fitur
- **Detail Akun:** Menambahkan tampilan ringkasan transaksi terbaru dan mini-grafik trend saldo khusus untuk akun yang sedang dilihat.
- **Detail Transaksi:** Menampilkan kalkulasi "Saldo Setelah Transaksi" (Running Balance) pada riwayat transaksi untuk memudahkan pelacakan perubahan saldo.
- **Detail Anggaran:** Menambahkan informasi "Sisa Hari" dalam bulan berjalan dan kalkulasi "Batas Pengeluaran Harian" yang disarankan berdasarkan sisa anggaran.

## Non-Functional Requirements
- **Performance:** Query dashboard harus tetap responsif meskipun data transaksi mencapai ribuan.
- **Data Integrity:** Proses indexing dan pruning log tidak boleh mengganggu integritas data finansial utama.
- **UX:** Penambahan detail informasi harus tetap menjaga kebersihan UI (High Contrast & Information Dense) sesuai standar produk.

## Acceptance Criteria
- [ ] Database memiliki index pada kolom-kolom kunci di tabel Transaksi.
- [ ] Tabel LogSistem secara otomatis menghapus entri yang lebih tua dari 30 hari.
- [ ] Halaman detail akun menampilkan informasi trend dan transaksi yang relevan.
- [ ] Riwayat transaksi menampilkan saldo berjalan (running balance) yang akurat.
- [ ] Anggaran memberikan informasi sisa hari dan saran pengeluaran harian.

## Out of Scope
- Penambahan modul fitur baru (Gamifikasi, Cloud Sync, dll).
- Perubahan besar pada skema database yang memerlukan migrasi data kompleks.
