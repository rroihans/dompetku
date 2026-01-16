# Specification: Minimum Balance Interest Calculation Refactor (Production-Ready)

## 1. Overview
Refactor metode perhitungan bunga tabungan dari "Saldo Akhir" menjadi "Saldo Terendah" (Minimum Balance) bulanan. Implementasi ini mencakup penanganan edge cases akun baru, optimasi performa database, dan sistem fail-safe dengan feature flag untuk rollout yang aman.

## 2. Functional Requirements

### A. Core Logic Refactor
- **Calculation Engine (`getMinimumBalanceForMonth`)**:
    1. **Saldo Awal**: Dihitung mundur dengan rumus `Current Balance - Σ(Mutasi dari awal bulan target s/d sekarang)`.
    2. **Chronological Replay**: Loop semua transaksi dalam bulan target secara kronologis.
    3. **Minimum Tracking**: Melacak titik terendah running balance selama replay.
- **Edge Case Handling**:
    - **Akun Baru**: Jika akun dibuat *mid-month*, saldo awal adalah saldo saat pembuatan, replay dimulai dari tanggal tersebut.
    - **Tanpa Transaksi**: Gunakan saldo sekarang sebagai saldo minimum.
    - **Timezone**: Memastikan transaksi jam 23:59 vs 00:01 diproses pada hari yang benar sesuai locale Indonesia.
- **Error Handling & Fail-safe**:
    - Wrapper try-catch dengan timeout 1 detik.
    - Fallback otomatis ke metode "Saldo Akhir" jika metode Min-Balance gagal/timeout.
    - Feature Flag: `USE_MIN_BALANCE_METHOD` (default: false) via AppSetting.

### B. UI/UX Enhancements
- **Indicators**: Tooltip "Bunga dihitung dari saldo terendah" pada label bunga di halaman akun detail.
- **Calculator**: Footer pada Interest Calculator dengan penjelasan metode dan link ke dokumentasi akurasi.
- **Notifications**: Toast notification jika proses automasi berhasil/gagal dengan informasi metode yang digunakan.

### C. Performance & Logging
- **Database**: Tambahkan index majemuk pada `(debitAkunId, tanggal)` dan `(kreditAkunId, tanggal)` untuk mempercepat query replay.
- **Metrics**: Target <50ms untuk 100 tx/bulan, <200ms untuk 1000 tx. Alert jika >500ms.
- **Log Format**: *"Peringatan: Akun [Nama] memiliki saldo minimum negatif (Rp [formatCurrency]) pada [Bulan]. Bunga dihitung sebagai 0% sesuai tier terendah."*

## 3. Rollback & Migration Strategy
- **Phase 1**: Feature flag default false. Soft launch via manual activation di DevTools.
- **Phase 2**: A/B Comparison. Hitung dengan kedua metode secara *side-by-side* di log untuk validasi target akurasi 80-90%.
- **Phase 3**: Full rollout.
- **Rollback Triggers**: Error rate >1%, Performance p95 >500ms, atau >5 laporan ketidaksesuaian angka bunga.

## 4. Acceptance Criteria (Negative Cases)
- Akun baru mid-month terhitung benar saldo awalnya.
- Akun tanpa transaksi tetap menghasilkan angka bunga (dari saldo statis).
- Saldo negatif sepanjang bulan menghasilkan bunga Rp 0 tanpa merusak sistem.
- Stress test: Akun dengan 1000+ transaksi tetap terproses <200ms.
