---
description: Menyiapkan lingkungan awal proyek dan sinkronisasi status terakhir.
---

# Inisialisasi Proyek Keuangan Enterprise
Deskripsi: Menyiapkan lingkungan awal proyek dan sinkronisasi status terakhir.

## Langkah-langkah:
1. Baca semua file di `.agent/rules/`.
2. Baca file `LOG_PERUBAHAN.md` untuk melihat status terakhir.
3. Jalankan pengecekan skema database `prisma/schema.prisma`.
4. Berikan ringkasan status sistem saat ini kepada user dalam Bahasa Indonesia yang profesional.
5. Tanyakan tugas spesifik apa yang ingin diselesaikan hari ini.
6. Kamu bisa selalu cari di internet untuk troubleshooting, belajar, atau validasi pengetahuan kamu.

## Aturan Pengembangan:

### Data Dummy
- **WAJIB** buat data dummy untuk setiap fitur baru yang memerlukan data untuk testing.
- Gunakan script di folder `scripts/` dengan format `generate-[nama-fitur]-dummy.ts`.
- Data dummy harus realistis dan mengikuti standar Indonesia (nominal Rupiah, nama produk lokal, dll).

### Validasi UI
- **JANGAN** gunakan live browser/browser_subagent untuk validasi tampilan.
- Biarkan USER yang validasi secara mandiri.
- Minta USER untuk memberikan feedback jika ada masalah visual.
- Fokus pada kode yang benar dan kompilasi tanpa error.

### Workflow Fitur Baru:
1. Buat server actions terlebih dahulu.
2. Buat komponen form dan actions.
3. Update halaman dengan data dari database.
4. Buat script dummy data.
5. Update LOG_PERUBAHAN.md.
6. Berikan ringkasan ke USER, minta validasi manual.