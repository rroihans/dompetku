# Plan: Refactor Flexible Account Templates & Per-Account Automation

## Phase 1: Database Schema & Migration
- [x] Task: Modifikasi `prisma/schema.prisma` untuk menambahkan field kustom otomasi pada model `Akun`.
- [x] Task: Jalankan migrasi database `npx prisma migrate dev --name refactor_flexible_templates`.
- [x] Task: Buat script migrasi `scripts/migrate-to-flexible-settings.ts` untuk memindahkan data dari `AccountTemplate` ke field `Akun` yang baru.
- [x] Task: Jalankan script migrasi dengan mode dry-run dan verifikasi integritas data.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & Migration' (Protocol in workflow.md)

## Phase 2: Core Reusable Components
- [x] Task: Implementasi `PatternBuilderUI` (UI untuk memilih pola tagihan: Fixed Date, Last Working Day, dll).
- [x] Task: Implementasi `TierEditor` (UI form dinamis untuk manajemen tier bunga tabungan).
- [x] Task: Implementasi `InterestCalculator` (Komponen simulasi bunga berdasarkan tier dan saldo input).
- [x] Task: Implementasi `ComparisonTable` (Tabel perbandingan nilai saat ini vs nilai default template).
- [x] Task: Conductor - User Manual Verification 'Phase 2: Core Reusable Components' (Protocol in workflow.md)

## Phase 3: Server Actions & Logic Update
- [x] Task: Update `src/app/actions/akun.ts` untuk mendukung penyimpanan field kustom otomasi dan tracking `templateOverrides`.
- [x] Task: Refactor `processMonthlyAdminFees` di `recurring-admin.ts` untuk menggunakan isolasi transaksi per-akun dan logging error mendalam.
- [x] Task: Refactor `processMonthlyInterest` di `recurring-admin.ts` untuk menggunakan data dari model `Akun` dan isolasi transaksi.
- [x] Task: Implementasi fungsi `resetAccountToTemplate` untuk mengembalikan nilai akun ke default template.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Server Actions & Logic Update' (Protocol in workflow.md)

## Phase 4: UI Implementation - Form & Settings
- [x] Task: Update `AddAccountForm` untuk mendukung auto-fill yang dapat diedit (Starting Point Approach).
- [x] Task: Buat layout Tab Pengaturan di halaman detail akun `/akun/[id]`.
- [x] Task: Implementasi Section Biaya Admin & Bunga Tabungan pada tab pengaturan menggunakan reusable components.
- [x] Task: Implementasi Section Info Template (Changelog & Comparison) dan Danger Zone.
- [x] Task: Conductor - User Manual Verification 'Phase 4: UI Implementation - Form & Settings' (Protocol in workflow.md)

## Phase 5: Automation Dashboard & Reporting
- [x] Task: Update widget "Pengingat Biaya Admin" untuk menampilkan summary hasil proses (Success/Failed) dan opsi retry per-akun.
- [x] Task: Integrasi Toast Notification yang menyertakan link ke log detail di LogSistem.
- [x] Task: Update halaman `/pengaturan` untuk menampilkan log aktivitas automasi terbaru dengan konteks yang lebih kaya.
- [x] Task: Conductor - User Manual Verification 'Phase 5: Automation Dashboard & Reporting' (Protocol in workflow.md)

## Phase 6: Finalization & Quality Assurance
- [x] Task: Update `LOG_PERUBAHAN.md` dan `CHANGELOG.md` untuk v0.4.1.
- [x] Task: Jalankan unit tests untuk memastikan migrasi data dan engine automasi berjalan dengan benar.
- [x] Task: Verifikasi akhir responsivitas UI pada perangkat mobile (touch targets & layout).
- [x] Task: Conductor - User Manual Verification 'Phase 6: Finalization & Quality Assurance' (Protocol in workflow.md)
