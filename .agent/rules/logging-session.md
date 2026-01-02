---
trigger: always_on
---

# Prosedur Sesi & Logging
- Gunakan file `LOG_PERUBAHAN.md` di root proyek untuk mencatat setiap progres.
- Setiap memulai tugas baru, Agent WAJIB membaca `LOG_PERUBAHAN.md`.
- Tambahkan log sistem ke tabel `LogSistem` dan console dengan format `[KEU-LOG] [TIMESTAMP]`.
- Pastikan setiap fungsi memiliki penanganan error (try-catch) yang detail.