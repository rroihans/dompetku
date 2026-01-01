# Plan: Drill-down Kategori Pengeluaran

## Phase 1: Persiapan & Data Layer
- [ ] Task: Analisis komponen `ExpensePieChart` dan `analytics.ts` yang sudah ada.
- [ ] Task: Tambahkan Server Action untuk mengambil transaksi detail berdasarkan kategori dan periode.
- [ ] Task: Buat unit test untuk Server Action baru (TDD).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Persiapan & Data Layer' (Protocol in workflow.md)

## Phase 2: UI Implementation
- [ ] Task: Implementasikan handler klik pada komponen `ExpensePieChart` menggunakan Recharts.
- [ ] Task: Buat komponen `CategoryDetailDialog` menggunakan Shadcn UI untuk menampilkan daftar transaksi.
- [ ] Task: Integrasikan data dari Server Action ke dalam Dialog detail.
- [ ] Task: Pastikan styling menggunakan Slate 900/950 dan Emerald 500/600.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Implementation' (Protocol in workflow.md)

## Phase 3: Finalisasi & Pembersihan
- [ ] Task: Verifikasi responsivitas pada tampilan mobile.
- [ ] Task: Jalankan linting dan build check.
- [ ] Task: Update `LOG_PERUBAHAN.md`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Finalisasi & Pembersihan' (Protocol in workflow.md)
