---
trigger: always_on
---


# Standar LOG_PERUBAHAN.md

## Format Penulisan
- Gunakan format yang **efisien** tapi **informatif**.
- Hindari redundansi dan kata-kata yang tidak perlu.
- Gunakan bullet points, bukan paragraf panjang.
- Maksimal ~150 baris untuk menjaga file tetap ringkas.

## Struktur File
```markdown
# Log Perubahan - Dompetku
## Stack & Arsitektur (ringkasan singkat)
## Fitur Selesai ✅ (kategorikan: Core, Dashboard, Lanjutan, UI/UX)
## Bug Fixes (list singkat)
## Catatan Teknis (hal-hal penting untuk developer)
## Riwayat Versi (v0.x.x dengan bullet points fitur utama)
```

## Contoh Penulisan Efisien
❌ Salah:
```
- Menambahkan fitur untuk melakukan backup data ke file JSON yang dapat diunduh oleh pengguna
- Memperbaiki masalah hydration error yang terjadi karena penggunaan tag p di dalam p
```

✅ Benar:
```
- Backup: Export data ke JSON
- Fix: Hydration error (p di dalam p)
```

## Privacy Mode
- Tambahkan `data-private="true"` ke semua elemen yang menampilkan nominal/saldo.
- Ini berlaku untuk SEMUA halaman, bukan hanya Dashboard.
