# Instruksi: Toggle "Show Dummy Data" di Sidebar

## 🎯 Objective

Buat tombol toggle di sidebar untuk mengisi/menghapus data dummy di **semua tabel** database (akun, transaksi, cicilan, recurring, budget, kategori, admin fee, dll).

---

## 📦 Deliverables

### 1. **Database Repository**

**File**: `src/lib/db/dummy-data-repo.ts`

**Functions Required**:

```typescript
- toggleDummyData(): Promise<boolean> // Main toggle function
- isDummyDataActive(): Promise<boolean> // Check current status
- generateAllDummyData(): Promise<void> // Populate all tables
- clearAllDummyData(): Promise<void> // Delete all dummy records
```

**Implementation Notes**:

- Simpan status toggle di tabel `AppSetting` dengan key `'dummy_data_active'`
- Tandai semua record dummy dengan field `isDummy: true` (tambahkan ke schema jika perlu)
- Gunakan Dexie transaction untuk atomic operations
- Generate data yang **valid** tapi **tidak perlu konsisten** antar tabel
- Tetap patuhi constraint database (unique fields, foreign keys, dll)

**Dummy Data Minimal**:

```
Akun: 15 records (5 Bank, 4 E-Wallet, 3 Cash, 3 Credit Card)
Transaksi: 2000 records (random dates Februari 2025 - Februari 2026)
Kategori: 16 records (sesuai DEFAULT_CATEGORIES)
Cicilan: 12 records (mix aktif, lunas, overdue)
Recurring: 15 records (harian, mingguan, bulanan, tahunan)
Budget: 12 records (semua bulan di 2025-2026)
Admin Fee: 8 records (berbagai akun dengan pattern berbeda)
NetWorth Snapshot: 12 records (snapshot per bulan)
```

**Transaksi Distribution**:

- Spread merata: ~167 transaksi/bulan (~5-6 transaksi/hari)
- Ratio Income:Expense = 1:3 (500 income, 1500 expense)
- Range nominal: Rp 5.000 - Rp 5.000.000
- Kategori terbanyak: Makanan (30%), Transport (20%), Belanja (15%)

---

### 2. **UI Component**

**File**: `src/components/layout/dummy-data-toggle.tsx`

**Requirements**:

- Toggle button dengan icon Database
- Show loading state saat generate/clear data
- Tampilkan status "Active" atau "Inactive"
- Auto-reload page setelah toggle (untuk refresh data)
- Handle error dengan toast notification

**Design**:

- Letakkan di sidebar bawah (di atas Theme Toggle)
- Style sesuai existing sidebar buttons
- Icon: `Database` dari lucide-react
- Warna: yellow/warning untuk indicate testing mode

---

### 3. **Integration ke Sidebar**

**File**: `src/components/layout/sidebar.tsx`

**Changes**:

```tsx
// Tambahkan di section bawah (sebelum Theme Toggle)
<div className="border-t pt-4 mt-4">
  <DummyDataToggle />
</div>
```

---

## ⚠️ Critical Rules

1. **Data Integrity**:
   - Jangan corrupt data real user
   - Semua dummy data HARUS punya flag `isDummy: true`
   - Clear function hanya hapus record dengan `isDummy: true`

2. **Performance**:
   - Gunakan bulk insert dengan batch 500 records
   - Max 15-20 detik untuk generate 2000+ records
   - Show progress bar (0% → 100%) dengan status text
   - Generate kategori & akun dulu, baru transaksi (untuk foreign keys)

3. **Double-Entry**:
   - Transaksi tetap balanced (debit = kredit)
   - Update saldo akun sesuai transaksi dummy
   - Jangan buat orphan records

4. **Validation**:
   - Semua field required harus terisi
   - Tanggal dalam range valid (tidak masa depan untuk transaksi)
   - Nominal positif untuk semua amounts

---

## 📝 Notes

- Data dummy **harus semi-realistic** untuk testing analytics/charts
- Tanggal: Februari 2025 - Februari 2026 (span 1 tahun penuh)
- Pattern: Gaji tiap tanggal 25, tagihan listrik tanggal 5, cicilan tanggal 10
- Saldo akun: harus balanced sesuai transaksi history
- Prioritas: **realistic patterns** > speed (untuk testing analytics features)
- User harus tau ini data testing (beri warning badge jika active)

---

## 🚀 Implementation Order

1. Tambahkan field `isDummy` ke semua tabel schema (optional boolean)
2. Buat `dummy-data-repo.ts` dengan generate functions
3. Buat `dummy-data-toggle.tsx` component
4. Integrate ke `sidebar.tsx`
5. Test toggle ON/OFF beberapa kali
6. Verify semua pages render correctly dengan dummy data

---

**Estimated Time**: 3-4 hours (karena generate 2000+ records butuh logic lebih kompleks)
**Priority**: Medium (nice-to-have untuk demo/testing, critical untuk development)
