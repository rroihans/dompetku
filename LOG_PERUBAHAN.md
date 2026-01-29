# Log Perubahan - Dompetku

## Stack & Arsitektur
- **Framework:** Next.js 16, React 19, Tailwind CSS v4
- **Database:** Prisma 5.10.2 + SQLite
- **Sistem:** Double-Entry Bookkeeping (PSAK Indonesia)
- **UI:** Shadcn UI, Lucide Icons, Recharts
- **Layout:** Sidebar (Desktop), Bottom Nav + Hamburger (Mobile)

## Data Dummy
- 6 Akun User + 44 Akun Internal (kategori)
- 348+ Transaksi (6 bulan)
- 6 Recurring, 5 Cicilan, 27 Budget

---

## Fitur Selesai ✅

### Akun
- CRUD lengkap dengan warna custom
- Validasi nama unik, pagination 8/halaman
- Tipe: Bank, E-Wallet, Cash, Kartu Kredit
- Transfer antar akun dengan double-entry

### Transaksi
- CRUD dengan filter (search, kategori, tipe, akun)
- Edit nominal dengan auto-adjust saldo
- Date picker untuk tanggal custom
- Pagination 10/halaman

### Dashboard
- Stat Cards: Total Saldo, Pemasukan, Pengeluaran, Selisih
- Pie Chart: Pengeluaran per kategori
- Bar Chart: Trend 6 bulan terakhir
- Alert cicilan aktif dengan tagihan
- Quick Links footer

### Laporan Bulanan
- Navigasi bulan (prev/next)
- Summary: Pemasukan, Pengeluaran, Selisih, Rata-rata harian
- Breakdown per kategori dengan progress bar
- Top 5 pengeluaran terbesar

### Statistik/Insight ✨
- Cash Flow Table (ringkasan income vs expense)
- Income & Expense Book (breakdown per kategori)
- Spending Insights (top kategori, tren, pola harian)
- Rekomendasi keuangan otomatis (logic-based)
- Period selector: 7H, 30H, 12M, 6B, 1T

### Cicilan
- CRUD rencana cicilan
- Pembayaran bulanan dengan double-entry
- Pelunasan dipercepat
- Statistik: Total Hutang, Tagihan, Rasio
- Progress bar pembayaran
- Alert jatuh tempo

### Recurring
- Template transaksi berulang
- Frekuensi: Harian, Mingguan, Bulanan, Tahunan
- Toggle aktif/nonaktif
- Auto-execute (siap untuk cron)

### Budget/Anggaran
- Set limit per kategori per bulan
- Progress bar dengan warna:
  - Hijau: < 80%
  - Kuning: 80-100%
  - Merah: > 100%
- Alert pengeluaran tanpa anggaran
- Copy dari bulan sebelumnya
- Budget Chart (visualisasi anggaran vs realisasi)

### Template Transaksi ✨
- Simpan transaksi favorit sebagai template
- Quick-add untuk transaksi cepat
- Usage count tracking

### Kalender Keuangan ✨
- View bulanan dengan event dots
- Tampilkan cicilan, recurring, transaksi
- Detail per tanggal

### Net Worth ✨
- Grafik area chart di Dashboard
- Total Aset vs Hutang
- Perubahan 30 hari terakhir

### Multi-Currency ✨
- 10 mata uang support (USD, EUR, SGD, dll)
- Rate management di Pengaturan
- Konverter built-in

### Pengaturan
- Backup: Export semua data ke JSON
- Restore: Import dari file JSON
- Reset: Hapus semua data (dengan konfirmasi)
- Privacy Mode: CSS blur toggle (icon mata)
- DevTools: Database Inspector (/devdb)
- Tema: Dark/Light mode
- Currency Rates: Kelola kurs mata uang

### UI/UX
- Cursor pointer global untuk semua elemen interaktif
- Hover effects pada cards
- Empty states yang clickable
- Mobile hamburger menu + sliding drawer
- Privacy Mode blur untuk nominal

---

