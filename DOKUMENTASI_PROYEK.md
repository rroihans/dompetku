# Dokumentasi Sistem Keuangan Personal

## Fitur Utama
1. **Multi-Akun:** Bank, E-Wallet, dan Kartu Kredit.
2. **Mesin Cicilan:** Otomatisasi pencatatan cicilan kartu kredit beserta biaya admin & bunga.
3. **Sync on Open:** Otomatisasi transaksi rutin saat aplikasi dibuka pertama kali setiap hari.
4. **Analitik:** Dashboard spending bulanan dan kategori.

## Skema Database (Prisma)
- **Akun:** id, nama, tipe (BANK, WALLET, CREDIT_CARD), saldo.
- **Transaksi:** id, tanggal, deskripsi, nominal, debitAkunId, kreditAkunId.
- **RencanaCicilan:** id, nama, pokok, tenor, cicilanKe, bunga, adminFee, status.
- **LogSistem:** id, level, pesan, timestamp.