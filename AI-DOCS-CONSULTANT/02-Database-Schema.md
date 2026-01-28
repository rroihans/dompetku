# 🗄️ Database Schema - Dompetku

Aplikasi ini menggunakan **SQLite** dengan **Prisma ORM**. Arsitektur database dirancang untuk mendukung sistem pembukuan berpasangan (*double-entry bookkeeping*) sederhana.

## 🗺️ Entity Relationship Diagram (Ringkasan)

### 1. Akun (`akun`)
Menyimpan informasi rekening bank, dompet digital, atau kartu kredit.
- `tipe`: BANK, E_WALLET, CREDIT_CARD, CASH, EXPENSE, INCOME.
- `saldoSekarang`: Disimpan dalam satuan **Sen** (BigInt) untuk menghindari masalah presisi floating point.
- `templateId`: Relasi ke `AccountTemplate` untuk pengaturan otomatis.

### 2. Transaksi (`transaksi`)
Jantung dari aplikasi (General Ledger).
- `debitAkunId` & `kreditAkunId`: Menentukan aliran dana.
- `nominal`: Disimpan dalam satuan **Sen** (BigInt).
- `idempotencyKey`: Mencegah duplikasi transaksi saat proses otomatisasi.

### 3. Rencana Cicilan (`rencana_cicilan`)
Mesin otomatisasi untuk kartu kredit.
- Melacak tenor, bunga, dan sisa cicilan.
- Terhubung ke `transaksi` untuk histori pembayaran.

### 4. Anggaran (`budget`)
- Melacak limit pengeluaran per kategori per bulan/tahun.

### 5. Transaksi Berulang (`recurring_transaction`)
- Mendukung frekuensi HARIAN, MINGGUAN, BULANAN, TAHUNAN.
- Digunakan untuk biaya admin otomatis atau langganan.

## 🛠️ Detail Model Prisma

Lihat file lengkap di [`prisma/schema.prisma`](../prisma/schema.prisma).

### Penanganan Mata Uang
Semua nilai moneter utama (`nominal`, `saldoSekarang`, `totalPokok`) menggunakan tipe data `BigInt` di Prisma yang dipetakan ke Integer di SQLite. 
**Aturan:** `1000` di database = `Rp 10,00`.

## 🚀 Indeks Performa
Beberapa indeks telah ditambahkan untuk mempercepat query laporan:
- `@@index([tanggal, id])` pada tabel Transaksi.
- `@@index([debitAkunId, tanggal])` dan `@@index([kreditAkunId, tanggal])`.
- `@@index([status, tanggalJatuhTempo])` pada Rencana Cicilan.