## Bug Fixes
- Hydration error (AlertDialogDescription dengan asChild)
- Import akun duplikat (cek by NAMA+TIPE, bukan ID)
- Redirect setelah reset (ke / setelah 3 detik)
- Filter search support nama akun debit/kredit
- **v0.3.5:** Server action export error (SUPPORTED_CURRENCIES) - pindah ke lib/currency.ts

---

## Catatan Teknis
- Lint warnings `@plugin/@theme/@apply` = false positive (Tailwind v4)
- Loading ~200ms di dev mode = normal (SSR + DB queries)
- Privacy mode menggunakan CSS `filter: blur()` + `data-private` attribute
- Konstanta yang dipakai di client & server harus di file terpisah (bukan `"use server"`)
- CurrencyApi.net: Free tier 300 requests/bulan

---


## Riwayat Versi

### v0.8.1 (2026-01-28)
- **UI/UX Fixes (Post-Meeting Testing):**
    - **Form Tambah Akun:** Input desimal dinonaktifkan by default (checkbox optional).
    - **Form Transfer:** Notifikasi sukses & redirect yang benar ke halaman transaksi.
    - **Layout Akun:** Hapus tombol redundan (Riwayat/Cicilan/Transaksi) dari card akun untuk tampilan bersih.
    - **List Transaksi:** Kolom Akun menampilkan "Asal → Tujuan" untuk transfer, dan counterparty untuk transaksi lain.
    - **Mobile Header:** Sembunyikan component `LiveClock` (Tanggal & Jam) di mobile layout untuk mencegah overlapping dan tampilan berantakan; user mobile sudah memiliki jam di status bar.
    - **FAB (Floating Action Button):** Refactor total menggunakan `Dialog` untuk Tambah Akun & Transfer, serta Link yang benar.
- **Bug Fixes:**
    - Fix logic form transaksi yang sempat hilang saat refactor.
    - Perbaikan `TransferForm` state management.

### v0.8.0 (2026-01-28)
- **Offline-First Transformation (PWA):**
    - **Local Database (Dexie):** Implementasi IndexedDB untuk penyimpanan data lokal tanpa server (Akun, Transaksi, Cicilan, Recurring).
    - **Incremental Summaries:** Sistem agregasi otomatis (SummaryMonth, Category, Account) saat transaksi dibuat/diedit/dihapus untuk performa dashboard O(1).
    - **Offline Capabilities:** Web Manifest dan Service Worker (`sw.js`) untuk akses tanpa internet (cache-first assets, network-first shell).
    - **Repositories:** Refactoring logika bisnis ke `libs/db` (repository pattern) untuk memisahkan UI dari data layer.
- **Core Features Migration:**
    - **Recurring:** Repository logic untuk pemrosesan transaksi berulang (`processRecurringTransaction`).
    - **Cicilan:** Logika pembayaran cicilan (`processCicilanPayment`) yang mengupdate status dan saldo otomatis.
    - **Backup/Restore:** Fitur export/import data JSON lengkap (`backup.ts`).
    - **Correctness Tools:** Fungsi `rebuildSummaries` dan `checkIntegrity` untuk perbaikan data otomatis.


### v0.7.1 (2026-01-18)
- **Analytics Polish:**
    - **Filter Transaksi:** Advanced filter panel auto-expanded by default.
    - **Heatmap Insights:** Enhanced logic with "Daily Average", "Zero Spending", "Highest Day", and "Normal Pattern" detection. Lowered threshold for weekend spike.
    - **YoY Mobile Layout:** Improved chart responsiveness (responsive container + hidden axis) and table horizontal scroll.
    - **UI Colors:** Softer insight colors (Pastel Amber/Emerald/Blue) for better readability.
- **Navigation Reorganization:**
    - **Sidebar Grouping:** Menu dikelompokkan menjadi kategori Utama, Analisis & Laporan, dan Perencanaan untuk akses yang lebih terstruktur.
    - **Mobile Bottom Nav:** Drawer menu diperbarui dengan tampilan grup kategori yang konsisten dengan Sidebar.
    - **Aksesibilitas:** Menambahkan link langsung ke fitur Perbandingan YoY dan Spending Heatmap di menu utama.

