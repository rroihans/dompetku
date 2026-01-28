# 💰 Dompetku - PWA Offline-First Finance Manager 
> **v0.8.1 (Beta)**

Dompetku adalah aplikasi manajemen keuangan personal modern yang **sepenuhnya berjalan di browser (Offline-First)**. Dibangun ulang dari arsitektur server-side menjadi **Client-Side** menggunakan **Next.js 16**, **Dexie.js (IndexedDB)**, dan **Tailwind CSS v4**.

Aplikasi ini dirancang untuk privasi total. Tidak ada data keuangan yang dikirim ke cloud; semua data tersimpan aman di perangkat Anda.

## ✨ Fitur Utama

### 1. 🏦 Multi-Akun & Aset
Kelola seluruh portofolio keuangan Anda dalam satu dashboard terpadu:
- **Bank & E-Wallet**: Catat saldo dari berbagai sumber (BCA, Mandiri, GoPay, OVO).
- **Kartu Kredit**: Pelacakan limit, tanggal cetak tagihan (billing), dan jatuh tempo.
- **Cash & Tabungan**: Pantau uang tunai dan tabungan target.
- **Kustomisasi**: Atur warna dan ikon unik untuk setiap akun agar mudah dikenali.

### 2. 💳 Mesin Cicilan Cerdas (Smart Installment)
Fitur unggulan untuk pengguna kartu kredit:
- **Konversi Transaksi**: Ubah transaksi besar menjadi cicilan (3/6/12 bulan).
- **Simulasi Bunga**: Hitung estimasi bunga dan biaya layanan otomatis.
- **Reminder**: Notifikasi jatuh tempo cicilan agar tidak telat bayar.
- **Tracking**: Lihat sisa pokok hutang dan progres pelunasan secara visual.

### 3. 🔄 Transaksi Berulang (Recurring)
Jangan pernah lupa mencatat tagihan rutin:
- **Jadwal Fleksibel**: Harian, Mingguan, Bulanan, atau Tahunan.
- **Template**: Simpan template transaksi (mis: "Bayar Listrik", "Gaji", "Spotify").
- **Auto-Generate**: Sistem otomatis membuat record transaksi saat tanggalnya tiba (saat aplikasi dibuka).

### 4. 📊 Analitik & Visualisasi Data
Pahami kebiasaan belanja Anda dengan grafik interaktif:
- **Expense Heatmap**: Lihat intensitas belanja Anda dalam tampilan kalender (seperti GitHub contributions).
- **Year-over-Year (YoY)**: Bandingkan performa keuangan tahun ini vs tahun lalu.
- **Category Breakdown**: Pie chart detail pengeluaran per kategori (Makan, Transport, dll).
- **Cashflow Stream**: Grafik alur uang masuk vs keluar harian.

### 5. 🔒 Privasi & Keamanan (Offline-First)
- **Local Storage**: Menggunakan IndexedDB browser. Data tidak pernah di-upload ke server manapun.
- **Backup & Restore**: Ekspor data ke file JSON terenkripsi untuk backup mandiri.
- **Tanpa Login Server**: Tidak perlu akun/email. Install dan langsung pakai.

### 6. 📱 Progressive Web App (PWA)
- **Installable**: Tambahkan ke Home Screen Android/iOS/Desktop.
- **Offline Mode**: Akses penuh ke riwayat transaksi dan input data baru tanpa internet.
- **Fast Loading**: Hampir instan karena tidak menunggu respon server.

---

## 🚀 Teknologi Stack

Aplikasi ini menggunakan stack teknologi modern untuk performa maksimal:

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Static Export)
-   **Database Client**: [Dexie.js](https://dexie.org/) (Wrapper High-Level untuk IndexedDB)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
-   **Validation**: [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)
-   **Charts**: [Recharts](https://recharts.org/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Date**: [Date-fns](https://date-fns.org/)

---

## 🛠️ Instalasi & Pengembangan

Karena aplikasi ini **Serverless / Static**, Anda tidak membutuhkan setup database server (MySQL/PostgreSQL) yang rumit. Cukup Node.js.

### Prasyarat
-   Node.js 20+

### Langkah-langkah
1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/dompetku.git
    cd dompetku
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Jalankan Mode Development**
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser.

4.  **Build untuk Produksi**
    ```bash
    npm run build
    ```
    Hasil build akan muncul di folder `/out`.

---

## 🌍 Deployment (Go Live)

Anda bisa men-deploy aplikasi ini secara **GRATIS** di hosting provider static manapun. Tidak perlu server backend.

### Opsi 1: Cloudflare Pages (Rekomendasi)
1.  Connect akun GitHub ke Cloudflare Pages.
2.  Pilih repo `dompetku`.
3.  **Build Command:** `npm run build`
4.  **Output Directory:** `out`
5.  Deploy!

### Opsi 2: Vercel
1.  Import project di Vercel.
2.  Framework Preset: **Next.js**.
3.  Pastikan Output Directory di-set ke `out` (jika tidak otomatis terdeteksi).

---

## 📖 Struktur Project

- `src/app`: Halaman & Routing (Next.js App Router).
- `src/components`: Komponen UI reusable (Button, Card, Modals).
- `src/lib/db`: Logika database client-side (Dexie/Repositories).
- `src/hooks`: Custom React Hooks.
- `public`: Aset statis (Gambar, Ikon PWA, Manifest).

## 📜 Lisensi

Proyek ini dibuat untuk tujuan edukasi dan penggunaan pribadi.
MIT License.
