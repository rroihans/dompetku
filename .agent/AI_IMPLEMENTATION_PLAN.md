# Implementation Plan: Mobile-First Improvements

## ✅ Completed Tasks

### 1. ✅ Edit Akun - Color Picker
**Status**: Sudah ada di kode existing
- File: `src/components/akun/edit-account-form.tsx` (lines 183-201)
- Color picker dengan 8 preset colors sudah diimplementasikan
- Berfungsi dengan baik untuk edit warna akun

### 2. ✅ Filter Transaksi - Hide Default + Toggle
**Status**: Selesai diimplementasikan
- File Modified: `src/app/transaksi/page.tsx`
- Changes:
  - Added `showFilter` state (default: false)
  - Added toggle button dengan icon Filter
  - Filter panel sekarang conditional rendering: `{showFilter && <AdvancedFilterPanel />}`
- UX: Mobile-friendly dengan tombol "Tampilkan Filter" / "Sembunyikan Filter"

---

## ⏳ Remaining Tasks (Priority Order)

### 3. 💥 Halaman Kategori dengan Hierarki

#### Database Schema Changes
**New Table: `KategoriRecord`**
```typescript
export interface KategoriRecord {
  id: string;
  nama: string;
  parentId?: string | null;  // null = kategori utama
  icon: string;              // lucide icon name
  warna: string;             // hex color
  nature: 'MUST' | 'NEED' | 'WANT';  // sesuai gambar referensi
  show: boolean;             // visibility toggle
  order: number;             // untuk sorting
  createdAt: Date;
  updatedAt: Date;
}
```

**Database Version Bump**: v3 → v4
- Add table `kategori`
- Migration strategy: Create default categories dari existing kategori di transaksi

#### New Files Required

**Repository:**
- `src/lib/db/kategori-repo.ts` (CRUD + logic)

**Pages:**
- `src/app/kategori/page.tsx` (List semua kategori)
- `src/app/kategori/[id]/page.tsx` (Detail + Edit kategori + Manage subcategories)

**Components:**
- `src/components/kategori/kategori-card.tsx` (Card untuk list view)
- `src/components/kategori/create-kategori-dialog.tsx` (Dialog buat kategori baru)
- `src/components/kategori/edit-kategori-form.tsx` (Form edit existing)
- `src/components/kategori/subcategory-list.tsx` (List subcategories dengan CRUD)

#### UI/UX Design (dari gambar referensi)
**List Page** (`/kategori`):
- Header: "Edit category"
- Section "ALL CATEGORIES"
- Cards dengan:
  - Icon circle dengan warna
  - Nama kategori
  - Tap untuk ke detail

**Detail Page** (`/kategori/[id]`):
- Header dengan back button
- Large icon circle (editable) dengan warna
- Fields:
  - **Name**: Text input (editable)
  - **Category nature**: Dropdown (Must/Need/Want) (editable)
  - **Show**: Toggle switch
- Section "SUBCATEGORIES"
  - List subcategories dengan icon + nama
  - Tombol "Add Subcategory"

#### Breaking Changes & Migration
**Impact**: Transaksi existing menggunakan `kategori: string` (nama kategori)
**Solution**: 
1. Keep backward compatibility: `kategori` field tetap string
2. Saat create kategori, sync dengan table `kategori`
3. Validation: Kategori name harus exist di table OR auto-create

**Migration Script** (optional):
```typescript
// Buat kategori default dari transaksi existing
async function migrateKategoriFromTransactions() {
  const uniqueKategori = await db.transaksi
    .orderBy('kategori')
    .uniqueKeys();
  
  for (const kategori of uniqueKategori) {
    await createKategori({
      nama: kategori,
      icon: 'Tag',
      warna: '#3b82f6',
      nature: 'NEED',
      show: true
    });
  }
}
```

---

### 4. 💥 Navigation Slider (Drawer dari Kiri)

#### Current State
- Desktop: Sidebar fixed di kiri
- Mobile: Bottom nav + hamburger menu (buka drawer dari kiri)

