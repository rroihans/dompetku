# 🧠 Business Logic - Dompetku

Dokumen ini menjelaskan logika bisnis utama yang menggerakkan fitur-automasi dan perhitungan di Dompetku.

## 1. Sistem Pembukuan (Double-Entry)
Dompetku menggunakan prinsip dasar akuntansi di mana setiap transaksi melibatkan minimal dua akun:
- **Debit**: Akun yang menerima nilai (Aset bertambah atau Biaya bertambah).
- **Kredit**: Akun yang memberikan nilai (Aset berkurang atau Pendapatan bertambah).

Contoh: Makan di Restoran Rp 50.000 menggunakan BCA.
- `debitAkunId`: Akun Kategori "Makan" (Tipe EXPENSE)
- `kreditAkunId`: Akun "BCA" (Tipe BANK)

## 2. Otomatisasi "Sync on Open"
Setiap kali aplikasi dibuka (melalui `src/app/api/cron/daily/route.ts` atau trigger di dashboard), sistem menjalankan:
1. **Biaya Admin**: Memeriksa akun yang memiliki `biayaAdminAktif` dan menarik biaya sesuai pola (Fixed Date, Last Working Day, dll).
2. **Bunga Tabungan**: Menghitung bunga berdasarkan saldo harian/bulanan jika `bungaAktif`.
3. **Cicilan**: Men-generate transaksi cicilan baru jika sudah masuk tanggal jatuh tempo.
4. **Recurring**: Mengeksekusi transaksi berulang yang jadwalnya jatuh pada hari tersebut.

## 3. Perhitungan Cicilan Kartu Kredit
Logika cicilan berada di [`src/app/actions/cicilan.ts`](../src/app/actions/cicilan.ts):
- **Tenor**: Jumlah bulan cicilan.
- **Bunga**: Bisa 0% atau bunga efektif per bulan.
- **Biaya Admin**: Bisa berupa nilai flat atau persentase dari pokok.
- **Status**: Berubah dari `AKTIF` menjadi `LUNAS` setelah `cicilanKe` mencapai `tenor`.

## 4. Manajemen Anggaran (Budgeting)
- Anggaran dihitung per kategori per bulan kalender.
- Sistem memberikan peringatan (Notification) jika pengeluaran di kategori tertentu mencapai 80% dan 100% dari limit.

## 5. Penanganan Presisi Uang
Untuk menghindari error pembulatan floating point (0.1 + 0.2 != 0.3):
- Semua input dikonversi ke **Sen** (dikali 100).
- Semua operasi matematika dilakukan pada integer.
- Konversi kembali ke desimal hanya dilakukan di layer presentasi (UI).
- Utility: [`src/lib/money.ts`](../src/lib/money.ts) dan [`src/lib/decimal-utils.ts`](../src/lib/decimal-utils.ts).
