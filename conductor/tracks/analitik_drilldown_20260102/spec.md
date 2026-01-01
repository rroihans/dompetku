# Spec: Drill-down Kategori Pengeluaran

## Deskripsi
Menambahkan fungsionalitas interaktif pada grafik pengeluaran (Pie Chart) di Dashboard/Laporan. Pengguna dapat mengeklik potongan kategori untuk melihat daftar transaksi detail yang menyusun total pengeluaran tersebut.

## Kebutuhan Fungsional
- Pengguna dapat mengeklik segmen pada `ExpensePieChart`.
- Menampilkan modal atau area detail yang berisi daftar transaksi untuk kategori tersebut.
- Data transaksi yang ditampilkan harus sesuai dengan filter periode (bulan/tahun) yang sedang aktif.
- Daftar transaksi mencakup: Tanggal, Deskripsi, Nominal, dan Akun Sumber (Kredit).

## Kebutuhan Non-Fungsional
- UI menggunakan palet warna Slate/Emerald sesuai standar.
- Transisi yang halus saat membuka detail.
- Responsif (Mobile-Friendly).
- Menggunakan Bahasa Indonesia untuk semua teks.

## Teknis
- Memperluas Server Action `src/app/actions/analytics.ts` jika diperlukan data tambahan.
- Menggunakan komponen `Dialog` atau `Drawer` dari Shadcn UI untuk tampilan detail.