#### Target (dari gambar referensi)
- Mobile: Hamburger icon di top-left header
- Click hamburger → Drawer slide dari kiri
- Drawer content:
  - Menu items dengan icon + label
  - Active state (highlighted background)
  - Premium badge (skip dulu)
  - Collapse/expand untuk submenu (contoh: Statistics)

#### Files to Modify/Create

**Layout Changes:**
- `src/app/layout.tsx` (update mobile header)
- `src/components/layout/mobile-nav.tsx` → Refactor atau buat baru

**New Component:**
- `src/components/layout/drawer-navigation.tsx`
  - Menggunakan Shadcn Sheet component
  - Slide animation dari kiri
  - Backdrop overlay (dark)
  - Menu structure sesuai sidebar existing tapi dengan style baru

**Menu Structure** (dari gambar):
```typescript
const menuItems = [
  { label: 'Home', icon: 'Home', href: '/', active: true },
  { label: 'Records', icon: 'List', href: '/transaksi' },
  { label: 'Investments', icon: 'TrendingUp', href: '/investasi', badge: 'New' },
  { 
    label: 'Statistics', 
    icon: 'BarChart3', 
    href: '#',
    submenu: [
      { label: 'Statistik', href: '/statistik' },
      { label: 'Perbandingan YoY', href: '/statistik/yoy' },
      { label: 'Heatmap', href: '/statistik/heatmap' }
    ]
  },
  { label: 'Planned payments', icon: 'Clock', href: '/cicilan' },
  { label: 'Budgets', icon: 'Wallet', href: '/anggaran' },
  { label: 'Debts', icon: 'CreditCard', href: '/hutang' },  // Future
  { label: 'Goals', icon: 'Target', href: '/tujuan' },      // Future
];
```