### v0.7.0 (2026-01-18)
- **Analytics & Advanced Features (Sprint 3):**
    - **Year-over-Year Comparison:** Dashboard perbandingan tahunan, tabel breakdown kategori, visualisasi grafik bar/line, dan automated AI insights.
    - **Spending Heatmap:** Visualisasi kalender pengeluaran harian (Grid Desktop / Swipe Mobile) dengan deteksi pola spending (Weekend Spike, Paycheck Splurge).
    - **Advanced Filters:** Filter multi-kategori/akun, range tanggal custom, dan preset filter yang bisa disimpan.
    - **Logic Builder:** Filter kompleks dengan logika AND/OR bersarang.
    - **Floating Action Button (FAB):** Akses cepat (Quick Actions) ke fitur utama dari seluruh halaman.

### v0.6.0 (2026-01-18)
- **Critical Fixes & Foundation (Sprint 1):**
    - **Balance Verification Tool:**
        - Audit saldo akun vs histori transaksi (`/pengaturan/verify-balance`).
        - **Auto-Fix** balance dengan audit trail ke Log Sistem.
    - **Budget Alert System:**
        - Real-time checks saat input transaksi.
        - **Toast Notification:** Warning (80%), Danger (100%), Critical (120%).
        - **Dashboard Banner:** Ringkasan kategori yang over-budget.
    - **Credit Card Payment Flow:**
        - UI Bayar Tagihan di detail kartu kredit.
        - **Payment Calculator:** Integrasi dialog pembayaran dengan opsi Full/Minimum/Custom.
        - **Atomic Transaction:** Pembayaran mengurangi saldo sumber dan menambah limit kartu kredit.
    - **Data Integrity:**
        - Strict Zod Validation untuk Transaksi, Cicilan, dan Kartu Kredit.
        - Pencegahan input negatif, tanggal masa depan, dan data tidak valid.

