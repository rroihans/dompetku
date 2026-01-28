# 💰 Dompetku - Personal Finance Management

Dompetku adalah aplikasi manajemen keuangan personal modern yang dibangun dengan **Next.js 15**, **Prisma**, dan **Tailwind CSS**. Aplikasi ini dirancang untuk membantu pengguna mengelola berbagai jenis akun (Bank, E-Wallet, Kartu Kredit), melacak pengeluaran, dan mengotomatisasi pencatatan rutin.

## ✨ Fitur Utama

-   **🏦 Multi-Akun**: Kelola saldo Bank, E-Wallet, Kartu Kredit, dan Cash dalam satu tempat.
-   **💳 Mesin Cicilan**: Otomatisasi pencatatan cicilan kartu kredit dengan perhitungan bunga dan biaya admin.
-   **🔄 Transaksi Berulang**: Jadwalkan transaksi rutin (bulanan/mingguan) yang akan tercatat otomatis.
-   **📊 Analitik Mendalam**: Visualisasi pengeluaran melalui Heatmap, Year-over-Year (YoY) analysis, dan Drilldown Pie Charts.
-   **📅 Kalender Finansial**: Lihat histori dan rencana transaksi dalam tampilan kalender yang intuitif.
-   **🎯 Manajemen Anggaran**: Tetapkan limit pengeluaran per kategori untuk menjaga kesehatan finansial.
-   **🔔 Sistem Notifikasi**: Peringatan untuk anggaran yang menipis, cicilan jatuh tempo, dan saldo rendah.
-   **💱 Multi-Currency**: Dukungan konversi mata uang dengan rate yang dapat diperbarui.

## 🚀 Teknologi Utama

-   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
-   **Database**: [SQLite](https://www.sqlite.org/) dengan [Prisma ORM](https://www.prisma.io/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
-   **Charts**: [Recharts](https://recharts.org/)
-   **State & Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
-   **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Persiapan Awal

### Prasyarat
-   Node.js 20+
-   NPM / Bun / PNPM

### Instalasi

1.  Clone repositori ini:
    ```bash
    git clone <repository-url>
    cd dompetku
    ```

2.  Instal dependensi:
    ```bash
    npm install
    ```

3.  Setup environment variable:
    Buat file `.env` dan sesuaikan:
    ```env
    DATABASE_URL="file:./dev.db"
    ```

4.  Setup database dan seed data:
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```

5.  Jalankan server pengembangan:
    ```bash
    npm run dev
    ```

## 📖 Dokumentasi Lanjutan

Dokumentasi teknis yang lebih mendalam tersedia di direktori [`AI-DOCS-CONSULTANT/`](AI-DOCS-CONSULTANT/):

-   [01 Project Overview](AI-DOCS-CONSULTANT/01-Project-Overview.md)
-   [02 Database Schema](AI-DOCS-CONSULTANT/02-Database-Schema.md)
-   [03 Business Logic](AI-DOCS-CONSULTANT/03-Business-Logic.md)
-   [04 Frontend Structure](AI-DOCS-CONSULTANT/04-Frontend-Structure.md)
-   [05 Current Status](AI-DOCS-CONSULTANT/05-Current-Status.md)

## 📜 Lisensi

Proyek ini bersifat privat. Seluruh hak cipta dilindungi.