**Design Notes:**
- Background: Dark (#0a0a0a or similar)
- Active item: Rounded background (#1e3a5f bluish)
- Text: White/Light gray
- Icon colors: Sesuai warna theme masing-masing menu
- Width: ~75% screen width (max 320px)
- Transition: 300ms ease-in-out

---

### 5. 💥 Redesign Halaman Pengaturan

#### Current State
- File: `src/app/pengaturan/page.tsx` (913 lines)
- Single page dengan banyak sections (Backup, Reset, Automasi, dll)
- Style: Cards dengan buttons

#### Target (dari gambar referensi "Settings")
- **Section-based grouping:**
  1. **User Profile** (Skip - no authentication yet)
     - "Change profile image, name or password, logout or delete data"
  2. **Premium Plans** (Skip - no premium features)
     - "Explore premium options..."
  3. **General** (Main focus):
     - **Accounts**: "Manage accounts, change icons, color and description"
     - **Categories**: "Manage categories, change icons, color and add custom subcategories" → Link ke `/kategori`
     - **Labels**: "Define labels for better filtering" (Future/Skip)
     - **Templates**: "Create templates to speed up the addition of new records" → Link ke `/template`
     - **Filters**: "Set custom filters that you can use in Statistics or Records" (Future/Skip)
     - **Automatic rules**: "Automasi Keuangan" (existing)

**Design:**
- List items dengan:
  - Icon di kiri (colored circle background)
  - Title (bold)
  - Description (gray text, smaller)
  - Chevron right di kanan
  - Tap → Navigate atau expand

#### Files to Modify
- `src/app/pengaturan/page.tsx` 
  - Simplify menjadi navigation menu
  - Move existing functionality ke sub-pages

**New Sub-Pages:**
- `src/app/pengaturan/data/page.tsx` → Backup, Restore, Reset
- `src/app/pengaturan/automasi/page.tsx` → Existing automasi features
- `src/app/pengaturan/integritas/page.tsx` → Integrity check & fix
- Keep `/akun`, `/template`, `/kategori` as separate top-level routes

**Component Structure:**
```tsx
// src/app/pengaturan/page.tsx
<div>
  <Header>Pengaturan</Header>
  
  {/* Skip User Profile & Premium */}
  
  <Section title="Umum">
    <SettingItem 
      icon={<Building />}
      title="Akun"
      description="Kelola akun, ubah ikon, warna dan deskripsi"
      href="/akun"
    />
    <SettingItem 
      icon={<Tag />}
      title="Kategori"
      description="Kelola kategori, ubah ikon, warna dan tambah subkategori"
      href="/kategori"
    />
    <SettingItem 
      icon={<FileText />}
      title="Template"
      description="Buat template untuk mempercepat input transaksi"
      href="/template"
    />
    <SettingItem 
      icon={<Zap />}
      title="Aturan Otomatis"
      description="Automasi biaya admin dan bunga bank"
      href="/pengaturan/automasi"
    />
  </Section>
  
  <Section title="Data">
    <SettingItem 
      icon={<Database />}
      title="Backup & Restore"
      description="Ekspor dan impor data Anda"
      href="/pengaturan/data"
    />
    <SettingItem 
      icon={<Shield />}
      title="Integritas Data"
      description="Cek dan perbaiki kesalahan data"
      href="/pengaturan/integritas"
    />
  </Section>
  
  <Section title="Lainnya">
    <SettingItem 
      icon={<Palette />}
      title="Tema"
      description="Ubah tema aplikasi (Gelap/Terang)"
      component={<ThemeToggle />}
    />
    <SettingItem 
      icon={<Eye />}
      title="Mode Privasi"
      description="Sembunyikan nominal uang"
      component={<PrivacyToggle />}
    />
  </Section>
</div>
```

---

## 🎯 Execution Strategy

### Phase 1: Foundation (Database & Core Logic)
1. ✅ Update `app-db.ts` → Add `KategoriRecord` + version 4
2. ✅ Create `kategori-repo.ts` → CRUD functions
3. ✅ Migration script untuk default categories

### Phase 2: Kategori UI
4. Create `/kategori` page (list)
5. Create `/kategori/[id]` page (detail/edit)
6. Create kategori components (card, dialog, form, subcategory-list)
7. Test CRUD kategori

### Phase 3: Navigation Refactor
8. Create `drawer-navigation.tsx`
9. Update mobile header dengan hamburger
10. Implement slide animation + menu structure
11. Test navigation flow

### Phase 4: Settings Redesign
12. Refactor `/pengaturan` main page → navigation menu
13. Create sub-pages: `/pengaturan/data`, `/pengaturan/automasi`, `/pengaturan/integritas`
14. Move existing components ke sub-pages
15. Create `SettingItem` component
16. Test all flows

### Phase 5: Polish & QA
17. Responsive testing (mobile-first)
18. Dark/Light mode consistency
19. Update `LOG_PERUBAHAN.md`
20. Final integration testing

---

## 🚨 Potential Risks

1. **Kategori Migration**: Existing transactions use string kategori
   - **Mitigation**: Keep backward compatibility, auto-create missing categories
   
2. **Performance**: New drawer animation may lag on slow devices
   - **Mitigation**: Use CSS transitions instead of JS animations, lazy load menu items
   
3. **Breaking Changes**: Users with existing data
   - **Mitigation**: Database migration with version bump, fallback to defaults

4. **Complex Nesting**: Subcategories max depth = 1
   - **Mitigation**: Enforce validation pada create/edit kategori

---

## 📝 Notes for Implementation

- Follow PSAK Indonesia standards untuk kategori default
- Gunakan Lucide icons untuk konsistensi
- Semua teks dalam Bahasa Indonesia
- Mobile-first responsive design
- data-private attribute untuk nominal di halaman kategori analytics (future)
- Use Shadcn UI components (Sheet untuk drawer, Dialog untuk modals)

---

## 🔄 Rollback Plan

Jika ada masalah serius:
1. Database migration rollback: Tambah version fallback dengan schema lama
2. Git revert specific commits
3. Feature flag untuk disable kategori hierarki (gunakan flat kategori lama)

---

**Estimated Time**: 
- Phase 1: 30 min
- Phase 2: 1 hour  
- Phase 3: 45 min
- Phase 4: 1 hour
- Phase 5: 30 min
**Total: ~4 hours** (with testing)

**Ready to execute?** Mari kita mulai dari Phase 1.
