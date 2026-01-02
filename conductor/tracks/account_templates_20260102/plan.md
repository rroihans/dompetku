# Plan: Fitur Account Templates & Automasi Perbankan (v0.4.0)

## Phase 1: Database & Schema Preparation
- [x] Task: Modifikasi `prisma/schema.prisma` untuk menambahkan model `AccountTemplate` dan field baru pada model `Akun`.
- [x] Task: Jalankan migrasi database `npx prisma migrate dev --name add_account_templates`.
- [x] Task: Update `prisma/seed.ts` untuk menyertakan data template awal (BCA Xpresi, BCA Tahapan, Mandiri, BNI, Custom).
- [x] Task: Jalankan seeder `npx prisma db seed`.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database & Schema Preparation' (Protocol in workflow.md)

## Phase 2: Core Utilities & Server Actions
- [x] Task: Buat `src/lib/template-utils.ts` untuk logika perhitungan tanggal tagihan dan tier bunga.
- [x] Task: Buat `src/app/actions/template.ts` untuk CRUD operasional `AccountTemplate`.
- [x] Task: Buat `src/app/actions/recurring-admin.ts` untuk engine `processMonthlyAdminFees` dan `processMonthlyInterest` dengan Prisma Transaction.
- [x] Task: Buat script pengujian `scripts/test-recurring.ts` and tambahkan ke `package.json`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Core Utilities & Server Actions' (Protocol in workflow.md)

## Phase 3: UI Implementation - Template Management
- [x] Task: Buat halaman `/template-akun` dengan tabel list template dan integrasi CRUD.
- [x] Task: Implementasi dialog form tambah/edit template dengan dynamic fields untuk tier bunga.
- [x] Task: Pastikan responsivitas UI menggunakan mobile-first approach (bottom sheets).
- [ ] Task: Conductor - User Manual Verification 'Phase 3: UI Implementation - Template Management' (Protocol in workflow.md)

## Phase 4: UI Implementation - Account Integration
- [ ] Task: Modifikasi `app/akun/add-account-form.tsx` untuk integrasi Combobox template dan auto-fill.
- [ ] Task: Tambahkan badge informasi template pada card akun di halaman `/akun`.
- [ ] Task: Tambahkan section "Informasi Template" dan riwayat biaya admin di halaman detail akun `/akun/[id]`.
- [ ] Task: Implementasi warning dialog saat mengganti template pada akun yang sudah memiliki transaksi.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: UI Implementation - Account Integration' (Protocol in workflow.md)

## Phase 5: Dashboard & Settings Integration
- [ ] Task: Buat widget "Pengingat Biaya Admin" di Dashboard.
- [ ] Task: Tambahkan section "Automasi Keuangan" di halaman `/pengaturan` dengan tombol trigger manual dan toggle experimental.
- [ ] Task: Integrasi display log terakhir dari `LogSistem` di halaman pengaturan.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Dashboard & Settings Integration' (Protocol in workflow.md)

## Phase 6: Finalization & Documentation
- [ ] Task: Update `LOG_PERUBAHAN.md` dan `CHANGELOG.md` ke v0.4.0.
- [ ] Task: Jalankan build dan lint check untuk memastikan kualitas kode.
- [ ] Task: Verifikasi akhir seluruh alur fitur (End-to-End).
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Finalization & Documentation' (Protocol in workflow.md)