### v0.5.0 (2026-01-15)
- **Enhanced Credit Card Management System:**
    - **Mandatory Fields:** Kartu kredit: isSyariah, billingDate, dueDate, minPaymentFixed (minInstallmentAmount opsional).
    - **Payment Calculator:** Breakdown (retail, cicilan, biaya, saldo lalu) + due date badge.
    - **Late Fee Rules:** Syariah (Ta'widh Rp75k/100k) vs Konvensional (1% max Rp100k).
    - **Admin Fee Manager:** Kelola per akun CC dengan auto-create recurring transaction.
    - **useDecimalFormat:** Checkbox di pengaturan otomasi untuk format 2 desimal.
- **Rubah ke Cicilan (Convert to Installment):**
    - **Tombol "Cicilan"** langsung terlihat di history transaksi (di tengah, sejajar dropdown).
    - **Logika CIMB Niaga:** Cicilan/bulan = Nominal/Tenor (tanpa admin fee).
    - Admin fee = transaksi terpisah one-time.
    - Saldo kartu tidak di-reverse (transaksi asli tetap valid).
- **Form Buat Akun:**
    - Saldo Awal tersembunyi untuk kartu kredit.
    - **Split Input Saldo:** 2 kotak terpisah (nominal + desimal) dengan preview real-time.
    - Error handler menampilkan pesan validasi yang jelas per field.
    - Pengaturan Otomasi tampil by default.
- **Log Automasi Improvements:**
    - Klik log → Dialog popup dengan pesan lengkap + daftar akun dengan pagination (5/halaman).
    - Fix parsing nama akun (tidak ada koma di awal).
- **UI Fixes:**
    - Tombol aksi transaksi di-center (justify-center).
    - Error display support multiline.
- **Debug Menu:** Dipindah ke header (sejajar icon mata dan tema).
- **Edit Akun:** `EditAccountForm` dengan field untuk CC (lengkap) dan Bank/E-Wallet (nama, warna, format desimal).
- **Schema:** +useDecimalFormat (Boolean default false) di Akun.
- **New Components:** PaymentCalculator, AdminFeeManager, ConvertToInstallmentDialog, DebugMenu, EditAccountForm.


### v0.4.2 (2026-01-02)
- **Minimum Balance Interest Calculation (Refactor):**
    - **Bunga Bank Presisi:** Implementasi metode "Saldo Terendah" (Minimum Balance) untuk bunga bank, meningkatkan akurasi dari ~60% ke 90%+ dengan sistem anti-manipulasi saldo akhir.
    - **Engine Robust:** Penanganan otomatis untuk akun baru mid-month, akun tanpa transaksi, dan isolasi error per-akun.
    - **Performance Optimized:** Penambahan database indexes dan optimasi query chronological replay (teruji <15ms untuk 1000 transaksi).
    - **Safety First:** Sistem fallback otomatis ke metode Saldo Akhir jika terjadi timeout (>1 detik) atau error pada kalkulasi presisi.
    - **Rollout Ready:** Feature flag `USE_MIN_BALANCE_METHOD` disiapkan untuk aktivasi bertahap.
    - **Notifikasi Modern:** Integrasi library `sonner` untuk sistem toast notification yang lebih informatif dan modern (menggantikan browser alert).
    - **Real-time Dashboard:** Log aktivitas otomasi di halaman Pengaturan kini langsung terupdate begitu tombol diklik tanpa refresh manual.
    - **Database Inspector:** Tabel pengaturan kini transparan dan bisa dicek langsung di `/devdb`.
    - **UI Detail:** Tooltip penjelasan metode perhitungan pada detail akun dan kalkulator bunga.

### v0.4.1 (2026-01-02)
- **Refactor Flexible Account Templates (Phase 1):**
  - Schema Update: Menambahkan field otomasi fleksibel (biayaAdminAktif, bungaAktif, bungaTiers, dll) ke model `Akun`.
  - Migrasi Data: Implementasi script migrasi untuk memindahkan data dari template global ke individual accounts.
  - Data Integrity: Berhasil melakukan migrasi pada akun existing dengan mode dry-run dan live.

- **Refactor Flexible Account Templates (Phase 2):**
    - Implementasi Reusable Components: `PatternBuilderUI`, `TierEditor`, `InterestCalculator`, dan `ComparisonTable`.
    - Visualisasi: Penambahan preview jadwal tagihan (5 ke depan) dan range visual tier bunga.
    - Simulasi: Kalkulator bunga otomatis dengan potongan pajak 20% untuk membantu user melakukan pengecekan data kustom.

- **Refactor Flexible Account Templates (Phase 3):**
    - Server Actions Update: Memperbarui `akun.ts` dan `recurring-admin.ts` untuk mendukung kepemilikan data otomasi di tingkat Akun.
    - Isolasi Transaksi: Implementasi `Prisma Transaction` per-akun untuk memastikan kegagalan pada satu akun tidak menghentikan proses akun lainnya.
    - Robust Error Handling: Logging error mendalam ke `LogSistem` dengan context lengkap (akunId, context, error message).
    - Fitur Reset: Penambahan fungsi `resetAccountToTemplate` untuk memudahkan user kembali ke pengaturan standar pabrikan.

- **Refactor Flexible Account Templates (Phase 4):**
    - UI Update: Halaman Detail Akun kini menggunakan sistem `Tabs` (Ringkasan vs Pengaturan).
    - Account Settings: Implementasi full-featured settings page untuk kontrol per-akun terhadap biaya admin dan bunga.
    - Starting Point UX: Form tambah akun kini mendukung auto-fill template yang tetap dapat diedit sepenuhnya sebelum disimpan.
    - Audit Trail: Penambahan fitur `Comparison Table` untuk melihat deviasi dari template dan log histori perubahan.

- **Refactor Flexible Account Templates (Phase 5):**
    - Dashboard Widget: Update `AdminFeeReminder` untuk menampilkan ringkasan hasil proses massal (Berhasil vs Gagal).
    - Reporting: Integrasi navigasi cepat dari widget ke Log Sistem jika terjadi kegagalan proses.
    - Log Filtering: Update halaman Pengaturan untuk memfilter log secara spesifik berdasarkan modul `ADMIN_FEE` dan `INTEREST` guna transparansi aktivitas otomasi.

### v0.4.0 (2026-01-02)
- **NEW: Account Templates & Automasi Perbankan:**
  - Implementasi sistem template untuk otomatisasi biaya admin dan bunga bank.
  - Template bawaan: BCA Xpresi, BCA Tahapan, Mandiri, BNI, dan Custom.
  - **Automasi Biaya Admin:** Perhitungan cerdas berdasarkan pola (Tanggal Tetap, Jumat Minggu ke-3, Hari Kerja Terakhir).
  - **Automasi Bunga Tabungan:** Perhitungan bunga berjenjang (tier) berdasarkan saldo akhir bulan dengan potongan pajak 20%.
  - **Dashboard Widget:** "Pengingat Biaya Admin" untuk tagihan dalam 7 hari ke depan dengan tombol proses cepat.
  - **Account Integration:** Auto-fill form akun menggunakan template, badge informasi template pada card akun, dan section detail template di halaman detail akun.
  - **Settings Integration:** Section "Automasi Keuangan" dengan pemicu manual, mode simulasi (Dry Run), dan tampilan 5 log aktivitas terakhir.
  - **Technical:** Penggunaan Prisma Transaction dan row-level logic untuk menjamin integritas data saat proses automasi massal.

### v0.3.7 (2026-01-02)
- **Database & Performance Optimization:**
  - Menambahkan index pada tabel `Transaksi` (tanggal, kategori, akun) untuk query yang lebih cepat.
  - Implementasi auto-pruning `LogSistem` (> 30 hari) saat aplikasi dibuka.
  - Optimasi query agregat analytics menggunakan Prisma `aggregate` dan `groupBy`.
  - Optimasi kalkulasi trend saldo harian (mengurangi kompleksitas dari O(N*M) ke O(N)).
- **Account Enhancements:**
  - **NEW: Halaman Detail Akun** (`/akun/[id]`) menampilkan trend saldo spesifik akun dan 10 transaksi terakhir.
  - Navigasi detail dari kartu akun dan dropdown menu.
- **Transaction Enhancements:**
  - **NEW: Running Balance** (Saldo Setelah Transaksi) pada tabel riwayat saat memfilter per akun.
- **Budget Enhancements:**
  - **NEW: Budget Insights:** Menampilkan "Sisa Hari" dan "Saran Pengeluaran Harian" untuk membantu menjaga anggaran.

### v0.3.6 (2026-01-02)
- **NEW: Drill-down Dashboard Terintegrasi**
  - Grafik `ExpensePieChart` di Dashboard sekarang interaktif (clickable).
  - Modal detail kategori menampilkan: Total, Jumlah Transaksi, Trend Mingguan (Bar Chart), dan Daftar Transaksi Terkini.
  - Penambahan `ResponsiveContainer` pada chart detail untuk tampilan mobile yang sempurna.
- **Maintenance & Bug Fixes:**
  - **Fix:** Redundansi legend pada Dashboard.
  - **Fix:** Prisma type error pada `getRecurringTransactions` (empty include).
  - **Fix:** TypeScript type mismatches pada `AddAccountForm` dan `AddTransactionForm` terkait `z.coerce.number()`.
  - **UI:** Peningkatan styling dialog detail dengan standar Slate/Emerald.

### v0.3.5 (2025-12-29)
- **NEW: Template Transaksi** (`/template`)
  - Simpan transaksi favorit sebagai template
  - Quick-add button untuk transaksi cepat
  - Usage count tracking
  - CRUD lengkap dengan delete confirmation
- **NEW: Grafik Harta Bersih (Net Worth)**
  - Area chart di Dashboard
  - Total Aset vs Total Hutang
  - Perubahan 30 hari terakhir + persentase
  - Auto-snapshot untuk histori
- **NEW: Multi-Currency Support**
  - 10 mata uang: USD, EUR, SGD, MYR, JPY, GBP, AUD, CNY, KRW
  - Integrasi API currencyapi.net (optional, butuh API key gratis)
  - Currency rate management di Pengaturan
  - Konverter dengan simulasi biaya bank (0-5%)
  - Auto-convert ke IDR saat transaksi
- **Schema Update:**
  - TemplateTransaksi, NetWorthSnapshot, CurrencyRate, AppSetting

### v0.3.4 (2025-12-29)
- **NEW: Kalender Keuangan** (`/kalender`)
  - View bulanan dengan navigasi prev/next
  - Tampilkan event: cicilan, recurring, transaksi
  - Click tanggal untuk lihat detail
  - Summary cards: jumlah cicilan/recurring/transaksi
- **NEW: Budget Chart**
  - Visualisasi anggaran vs realisasi
  - Bar chart dengan warna status (aman/hampir/melebihi)
  - Ditambahkan ke halaman Anggaran
- **Chart Responsive Fix**
  - Gunakan useRef + offsetWidth untuk actual container size
  - Chart fill container di desktop, compact di mobile

### v0.3.3 (2025-12-29)
- **Major Fix: Chart Mobile Display**
  - Hapus ResponsiveContainer (cause of width(-1) error)
  - Gunakan fixed dimensions + window.innerWidth calculation
  - Semua chart (Pie, Bar, Area) sekarang tampil di mobile
- **UI Fixes:**
  - Tombol Cicilan/Riwayat overflow → truncate + shrink-0
  - Bar chart Statistik → fixed pixel height
  - Text Tersedia overflow → truncate

### v0.3.2 (2025-12-29)
- **NEW: Halaman Statistik/Insight:**
  - Cash Flow Table (ringkasan income vs expense)
  - Income & Expense Book (breakdown per kategori)
  - Spending Insights (top kategori, tren, pola harian)
  - Rekomendasi keuangan otomatis
  - Period selector: 7H, 30H, 12M, 6B, 1T
- **Mobile UI Improvements:**
  - Fix: Chart tidak tampil → explicit height/minWidth
  - Fix: Legend chart overflow → grid layout, truncate
  - Fix: Tombol Cicilan/Riwayat overflow
  - Fix: Transaksi tabel → card list di mobile
  - Fix: Sidebar desktop sticky
- **Technical:**
  - Server actions: getCashFlowTable, getIncomeExpenseBook, getSpendingInsights
  - Layout restructure untuk sticky sidebar

### v0.3.1 (2025-12-27)
- **Fix Chart Visibility:**
  - Area Chart hijau gradient untuk Trend Saldo (lebih terlihat)
  - Bar Chart warna merah (bulan ini) vs biru (bulan lalu)
  - Y-axis domain dinamis agar variasi data terlihat
- **Fix Mobile Responsiveness:**
  - Overflow-x hidden di layout, main, container
  - CSS base layer untuk mobile viewport fix
  - Header halaman Akun & Pengaturan responsive

### v0.3.0 (2025-12-27)
- **Chart Improvements (Paket A + B):**
  - Area Chart: Trend saldo harian 30 hari
  - Bar Chart: Perbandingan bulan ini vs bulan lalu
  - Donut Chart: Komposisi aset per akun
  - Drill-down Pie Chart: Detail per kategori
- Server actions: getSaldoTrend, getMonthlyComparison, getAccountComposition, getCategoryDetail

### v0.2.2 (2025-12-27)
- **Stabilisasi UX:**
  - Loading skeletons untuk semua halaman
  - Error boundaries: global-error.tsx, error.tsx, not-found.tsx
  - Komponen reusable: skeleton.tsx, form-field.tsx, confirm-dialog.tsx
- All delete actions sudah ada konfirmasi dialog

### v0.2.1 (2025-12-27)
- Filter: Remove individual per chip (X button)
- Filter: PAGE_SIZE 10 → 25
- Privacy: `data-private` di SEMUA halaman
- Rule: standar-logging.md

### v0.2.0 (2025-12-27)
- Fitur Cicilan & Budget lengkap
- Backup/Restore fungsional
- Mobile hamburger menu
- Privacy mode (CSS blur dengan data-private)
- **Filter Transaksi:**
  - Quick filters: Hari Ini, Minggu Ini, Bulan Ini, Bulan Lalu
  - Date range picker (dari/sampai)
  - Nominal range + preset (<100rb, 100rb-500rb, dll)
  - Multi kategori dropdown
  - Sorting by tanggal/nominal/kategori (asc/desc)

### v0.1.0 (2025-12-26)
- Inisialisasi proyek, CRUD Akun & Transaksi
- Dashboard grafik, Laporan bulanan
- Recurring transaction, Transfer antar akun

