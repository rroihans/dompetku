# Plan: Minimum Balance Interest Calculation Refactor

## Phase 1: Database & Logic Preparation
- [x] Task: Tambahkan database indexes pada `prisma/schema.prisma` untuk kolom `(debitAkunId, tanggal)` dan `(kreditAkunId, tanggal)`.
- [x] Task: Jalankan migrasi database `npx prisma migrate dev --name add_transaction_indices`.
- [x] Task: Implementasi fungsi helper `getMinimumBalanceForMonth` dengan logika hitung mundur saldo dan chronological replay.
- [x] Task: Tambahkan feature flag `USE_MIN_BALANCE_METHOD` pada sistem AppSetting.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database & Logic Preparation' (Protocol in workflow.md)

## Phase 2: Core Engine Refactor & Fallback
- [x] Task: Update `src/app/actions/recurring-admin.ts` untuk menggunakan metode baru dengan wrapper try-catch dan fallback mechanism.
- [x] Task: Implementasi enhanced logging dengan format peringatan saldo negatif yang baru.
- [x] Task: Tambahkan tracking durasi eksekusi dan alert performa >500ms.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Core Engine Refactor & Fallback' (Protocol in workflow.md)

## Phase 3: UI Implementation
- [x] Task: Update UI detail akun untuk menambahkan tooltip penjelasan "Minimum Balance".
- [x] Task: Update `InterestCalculator` dengan footer catatan metode dan sinkronisasi angka dengan engine baru.
- [x] Task: Integrasi toast notification untuk hasil proses automasi (Success/Failed/Fallback).
- [x] Task: Conductor - User Manual Verification 'Phase 3: UI Implementation' (Protocol in workflow.md)

## Phase 4: QA, Stress Test & Rollout
- [ ] Task: Buat script `scripts/test-min-balance-stress.ts` untuk simulasi 1000+ transaksi dan timezone edge cases.
- [ ] Task: Verifikasi skenario negative cases (mid-month account, zero transactions, negative balance).
- [ ] Task: Update `LOG_PERUBAHAN.md` dengan dokumentasi teknis dan panduan akurasi v0.4.2.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: QA, Stress Test & Rollout' (Protocol in workflow.md)
