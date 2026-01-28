# 📈 Current Status & Roadmap - Dompetku

## ✅ Fitur yang Sudah Selesai (v0.5.0)
- [x] **Core Engine**: Double-entry bookkeeping dengan BigInt (Sen).
- [x] **Account Management**: Support Bank, E-Wallet, dan Credit Card.
- [x] **Transaction**: Filter canggih, preset filter, dan pencarian.
- [x] **Installment Engine**: Konversi transaksi ke cicilan, template cicilan bank.
- [x] **Automation**: Biaya admin otomatis, bunga tabungan, dan recurring transactions.
- [x] **Analytics**: Heatmap pengeluaran, YoY comparison, drilldown pie chart.
- [x] **UI/UX**: Dark mode support, mobile responsive, shadcn/ui integration.
- [x] **Notifications**: Alert untuk budget, cicilan, dan saldo.

## 🛠️ Pekerjaan yang Sedang Berjalan
- [ ] Optimasi performa query untuk data transaksi > 10.000 record.
- [ ] Peningkatan akurasi perhitungan bunga untuk saldo yang sangat fluktuatif.
- [ ] Refactoring Server Actions untuk error handling yang lebih konsisten.

## 🚀 Rencana Masa Depan (Roadmap)
1. **Multi-User Support**: Sistem login dan sinkronisasi antar perangkat.
2. **AI Insights**: Analisis pola pengeluaran menggunakan LLM untuk memberikan saran finansial.
3. **Export/Import**: Dukungan ekspor ke Excel/PDF dan impor dari mutasi bank (CSV).
4. **Mobile App**: Versi native menggunakan React Native atau PWA yang lebih optimal.
5. **Investment Tracking**: Pelacakan portofolio saham/reksadana.

## 🐞 Known Issues
- Perhitungan saldo di dashboard terkadang membutuhkan refresh manual jika sinkronisasi otomatis gagal.
- Beberapa icon Lucide mungkin tidak muncul jika nama icon di database tidak sesuai.

---
*Terakhir diperbarui: 23 Januari 2026*
