# Specification: Refactor Account Templates to Flexible Starting Point

## 1. Overview
Refactor sistem "Account Template" yang saat ini kaku menjadi pendekatan "Starting Point". Template hanya akan berfungsi sebagai pengisi otomatis (*auto-fill*) saat pembuatan akun, sementara data kepemilikan dan kontrol penuh dialihkan ke model `Akun` itu sendiri. Ini memberikan fleksibilitas bagi user untuk menyesuaikan biaya admin, pola tagihan, dan tier bunga per akun tanpa terikat pada template global.

## 2. Functional Requirements

### A. Schema & Data Migration
- **Prisma Schema Update**: Menambahkan field ke model `Akun`:
    - `templateSource`: String? (ID template asal).
    - `biayaAdminAktif`: Boolean (default: false).
    - `biayaAdminNominal`: Int?.
    - `biayaAdminPola`: Enum (FIXED_DATE, LAST_WORKING_DAY, FRIDAY_WEEK_3, MANUAL).
    - `biayaAdminTanggal`: Int? (untuk FIXED_DATE).
    - `bungaAktif`: Boolean (default: false).
    - `bungaTiers`: Json? (Array of tier objects).
    - `templateOverrides`: Json? (Log perubahan dari nilai default).
    - `settingsLastModified`: DateTime (Audit trail).
- **Data Migration Script**: 
    - Extract data dari `AccountTemplate` ke field baru di `Akun`.
    - Putus relasi `accountTemplateId` (data ownership sekarang di `Akun`).
    - Dukungan *Dry-run mode* dan *Rollback capability*.
    - Akun tanpa template diatur ke status nonaktif secara default.

### B. UI/UX Enhancements
- **Updated Add Account Form**:
    - Memilih template akan mengisi field secara otomatis namun tetap dapat diedit oleh user.
    - Visual cues (placeholder "Bisa diubah") dan info text yang menjelaskan sifat template sebagai panduan awal.
- **Account Settings Page (`/akun/[id]` Tab Pengaturan)**:
    - **Section Biaya Admin**: Toggle aktif/nonaktif, edit nominal, dropdown pola tagihan, preview 5 tanggal tagihan mendatang, dan tombol "Test Pattern".
    - **Section Bunga Tabungan**: Toggle aktif/nonaktif, Tier Editor dinamis (add/remove), visual preview range dengan warna, dan kalkulator simulasi bunga.
    - **Section Info Template**: Tabel perbandingan (Default vs Kustom), riwayat perubahan (changelog), dan tombol "Reset ke Default".
    - **Danger Zone**: Action untuk reset total atau mematikan semua otomasi dengan double confirmation.
- **Automation Result UI**:
    - Menampilkan summary hasil proses massal (Total, Berhasil, Gagal).
    - Opsi **Retry per-account** untuk akun yang gagal.
    - Toast notification dengan format: `'X akun berhasil, Y gagal - lihat detail di log'` beserta link ke log.

### C. Logic & Automation (Robust Engine)
- **Per-Account Transaction**: Setiap akun diproses dalam Prisma Transaction terpisah. Kegagalan pada satu akun hanya akan rollback transaksi akun tersebut.
- **Resilient Processing**: Jika satu akun error, sistem **Wajib** melanjutkan ke akun berikutnya.
- **Detailed Error Logging (`LogSistem`)**: Menyimpan data: `akunId`, `akunNama`, `errorMessage`, `timestamp`, dan `context` (Biaya Admin/Bunga).
- **Summary Response**: Server action mengembalikan objek `{ total, success, failed, errors[] }` untuk konsumsi UI.
- **Reusable Components**: 
    - `PatternBuilderUI`, `TierEditor`, `InterestCalculator`, `ComparisonTable`.

## 3. Non-Functional Requirements
- **Data Integrity**: Memastikan transaksi historis tetap utuh selama migrasi.
- **Mobile First**: Optimalisasi touch targets untuk Tier Editor dan Pattern Builder.
- **Performance**: Automasi harus tetap efisien meskipun memproses banyak transaksi individual (O(N) dengan N = jumlah akun aktif).

## 4. Acceptance Criteria
- User dapat mengubah nilai yang di-auto-fill dari template saat membuat akun baru.
- Migrasi data memindahkan semua setting template lama ke model Akun secara akurat.
- Jika automasi gagal pada Akun A (misal: saldo negatif/error sistem), Akun B tetap terproses dengan benar.
- Pengguna dapat melihat detail error spesifik (misal: "Bunga Gagal: Data Tier Corrupt") di LogSistem.
- Notifikasi Toast muncul segera setelah proses massal selesai dengan link navigasi ke log.

## 5. Out of Scope
- Sinkronisasi otomatis dari template global ke akun yang sudah ada.
- Penambahan pola tagihan baru di luar 4 pola inti.
