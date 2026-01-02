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

