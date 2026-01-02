# Spec: Fitur Account Templates & Automasi Perbankan (v0.4.0)

## Overview
Implementasi sistem "Account Templates" untuk otomatisasi pencatatan biaya admin bulanan dan bunga bank berdasarkan konfigurasi template yang dapat disesuaikan. Fitur ini bertujuan untuk mengurangi input manual user untuk biaya rutin perbankan sesuai dengan kebijakan resmi bank (Contoh: BCA Tahapan Xpresi).

## Functional Requirements
1.  **Data Modeling:**
    *   Tabel `AccountTemplate`: Menyimpan konfigurasi biaya admin, bunga berjenjang (JSON), pola tagihan (Tanggal Tetap, Jumat ke-3, Hari Kerja Terakhir), dan tipe akun.
    *   Modifikasi Tabel `Akun`: Menambahkan relasi ke `AccountTemplate`, field `setoran_awal`, `last_admin_charge_date`, dan `last_interest_credit_date`.
2.  **Manajemen Template:**
    *   Halaman `/template-akun` untuk CRUD template.
    *   Seeder untuk data awal: BCA Tahapan Xpresi, BCA Tahapan, Mandiri Tabungan Now, BNI Taplus, dan opsi "Custom".
3.  **Integrasi Form Akun:**
    *   Penambahan Combobox "Gunakan Template" pada form tambah akun.
    *   Auto-fill nama dan tipe akun saat template dipilih.
    *   Validasi perubahan template pada akun yang sudah memiliki riwayat transaksi.
4.  **Engine Automasi (Server Actions):**
    *   `processMonthlyAdminFees`: Menghitung tanggal tagihan berdasarkan pola, mengecek duplikasi, dan membuat transaksi pengeluaran otomatis.
    *   `processMonthlyInterest`: Menghitung bunga bersih (setelah pajak 20%) berdasarkan saldo akhir bulan dan tier bunga.
    *   Mendukung mode `dryRun` untuk simulasi proses.
5.  **UI & Dashboard:**
    *   Widget "Pengingat Biaya Admin" di Dashboard untuk tagihan 7 hari ke depan.
    *   Badge informasi template pada card akun di halaman `/akun`.
    *   Section detail template dan riwayat biaya admin pada halaman detail akun.
    *   Tombol trigger manual di halaman Pengaturan.
6.  **Reliabilitas & Keamanan:**
    *   Penggunaan Prisma Transaction dengan row-level locking untuk mencegah race condition.
    *   Logging komprehensif ke `LogSistem` untuk setiap aksi automasi.

## Non-Functional Requirements
*   **Consistency:** Menggunakan kembali komponen UI dari `components/forms/` dan pola error handling dari fitur Cicilan.
*   **Responsiveness:** UI sepenuhnya adaptif untuk mobile (menggunakan bottom sheet untuk dialog).
*   **Auto-Propagation:** Perubahan pada template akan otomatis berdampak pada perhitungan biaya admin di siklus berikutnya bagi semua akun yang terhubung.
*   **Language:** Seluruh antarmuka menggunakan Bahasa Indonesia.

## Acceptance Criteria
1.  User dapat membuat akun baru dengan memilih template BCA Tahapan Xpresi dan melihat estimasi biaya admin.
2.  Sistem dapat menghitung dengan tepat Jumat minggu ketiga sebagai tanggal tagihan for BCA Xpresi.
3.  Transaksi biaya admin dan bunga tercipta secara otomatis dengan kategori yang sesuai saat dipicu secara manual.
4.  Log aktivitas tercatat dengan benar di `LogSistem` dengan label yang tepat (e.g., ADMIN_FEE_PROCESSED).
5.  Script `npm run test-recurring` berhasil mensimulasikan proses tanpa error.

## Out of Scope
*   Implementasi Cron Job otomatis di level OS/Server (disiapkan via toggle toggle "Auto-Process" di UI saja).
*   Integrasi API bank sesungguhnya (data tetap berbasis input internal aplikasi).
