# 🎨 Frontend Structure - Dompetku

Dompetku menggunakan **Next.js App Router** dengan arsitektur berbasis komponen yang modular.

## 📂 Struktur Direktori `src/`

### 1. `app/` (Routing & Pages)
-   **`actions/`**: Berisi **Server Actions** untuk interaksi database. Ini adalah pengganti API Route tradisional untuk operasi mutasi data.
-   **`api/`**: Route handlers untuk integrasi eksternal (seperti Cron Jobs).
-   **`akun/`, `transaksi/`, `cicilan/`, dll**: Folder route yang berisi `page.tsx` dan `loading.tsx`.

### 2. `components/` (UI Components)
-   **`ui/`**: Komponen dasar dari Shadcn UI (Button, Input, Dialog, dll).
-   **`charts/`**: Wrapper untuk Recharts yang menangani visualisasi data.
-   **`forms/`**: Komponen form kompleks (Add Transaction, Add Account) yang menggunakan `react-hook-form`.
-   **`layout/`**: Komponen navigasi (Sidebar, BottomNav) dan elemen global.

### 3. `lib/` (Utilities)
-   **`prisma.ts`**: Singleton instance untuk Prisma Client.
-   **`format.ts`**: Fungsi untuk format mata uang Rupiah dan tanggal.
-   **`money.ts`**: Logika konversi Sen <-> Rupiah.
-   **`validations/`**: Skema Zod untuk validasi input form.

## 🚀 Pola Pengembangan

### Server Actions
Hampir semua interaksi data menggunakan Server Actions yang didefinisikan di [`src/app/actions/`](../src/app/actions/).
Contoh penggunaan:
```typescript
// src/app/actions/transaksi.ts
export async function createTransaksi(data: TransaksiInput) {
  // Logika server-side
  revalidatePath('/transaksi');
}
```

### Client Components vs Server Components
-   **Server Components**: Digunakan untuk halaman utama dan fetching data awal (lebih cepat, SEO friendly).
-   **Client Components**: Digunakan untuk form, chart, dan elemen interaktif (menggunakan direktif `'use client'`).

### State Management
-   Menggunakan **URL State** untuk filter dan pencarian (via `useSearchParams`).
-   Menggunakan **React Context** atau local state untuk UI sederhana.
-   Data persistence dikelola langsung oleh database melalui Server Actions.

## 📱 Responsivitas
Aplikasi didesain dengan pendekatan **Mobile-First**:
-   Navigasi bawah (`BottomNav`) untuk perangkat mobile.
-   Sidebar untuk perangkat desktop.
-   Tabel yang dapat di-scroll secara horizontal atau berubah menjadi tampilan card pada layar kecil.
