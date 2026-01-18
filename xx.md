I'll create a detailed Sprint 3-4 summary following the same comprehensive format as Sprint 1-2.

---

# 📋 Sprint Summary (3-4) - Dompetku Analytics & UX Enhancement

---

## 📊 **SPRINT 3: Analytics & Export** (Week 5-6)

### **Objective**: 
Berikan user tools untuk deep dive analysis dan data portability. Transform raw financial data menjadi actionable insights.

---

### **📌 Deliverable 1: Year-over-Year Comparison** ⭐ CRITICAL

#### **Problem Statement**:
User tidak bisa jawab pertanyaan: "Apakah tahun ini saya lebih boros dari tahun lalu?" Tidak ada visibility untuk trend jangka panjang. Dashboard hanya menampilkan 6 bulan terakhir, tidak ada historical comparison.

#### **What We'll Build**:

**A. YoY Comparison Dashboard**

Location: `/laporan` page dengan tab baru "Perbandingan Tahunan"

**UI Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Perbandingan Tahunan                                 │
│ [2025 ▼] vs [2026 ▼]                                   │
├─────────────────────────────────────────────────────────┤
│ RINGKASAN PERUBAHAN                                     │
├─────────────────────────────────────────────────────────┤
│ Total Pengeluaran                                       │
│ 2025: Rp 62.400.000  →  2026: Rp 57.600.000           │
│ Perubahan: -Rp 4.800.000 (-7.7%) ✅ LEBIH HEMAT        │
├─────────────────────────────────────────────────────────┤
│ Total Pemasukan                                         │
│ 2025: Rp 180.000.000  →  2026: Rp 192.000.000         │
│ Perubahan: +Rp 12.000.000 (+6.7%) ✅ NAIK              │
├─────────────────────────────────────────────────────────┤
│ Savings Rate                                            │
│ 2025: 65.3%  →  2026: 70.0%                           │
│ Perubahan: +4.7% ✅ MENINGKAT                          │
└─────────────────────────────────────────────────────────┘
```

**B. Category Breakdown Comparison**

**Table View**:
```
┌──────────────┬─────────────┬─────────────┬────────────┬──────────┐
│ Kategori     │ 2025        │ 2026        │ Perubahan  │ Trend    │
├──────────────┼─────────────┼─────────────┼────────────┼──────────┤
│ Makan        │ 24.000.000  │ 21.600.000  │ -2.4M (-10%)│ ✅ Hemat │
│ Transport    │ 6.000.000   │ 8.700.000   │ +2.7M (+45%)│ ⚠️ Naik  │
│ Belanja      │ 18.000.000  │ 16.200.000  │ -1.8M (-10%)│ ✅ Hemat │
│ Cicilan      │ 12.000.000  │ 9.600.000   │ -2.4M (-20%)│ ✅ Turun │
│ Entertain    │ 2.400.000   │ 1.500.000   │ -0.9M (-38%)│ ✅ Hemat │
└──────────────┴─────────────┴─────────────┴────────────┴──────────┘

📊 Insight: Pengeluaran Transport naik signifikan 45% 
    (Rp 6M → Rp 8.7M). Penyebab utama: Harga BBM naik 30% 
    dan frekuensi pulang kampung bertambah.
```

**C. Visual Charts**

**1. Side-by-Side Bar Chart** (Monthly Comparison):
```
       2025 vs 2026 - Monthly Expenses
    
12M ┤        ██                    ▓▓
10M ┤        ██        ██          ▓▓
 8M ┤  ██    ██    ██  ██    ██    ▓▓
 6M ┤  ██    ██    ██  ██    ██    ▓▓    ▓▓
 4M ┤  ██    ██    ██  ██    ██    ▓▓    ▓▓
 2M ┤  ██    ██    ██  ██    ██    ▓▓    ▓▓
 0  ┴────────────────────────────────────────
     Jan  Feb  Mar  Apr  May  Jun  Jul  Aug
     
    ██ 2025    ▓▓ 2026
```

**2. Overlay Line Chart** (Trend Comparison):
```
    Spending Trend: 2025 vs 2026
    
10M ┤     •─────•           
 8M ┤   •─┘     └─•─────•    ○─────○
 6M ┤ •─┘             └─•  ○─┘     └─○
 4M ┤○                   •○
    ├─────────────────────────────────
     J F M A M J J A S O N D
     
    • 2025    ○ 2026
```

**D. Automated Insights Generation**

System auto-generate insights berdasarkan data analysis:

**Algorithm**:
```typescript
function generateYoYInsights(data2025, data2026) {
  const insights = []
  
  // 1. Overall spending trend
  const totalChange = (data2026.total - data2025.total) / data2025.total * 100
  if (Math.abs(totalChange) > 5) {
    insights.push({
      type: totalChange < 0 ? 'positive' : 'warning',
      title: totalChange < 0 ? 'Pengeluaran Turun' : 'Pengeluaran Naik',
      message: `Total pengeluaran ${totalChange < 0 ? 'turun' : 'naik'} ${Math.abs(totalChange).toFixed(1)}% dari tahun lalu`,
      impact: 'high'
    })
  }
  
  // 2. Biggest category changes (>20% change)
  for (const category in data2026.categories) {
    const change = calculateCategoryChange(category, data2025, data2026)
    if (Math.abs(change) > 20) {
      insights.push({
        type: change > 0 ? 'warning' : 'positive',
        title: `${category}: ${change > 0 ? 'Naik' : 'Turun'} Signifikan`,
        message: `Pengeluaran ${category} ${change > 0 ? 'naik' : 'turun'} ${Math.abs(change).toFixed(1)}%`,
        impact: 'medium'
      })
    }
  }
  
  // 3. Savings rate improvement
  const savingsChange = data2026.savingsRate - data2025.savingsRate
  if (Math.abs(savingsChange) > 3) {
    insights.push({
      type: savingsChange > 0 ? 'positive' : 'warning',
      title: savingsChange > 0 ? 'Savings Rate Meningkat' : 'Savings Rate Menurun',
      message: `Porsi tabungan ${savingsChange > 0 ? 'naik' : 'turun'} ${Math.abs(savingsChange).toFixed(1)}%`,
      impact: 'high'
    })
  }
  
  // 4. Monthly pattern analysis
  const mostExpensiveMonth2025 = findMaxMonth(data2025)
  const mostExpensiveMonth2026 = findMaxMonth(data2026)
  if (mostExpensiveMonth2025 !== mostExpensiveMonth2026) {
    insights.push({
      type: 'info',
      title: 'Perubahan Pola Belanja',
      message: `Bulan paling boros berubah dari ${mostExpensiveMonth2025} ke ${mostExpensiveMonth2026}`,
      impact: 'low'
    })
  }
  
  return insights.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 }
    return priority[a.impact] - priority[b.impact]
  })
}
```

**Insight Display**:
```
┌─────────────────────────────────────────────────────────┐
│ 💡 INSIGHT OTOMATIS (3 Teratas)                         │
├─────────────────────────────────────────────────────────┤
│ ✅ Pengeluaran Turun 7.7%                               │
│    Total pengeluaran tahun ini lebih hemat Rp 4.8M dari │
│    tahun lalu. Kategori terbesar: Makan (-10%)         │
│                                                         │
│ ⚠️ Transport Naik Signifikan 45%                        │
│    Pengeluaran transport naik Rp 2.7M. Pertimbangkan   │
│    carpooling atau transportasi publik.                │
│                                                         │
│ ✅ Savings Rate Meningkat 4.7%                          │
│    Porsi tabungan meningkat dari 65.3% → 70.0%.        │
│    Target ideal (>30%) sudah terlampaui!               │
└─────────────────────────────────────────────────────────┘
```

#### **User Journey**:
```
1. User buka /laporan
2. Klik tab "Perbandingan Tahunan"
3. Default: 2025 vs 2026 (current year vs previous)
4. Lihat summary cards (pengeluaran, pemasukan, savings)
5. Scroll ke category breakdown table
6. Sort by "Perubahan" descending → Lihat Transport +45%
7. Klik "Transport" → Drill down ke detail transaksi
8. Review 3 insight otomatis di bawah
9. Klik "Export Comparison" → Download Excel
```

#### **Technical Requirements**:
- Server action: `getYearOverYearComparison(year1, year2)`
- Aggregate transaksi per tahun, per bulan, per kategori
- Calculate percentage changes
- Generate insights dengan AI-like logic
- Support year selector (2020-2030)
- Cache results (1 day TTL untuk historical data)
- Export format: Excel with 2 sheets (Summary + Detail)

#### **Success Criteria**:
✅ Comparison loads < 2 detik untuk 2 tahun data (1000+ transaksi)
✅ Insights accurate (manual spot-check pada 10 accounts)
✅ User bisa compare any 2 years (not limited to current vs previous)
✅ Charts responsive (desktop: side-by-side, mobile: stacked)
✅ Export Excel formatted dengan conditional coloring
✅ 60%+ monthly active users view YoY comparison

---

### **📌 Deliverable 2: Excel/CSV Export** ⭐ CRITICAL

#### **Problem Statement**:
Hanya ada JSON backup export yang sulit dibaca. User mau analyze di Excel/Google Sheets untuk:
- Share ke accountant/tax advisor
- Custom pivot tables & charts
- Merge dengan data external (salary records, investment returns)
- Archive untuk keperluan audit

#### **What We'll Build**:

**A. Multi-Format Export System**

**Export Button Placement**:
```
Location 1: Transaksi Page (/transaksi)
[📥 Export] dropdown:
  • Excel (.xlsx) - Recommended
  • CSV (.csv) - For Google Sheets
  • JSON (.json) - For developers
  
Location 2: Laporan Page (/laporan)
[📥 Export Laporan] dropdown:
  • Excel Ringkasan Bulanan
  • Excel Perbandingan Tahunan
  • PDF Statement (future)

Location 3: Budget Page (/anggaran)
[📥 Export Budget] dropdown:
  • Excel Budget Report
  • CSV Budget vs Realisasi
```

**B. Transaction Export (Excel Format)**

**Sheet 1: "Transactions"**
```
┌──────┬─────────────────┬──────────┬──────────┬─────────┬──────────┬──────────┬─────────┬──────────────┐
│ No   │ Date            │ Desc     │ Category │ Amount  │ Type     │ From     │ To      │ Balance After│
├──────┼─────────────────┼──────────┼──────────┼─────────┼──────────┼──────────┼─────────┼──────────────┤
│ 1    │ 2026-01-18      │ Makan    │ Makan    │ 25,000  │ Expense  │ Gopay    │ [EXP]   │ 100,000      │
│ 2    │ 2026-01-17      │ Gaji     │ Salary   │15,000,000│ Income  │ [INC]    │ BCA     │ 15,125,000   │
│ 3    │ 2026-01-15      │ Grab     │ Transport│ 45,000  │ Expense  │ Gopay    │ [EXP]   │ 125,000      │
└──────┴─────────────────┴──────────┴──────────┴─────────┴──────────┴──────────┴─────────┴──────────────┘

Features:
• Currency format: Rp #,##0 (Indonesian style)
• Date format: YYYY-MM-DD (sortable)
• Conditional formatting: Red for expenses, Green for income
• Frozen header row
• Auto-filter enabled
• Column widths optimized
```

**Sheet 2: "Summary"**
```
┌─────────────────────────────────────────────┐
│ RINGKASAN KEUANGAN                          │
│ Period: Jan 2026                            │
├─────────────────────────────────────────────┤
│ Total Pemasukan       │ Rp  15,000,000      │
│ Total Pengeluaran     │ Rp  -4,850,000      │
│ Selisih              │ Rp  10,150,000      │
│ Savings Rate         │        67.7%        │
├─────────────────────────────────────────────┤
│ TOP 5 PENGELUARAN                           │
│ 1. Makan & Minum     │ Rp   1,250,000      │
│ 2. Transport         │ Rp     680,000      │
│ 3. Belanja           │ Rp     550,000      │
│ 4. Cicilan           │ Rp     500,000      │
│ 5. Entertainment     │ Rp     320,000      │
└─────────────────────────────────────────────┘

Features:
• Pre-calculated formulas (SUM, COUNT, AVERAGE)
• Pie chart: Pengeluaran per kategori
• Bar chart: Trend 30 hari
```

**Sheet 3: "Pivot Ready"**
```
Same data as Sheet 1, but optimized for pivot table:
• No merged cells
• Flat structure (no subtotals)
• Date parsed to Year, Month, Day columns
• Category hierarchy: Main Category | Sub Category
• Account Type column added
```

**C. Budget Export (Excel Format)**

**Sheet 1: "Budget Overview"**
```
┌──────────────┬──────────────┬──────────────┬──────────────┬────────────┬──────────┐
│ Kategori     │ Budget       │ Realisasi    │ Sisa         │ % Used     │ Status   │
├──────────────┼──────────────┼──────────────┼──────────────┼────────────┼──────────┤
│ Makan        │  2,000,000   │  1,250,000   │    750,000   │    62.5%   │ ✅ Aman  │
│ Transport    │    800,000   │    680,000   │    120,000   │    85.0%   │ ⚠️ Hampir│
│ Belanja      │  1,500,000   │  1,620,000   │   -120,000   │   108.0%   │ ❌ Over  │
│ Entertainment│    500,000   │    320,000   │    180,000   │    64.0%   │ ✅ Aman  │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────┴──────────┘

Conditional Formatting:
• Status "✅ Aman" → Green background
• Status "⚠️ Hampir" → Yellow background (80-100%)
• Status "❌ Over" → Red background (>100%)
• Progress bar in "% Used" column
```

**Sheet 2: "Daily Breakdown"**
```
┌──────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Tgl  │ Makan        │ Transport    │ Belanja      │ Total Harian │
├──────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ 1    │     50,000   │     25,000   │          0   │     75,000   │
│ 2    │     35,000   │     45,000   │     120,000  │    200,000   │
│ 3    │     42,000   │          0   │      85,000  │    127,000   │
│ ...  │         ...  │         ...  │         ...  │         ...  │
│ 31   │     38,000   │     32,000   │      95,000  │    165,000   │
├──────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Total│  1,250,000   │    680,000   │  1,620,000   │  3,550,000   │
└──────┴──────────────┴──────────────┴──────────────┴──────────────┘

Sparklines for each category (mini trend chart in cell)
```

**D. Export Customization Dialog**

Before export, show dialog:
```
┌─────────────────────────────────────────────────┐
│ 📥 Export Transaksi                             │
├─────────────────────────────────────────────────┤
│ Format:                                         │
│ ○ Excel (.xlsx) - Recommended                  │
│ ○ CSV (.csv) - For Google Sheets               │
│ ○ JSON (.json) - For developers                │
├─────────────────────────────────────────────────┤
│ Date Range:                                     │
│ From: [01/01/2026 📅]  To: [31/01/2026 📅]     │
│ Quick: [This Month] [Last 3 Months] [This Year]│
├─────────────────────────────────────────────────┤
│ Columns to Include:                             │
│ ☑ Date           ☑ Description                 │
│ ☑ Category       ☑ Amount                      │
│ ☑ Type           ☑ From Account                │
│ ☑ To Account     ☐ Balance After (slow)        │
│ ☐ Notes          ☐ Created At                  │
├─────────────────────────────────────────────────┤
│ Advanced Options:                               │
│ ☑ Include Summary Sheet                        │
│ ☑ Include Charts                               │
│ ☑ Group by Category                            │
│ ☐ Split by Month (separate sheets)             │
├─────────────────────────────────────────────────┤
│ [Cancel]              [Export (1,234 records)] │
└─────────────────────────────────────────────────┘
```

**E. CSV Format (Google Sheets Optimized)**

```csv
Date,Description,Category,Amount,Type,From,To,Notes
2026-01-18,Makan siang,Makan,25000,Expense,Gopay,[EXPENSE] Makan,
2026-01-17,Gaji Januari,Salary,15000000,Income,[INCOME] Salary,BCA,Transfer gaji bulanan
2026-01-15,Grab ke kantor,Transport,45000,Expense,Gopay,[EXPENSE] Transport,
```

Features:
- UTF-8 encoding (support Indonesian characters)
- Comma delimiter (standard)
- Quoted strings (handle commas in description)
- No formulas (plain values only)
- Header row included

**F. JSON Format (Developer/API Use)**

```json
{
  "export_metadata": {
    "generated_at": "2026-01-18T10:30:00Z",
    "date_range": {
      "from": "2026-01-01",
      "to": "2026-01-31"
    },
    "total_records": 1234,
    "filters": {
      "categories": ["Makan", "Transport"],
      "min_amount": 0,
      "max_amount": 1000000
    }
  },
  "summary": {
    "total_income": 15000000,
    "total_expense": 4850000,
    "net": 10150000,
    "savings_rate": 0.677
  },
  "transactions": [
    {
      "id": "clx1y2z3a",
      "date": "2026-01-18",
      "description": "Makan siang",
      "amount": 25000,
      "type": "EXPENSE",
      "category": "Makan",
      "from_account": {
        "id": "clx1234",
        "name": "Gopay",
        "type": "E_WALLET"
      },
      "to_account": {
        "id": "clx5678",
        "name": "[EXPENSE] Makan",
        "type": "EXPENSE"
      },
      "notes": null,
      "created_at": "2026-01-18T12:30:00Z"
    }
  ]
}
```

#### **User Journey**:
```
1. User buka /transaksi
2. Apply filters: Jan 2026, Category: Makan & Transport
3. Klik "Export" button
4. Dialog muncul dengan options
5. Select: Excel format
6. Date range: Keep current (Jan 2026)
7. Uncheck: "Balance After" (karena slow untuk 1000+ records)
8. Check: "Include Charts"
9. Klik "Export (234 records)"
10. File downloading... (2-3 sec for 234 records)
11. "transaksi_jan2026_234records.xlsx" downloaded
12. Open di Excel → Lihat 3 sheets + charts
13. Create custom pivot table → Analyze patterns
```

#### **Technical Requirements**:
- Library: `exceljs` untuk Excel generation (sudah dipakai di XLSX skill)
- Server action: `exportTransactions(filters, options)`
- Background job untuk large exports (>5000 records)
  - Queue system (future: BullMQ)
  - Email notification dengan download link
- File size limit: 10MB (~ 50,000 records)
- Cache export files (1 hour TTL)
- Cleanup old exports (delete after 24 hours)

#### **Success Criteria**:
✅ Export < 3 detik untuk 1000 records (Excel)
✅ Export < 1 detik untuk 1000 records (CSV)
✅ Excel file readable di Excel 2016+ dan Google Sheets
✅ Charts render correctly di Excel
✅ CSV import-able ke Google Sheets tanpa error
✅ 40%+ users export data minimal 1x per bulan
✅ No file corruption (test dengan 10,000+ records)

---

### **📌 Deliverable 3: Spending Heatmap** ⭐ MEDIUM

#### **Problem Statement**:
User tidak sadar pola spending habits mereka:
- "Kenapa tiap akhir minggu dompet habis?"
- "Hari apa saya paling boros?"
- "Apakah ada pattern spending berdasarkan gajian?"

Tidak ada visual representation untuk daily spending patterns.

#### **What We'll Build**:

**A. Calendar Heatmap Visualization**

Location: Dashboard section atau `/statistik/heatmap`

**Desktop View** (Full Month):
```
                 JANUARI 2026
    
    Mon Tue Wed Thu Fri Sat Sun
    ═══════════════════════════════
W1          1   2   3   4   5
            🟢  🟢  🟡  🔴  🔴
            50k 75k 180k 450k 520k

W2  6   7   8   9  10  11  12
    🟢  🟢  🟡  🟢  🟢  🔴  🔴
    30k 85k 120k 95k 110k 380k 425k

W3  13  14  15  16  17  18  19
    🟢  🟡  🟡  🟢  🟢  🔴  🔴
    60k 150k 135k 80k 105k 340k 410k

W4  20  21  22  23  24  25  26
    🟢  🟢  🟡  🟢  🔴  🔴  🔴
    45k 90k 180k 100k 850k 650k 580k

W5  27  28  29  30  31
    🟢  🟢  🟡  🟢  🟡
    55k 70k 145k 95k 175k

Color Scale:
🟢 Low (0-100k)
🟡 Medium (100k-300k)
🟠 High (300k-500k)
🔴 Very High (>500k)
```

**Mobile View** (Swipeable Weeks):
```
┌─────────────────────────────────────┐
│ Week 2 (6-12 Jan)            [<][>] │
├─────────────────────────────────────┤
│ Mon  Tue  Wed  Thu  Fri  Sat  Sun   │
│  6    7    8    9   10   11   12    │
│ 🟢   🟢   🟡   🟢   🟢   🔴   🔴     │
│ 30k  85k  120k 95k  110k 380k 425k  │
├─────────────────────────────────────┤
│ 💰 Total Week: Rp 1.245.000         │
│ 📊 Average: Rp 177.857/day          │
│ 🔝 Peak: Sabtu (Rp 425k)            │
└─────────────────────────────────────┘

[Swipe left/right untuk pindah minggu]
```

**B. Hover Tooltip (Desktop)**

Hover pada cell tanggal → Tooltip muncul:
```
┌──────────────────────────────────┐
│ Sabtu, 11 Januari 2026           │
├──────────────────────────────────┤
│ Total Pengeluaran: Rp 380.000    │
├──────────────────────────────────┤
│ Top 3 Transaksi:                 │
│ 1. Makan malam resto - Rp 150k   │
│ 2. Nonton bioskop    - Rp 120k   │
│ 3. Grab pulang       - Rp  65k   │
├──────────────────────────────────┤
│ Kategori Terbesar: Entertainment │
│ [Lihat Semua Transaksi →]       │
└──────────────────────────────────┘
```

**C. Filters & Options**

**Filter Panel**:
```
┌─────────────────────────────────────────────┐
│ 📅 Period: [Januari 2026 ▼]                 │
│                                             │
│ 🎯 Filter by Category:                      │
│ ☐ All Categories                            │
│ ☑ Makan & Minum                             │
│ ☑ Transport                                 │
│ ☐ Belanja                                   │
│ ☐ Entertainment                             │
│                                             │
│ 💰 Amount Range:                            │
│ Min: [0        ] Max: [1,000,000]          │
│                                             │
│ 📊 View Mode:                               │
│ ○ Total Spending (default)                 │
│ ○ Transaction Count                         │
│ ○ Average per Transaction                  │
│                                             │
│ [Reset Filters] [Apply]                     │
└─────────────────────────────────────────────┘
```

**D. Pattern Analysis Insights**

Auto-generated insights berdasarkan heatmap data:

**Algorithm**:
```typescript
function analyzeSpendingPattern(heatmapData) {
  const insights = []
  
  // 1. Weekend vs Weekday
  const weekendAvg = calculateAverage(heatmapData.weekends)
  const weekdayAvg = calculateAverage(heatmapData.weekdays)
  const weekendIncrease = ((weekendAvg - weekdayAvg) / weekdayAvg) * 100
  
  if (weekendIncrease > 50) {
    insights.push({
      icon: '📊',
      title: 'Weekend Spending Spike',
      message: `Pengeluaran weekend ${weekendIncrease.toFixed(0)}% lebih tinggi (Rp ${weekendAvg.toLocaleString()} vs Rp ${weekdayAvg.toLocaleString()})`,
      suggestion: 'Pertimbangkan meal prep atau aktivitas hemat di weekend',
      severity: 'warning'
    })
  }
  
  // 2. Paycheck Day Pattern
  const paycheckDay = 25 // Assumed, could be user setting
  const paycheckSpending = getSpendingOnDay(heatmapData, paycheckDay)
  const monthAvg = calculateMonthlyAverage(heatmapData)
  
  if (paycheckSpending > monthAvg * 3) {
    insights.push({
      icon: '💸',
      title: 'Paycheck Day Splurge',
      message: `Pengeluaran tanggal gajian (${paycheckDay}) 3x lipat rata-rata harian (Rp ${paycheckSpending.toLocaleString()})`,
      suggestion: 'Hindari impulse buying setelah gajian. Tunggu 48 jam sebelum belanja besar.',
      severity: 'warning'
    })
  }
  
  // 3. Most Consistent Day
  const consistencyScore = calculateConsistency(heatmapData)
  const mostConsistent = Object.keys(consistencyScore).reduce((a, b) => 
    consistencyScore[a] < consistencyScore[b] ? a : b
  )
  
  insights.push({
    icon: '✅',
    title: 'Consistent Spending',
    message: `${mostConsistent} adalah hari paling konsisten (variance rendah)`,
    suggestion: 'Good pattern! Pertahankan kebiasaan ini.',
    severity: 'positive'
  })
  
  // 4. Danger Zone Days (>500k)
  const dangerDays = heatmapData.filter(d => d.total > 500000)
  if (dangerDays.length > 5) {
    insights.push({
      icon: '⚠️',
      title: 'Frequent High-Spending Days',
      message: `${dangerDays.length} hari dengan pengeluaran >Rp 500k`,
      suggestion: 'Review transaksi besar. Apakah bisa dihindari atau dijadwalkan lebih baik?',
      severity: 'critical'
    })
  }
  
  return insights
}
```

**Insight Display**:
```
┌─────────────────────────────────────────────────────┐
│ 💡 PATTERN INSIGHTS                                 │
├─────────────────────────────────────────────────────┤
│ 📊 Weekend Spending Spike                           │
│    Pengeluaran weekend 68% lebih tinggi             │
│    (Rp 405k vs Rp 241k). Pertimbangkan meal prep   │
│    atau aktivitas hemat di weekend.                 │
│                                           [Detail →]│
├─────────────────────────────────────────────────────┤
│ 💸 Paycheck Day Splurge                             │
│    Pengeluaran tanggal 25 (gajian) 3x lipat        │
│    rata-rata harian (Rp 850k). Tunggu 48 jam       │
│    sebelum belanja besar untuk avoid impulse buy.  │
│                                           [Detail →]│
├─────────────────────────────────────────────────────┤
│ ✅ Consistent Spending                              │
│    Selasa adalah hari paling konsisten. Good!      │
│                                           [Detail →]│
└─────────────────────────────────────────────────────┘
```

**E. Drill-down Feature**

Klik pada cell tanggal → Modal detail:
```
┌─────────────────────────────────────────────┐
│ 📅 Detail: Sabtu, 11 Januari 2026           │
│ Total: Rp 380.000 (7 transaksi)             │
├─────────────────────────────────────────────┤
│ BREAKDOWN BY CATEGORY                       │
│                                             │
│ Entertainment    Rp 270.000 (71%) ████████  │
│ Makan & Minum    Rp  85.000 (22%) ███       │
│ Transport        Rp  25.000  (7%) █         │
├─────────────────────────────────────────────┤
│ TRANSAKSI                                   │
│                                             │
│ 🍿 Nonton bioskop XXI     Rp 120.000  20:00│
│ 🎮 Top-up Steam           Rp 150.000  15:30│
│ 🍔 Dinner Burger King     Rp  85.000  19:15│
│ 🚗 Grab ke mall           Rp  25.000  14:45│
│ ... +3 lainnya                              │
│                                             │
│ [Lihat Semua Transaksi] [Export Hari Ini]  │
└─────────────────────────────────────────────┘
```

#### **User Journey**:
```
1. User buka Dashboard atau /statistik/heatmap
2. Lihat heatmap bulan ini (Januari 2026)
3. Notice: Weekend cells mostly red/orange
4. Hover Sabtu 11 Jan → Tooltip: Rp 380k, top: Nonton + Gaming
5. Klik cell → Modal detail muncul
6. Review 7 transaksi hari itu
7. Scroll ke insight: "Weekend Spending Spike 68%"
8. Filter: Show only "Makan" category
9. Heatmap update → Pattern berbeda (weekday peak saat lunch hour)
10. Switch view mode: "Transaction Count"
11. Heatmap show: Jumat paling banyak transaksi (8-10 kali)
12. Screenshot heatmap → Share ke partner/accountant
```

#### **Technical Requirements**:
- Chart library: `recharts` (sudah ada) atau custom D3.js
- Server action: `getSpendingHeatmap(month, year, filters)`
- Aggregate transaksi per hari
- Calculate daily totals, averages, counts
- Cache heatmap data (1 hour TTL untuk current month)
- Responsive: Desktop (calendar grid), Mobile (week cards)
- Color scale calculation: Quartile-based atau fixed thresholds (user preference)

#### **Success Criteria**:
✅ Heatmap loads < 1 detik untuk 1 bulan data
✅ Hover tooltip appears < 100ms
✅ Drill-down modal opens < 200ms
✅ Pattern insights accurate (verified manually untuk 5+ users)
✅ Mobile swipe gesture smooth (60fps)
✅ Color-blind friendly palette (optional toggle)
✅ 30%+ engagement (users interact dengan heatmap > 3x per session)

---

### **📌 Deliverable 4: Advanced Filters & Search** ⭐ MEDIUM

#### **Problem Statement**:
Filter transaksi saat ini terbatas:
- Hanya bisa filter 1 kategori, 1 akun, 1 date range
- Tidak bisa complex queries: "Transaksi >500rb di kategori Makan bulan lalu"
- Tidak bisa save filter untuk dipakai lagi
- Tidak ada quick filters (This Month, Last 3 Months, YTD)

#### **What We'll Build**:

**A. Advanced Filter Panel**

Location: `/transaksi` page (collapsible sidebar atau top panel)

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│ 🔍 ADVANCED FILTERS                    [Reset All]  │
├─────────────────────────────────────────────────────┤
│ 📅 Date Range                                       │
│ Quick: [This Month] [Last 3M] [YTD] [Custom...]    │
│ From: [2026-01-01 📅]  To: [2026-01-31 📅]         │
├─────────────────────────────────────────────────────┤
│ 💰 Amount                                           │
│ Min: [0        ]  Max: [1,000,000]                 │
│ Quick: [<50k] [50k-200k] [200k-1M] [>1M]           │
├─────────────────────────────────────────────────────┤
│ 🎯 Category (Multi-select)                         │
│ ☑ Makan & Minum    ☐ Entertainment                │
│ ☑ Transport        ☐ Cicilan                      │
│ ☐ Belanja          ☐ Healthcare                   │
│ [Select All] [Clear]                               │
├─────────────────────────────────────────────────────┤
│ 🏦 Account (Multi-select)                          │
│ ☑ BCA Tahapan      ☐ CIMB Niaga CC                │
│ ☑ Gopay            ☐ Tunai                        │
│ [Select All] [Clear]                               │
├─────────────────────────────────────────────────────┤
│ 🔄 Transaction Type                                │
│ ○ All              ○ Income Only                   │
│ ○ Expense Only     ○ Transfer Only                │
├─────────────────────────────────────────────────────┤
│ 📝 Advanced Options                                │
│ ☐ Has Notes                                        │
│ ☐ Created by Recurring                             │
│ ☐ Linked to Installment                           │
│ ☐ Payment Transaction                              │
├─────────────────────────────────────────────────────┤
│ [Save as Preset...]  [Apply Filters]               │
└─────────────────────────────────────────────────────┘
```

**B. Filter Logic Builder** (Advanced Mode)

For power users who need AND/OR logic:

```
┌─────────────────────────────────────────────────────┐
│ 🔬 FILTER BUILDER (Advanced)          [Switch to Simple]│
├─────────────────────────────────────────────────────┤
│ Rule Group 1: [AND ▼]                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Amount [Greater Than ▼] [500,000]       [❌]   │ │
│ │ [AND ▼]                                         │ │
│ │ Category [In ▼] [Makan, Transport]      [❌]   │ │
│ │ [Add Rule +]                                    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [OR ▼]                                              │
│                                                     │
│ Rule Group 2: [AND ▼]                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Date [Between ▼] [2026-01-01] and [2026-01-07] │ │
│ │ [AND ▼]                                         │ │
│ │ Type [Equals ▼] [Income]                [❌]   │ │
│ │ [Add Rule +]                                    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Add Group +]                                       │
│                                                     │
│ Preview SQL (Read-only):                            │
│ WHERE (amount > 500000 AND category IN             │
│        ('Makan','Transport'))                       │
│    OR (date BETWEEN '2026-01-01' AND '2026-01-07'  │
│        AND type = 'Income')                        │
│                                                     │
│ [Apply Complex Filter]                              │
└─────────────────────────────────────────────────────┘
```

**C. Saved Filter Presets**

User bisa save kombinasi filter untuk dipakai lagi:

**Preset Management UI**:
```
┌─────────────────────────────────────────────────────┐
│ 📌 SAVED PRESETS                          [+ New]   │
├─────────────────────────────────────────────────────┤
│ ⭐ Large Expenses                          [Apply]  │
│    Amount > 1M, Type: Expense                       │
│    Last used: 2 days ago            [Edit] [Delete]│
├─────────────────────────────────────────────────────┤
│ 🍔 Dining Out                              [Apply]  │
│    Category: Makan, Amount > 50k                    │
│    Last used: Yesterday             [Edit] [Delete]│
├─────────────────────────────────────────────────────┤
│ 💰 Monthly Salary                          [Apply]  │
│    Category: Gaji, Type: Income                     │
│    Last used: 18 Jan 2026           [Edit] [Delete]│
├─────────────────────────────────────────────────────┤
│ 🎮 Entertainment Spending                  [Apply]  │
│    Category: Entertainment, Date: This Month        │
│    Last used: Never                 [Edit] [Delete]│
└─────────────────────────────────────────────────────┘
```

**Save Preset Dialog**:
```
┌─────────────────────────────────────────┐
│ 💾 Save Current Filter as Preset        │
├─────────────────────────────────────────┤
│ Preset Name:                            │
│ [Weekend Splurges            ]          │
│                                         │
│ Icon (Optional):                        │
│ 🛍️  [Choose Emoji]                      │
│                                         │
│ Description:                            │
│ [Transaksi >200k di weekend  ]          │
│ [untuk review impulse buying ]          │
│                                         │
│ Current Filter Summary:                 │
│ • Amount > 200,000                      │
│ • Day of Week: Saturday, Sunday         │
│ • Categories: All                       │
│ • Date Range: This Month                │
│                                         │
│ [Cancel]  [Save Preset]                 │
└─────────────────────────────────────────┘
```

**D. Active Filter Chips**

Show active filters sebagai chips di atas transaction table:

```
Active Filters (3):
┌──────┐ ┌──────────────┐ ┌─────────────┐
│ Makan│×│ Amount >500k │×│ This Month  │×
└──────┘ └──────────────┘ └─────────────┘

[Clear All]   Results: 47 transactions
```

Click "×" pada chip → Remove filter tersebut
Click "Clear All" → Reset semua filter

**E. URL Params Sync** (Shareable Filtered Views)

Filter state disimpan di URL params agar bisa di-share:

```
Before Filter:
/transaksi

After Filter:
/transaksi?category=Makan,Transport&minAmount=500000&dateFrom=2026-01-01&dateTo=2026-01-31

User bisa:
1. Copy URL
2. Share ke accountant/partner
3. Bookmark filtered view
4. Browser back button works (filter state preserved)
```

**F. Smart Filter Suggestions**

Based on user behavior, suggest relevant filters:

```
┌─────────────────────────────────────────────────────┐
│ 💡 SUGGESTED FILTERS                                │
├─────────────────────────────────────────────────────┤
│ 📊 Most Used This Month                             │
│ • Large Expenses (used 8x) ...................[Apply]│
│ • Dining Out (used 5x) .......................[Apply]│
├─────────────────────────────────────────────────────┤
│ 🎯 Based on Your Activity                           │
│ • Last 7 Days Expenses .....................[Apply] │
│ • CIMB CC Transactions (you reviewed this) ..[Apply] │
├─────────────────────────────────────────────────────┤
│ 📅 Quick Date Ranges                                │
│ • Today ...................................... [Apply]│
│ • Yesterday .................................. [Apply]│
│ • This Week .................................. [Apply]│
│ • Last Week .................................. [Apply]│
│ • This Month ................................. [Apply]│
│ • Last Month ................................. [Apply]│
│ • This Quarter ............................... [Apply]│
│ • This Year .................................. [Apply]│
└─────────────────────────────────────────────────────┘
```

#### **User Journey**:
```
1. User buka /transaksi
2. Klik "Advanced Filters" (panel expand)
3. Set filters:
   - Amount: Min 500,000
   - Category: Makan, Transport (multi-select)
   - Date: This Month (quick select)
4. Active filter chips muncul: "Makan", "Amount >500k", "This Month"
5. Results update: 47 transactions
6. User satisfied → Klik "Save as Preset"
7. Dialog muncul
8. Input name: "Large Dining/Transport"
9. Choose icon: 🍔
10. Save → Preset added to list
11. Next time: Klik preset "Large Dining/Transport" → Filters applied instantly
12. Copy URL → Share ke partner untuk review
13. Partner open URL → Same filtered view
```

#### **Technical Requirements**:
- Client state management: Use URL params (Next.js router)
- Server action: `getTransaksi(filters)` (already exists, extend)
- Filter parsing: `parseFilterParams(searchParams)`
- Preset storage: Database table `FilterPreset` atau localStorage
- Query builder: Prisma `where` clause generation
- Validation: Zod schema untuk filter inputs
- Performance: Index database columns used in filters

**Database Schema untuk Presets**:
```typescript
model FilterPreset {
  id          String   @id @default(cuid())
  userId      String   // Future: Multi-user support
  name        String
  icon        String?
  filters     String   // JSON: { category: [...], amount: {...} }
  usageCount  Int      @default(0)
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  
  @@index([userId, lastUsedAt])
}
```

#### **Success Criteria**:
✅ Filter panel loads < 200ms
✅ Apply filter updates results < 500ms (for 1000+ transactions)
✅ Support saving up to 10 presets per user
✅ URL sync works (back button preserves filter state)
✅ Complex filter builder supports 3-level nesting (Group → Rule → Condition)
✅ 25%+ users create at least 1 saved preset
✅ Shareable URLs work across sessions/devices

---

### **🎯 Sprint 3 Success Metrics**:

| Metric | Target | Measurement |
|--------|--------|-------------|
| YoY comparison usage | 60%+ MAU | Analytics: View YoY page |
| Excel export adoption | 40%+ users/month | Track export action |
| Heatmap engagement | 3+ clicks/session | Measure hover, click, drill-down |
| Saved filter creation | 25%+ users | Count FilterPreset records |
| Advanced filter usage | 35%+ sessions | Track "Apply Filters" action |
| Export file quality | 95%+ success rate | Monitor download errors |

---

## 🎨 **SPRINT 4: UX Polish & Engagement** (Week 7-8)

### **Objective**: 
Make the app delightful to use, reduce friction, increase retention. Transform from functional tool to enjoyable daily companion.

---

### **📌 Deliverable 1: Interactive Onboarding Flow** ⭐ CRITICAL

#### **Problem Statement**:
New user masuk dashboard kosong, tidak tahu harus mulai dari mana:
- Abandonment rate 65% di first session
- 40% users tidak pernah create transaksi pertama
- Tidak ada guidance tentang best practices
- Fitur-fitur powerful (cicilan, budget, recurring) tidak pernah digunakan karena tidak aware

#### **What We'll Build**:

**A. 5-Step Wizard** (Progressive, Skippable, Resumable)

**Step 1: Welcome Screen** (15 seconds)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              👋 Selamat Datang!                     │
│                                                     │
│         Mari kita mulai perjalanan keuangan         │
│         yang lebih terorganisir dalam 2 menit       │
│                                                     │
│              [Illustration: Wallet]                 │
│                                                     │
│              [Mulai Setup →]                        │
│              [Skip - Jelajahi Sendiri]              │
│                                                     │
│              Progress: ○○○○○ (0/5)                  │
└─────────────────────────────────────────────────────┘
```

**Step 2: Add First Account** (45 seconds)
```
┌─────────────────────────────────────────────────────┐
│ 🏦 Tambahkan Akun Pertama (1/5)         [Skip Step]│
├─────────────────────────────────────────────────────┤
│ Pilih atau buat akun untuk mulai mencatat          │
│                                                     │
│ QUICK TEMPLATES (Tap to Add):                      │
│ ┌─────────┬─────────┬─────────┬─────────┐          │
│ │🏦 BCA   │💳 Gopay │💵 Tunai │➕ Custom│          │
│ │Tahapan │         │         │         │          │
│ └─────────┴─────────┴─────────┴─────────┘          │
│                                                     │
│ atau                                                │
│                                                     │
│ CREATE CUSTOM:                                      │
│ Nama Akun: [___________________________]            │
│ Tipe:      [Bank ▼]                                │
│ Saldo Awal:[___________] (opsional, bisa 0)        │
│                                                     │
│ 💡 Tip: Pilih akun yang paling sering digunakan    │
│                                                     │
│ [← Back]              [Lanjut (0/1 akun) →]        │
│ Progress: ●○○○○ (1/5)                               │
└─────────────────────────────────────────────────────┘

Behavior:
- Klik "BCA Tahapan" → Auto-create account "BCA Tahapan", tipe BANK, saldo 0
- Lanjut button disabled until 1 account created
- Skip button → Jump to Step 5 (Done)
```

**Step 3: First Transaction** (60 seconds)
```
┌─────────────────────────────────────────────────────┐
│ 💸 Coba Catat Transaksi (2/5)           [Skip Step]│
├─────────────────────────────────────────────────────┤
│ Mari catat transaksi pertama untuk mencoba sistem  │
│                                                     │
│ QUICK EXAMPLES (Tap to Use):                       │
│ ┌─────────────────┬─────────────────┐              │
│ │🍜 Makan Siang   │🚗 Grab ke Kantor│              │
│ │   Rp 25.000     │   Rp 45.000     │              │
│ └─────────────────┴─────────────────┘              │
│                                                     │
│ atau CREATE YOUR OWN:                              │
│                                                     │
│ Deskripsi: [Makan siang warteg    ]                │
│ Nominal:   [25,000                ]                │
│ Kategori:  [Makan & Minum ▼]                       │
│ Akun:      [BCA Tahapan ▼]                         │
│ Tanggal:   [Hari ini ▼]                            │
│                                                     │
│ [Preview Transaction]                               │
│ ┌───────────────────────────────────────────────┐  │
│ │ BCA Tahapan: -Rp 25.000                       │  │
│ │ Balance: Rp 0 → -Rp 25.000                    │  │
│ │ (Transaksi pengeluaran)                       │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ 💡 Tip: Jangan khawatir, ini cuma latihan!         │
│    Data bisa dihapus nanti.                        │
│                                                     │
│ [← Back]              [Simpan & Lanjut →]          │
│ Progress: ●●○○○ (2/5)                               │
└─────────────────────────────────────────────────────┘
```

**Step 4: Set Budget (Optional)** (45 seconds)
```
┌─────────────────────────────────────────────────────┐
│ 🎯 Atur Budget Bulanan (3/5)            [Skip Step]│
├─────────────────────────────────────────────────────┤
│ Kontrol pengeluaran dengan set batas budget        │
│                                                     │
│ QUICK BUDGET (Based on average Indonesian):        │
│ ┌─────────────────────────────────────────────┐    │
│ │ Makan & Minum:  [2,000,000] (30% gaji)     │    │
│ │ Transport:      [  800,000] (12% gaji)     │    │
│ │ Belanja:        [1,500,000] (23% gaji)     │    │
│ │ Entertainment:  [  500,000]  (8% gaji)     │    │
│ │ Lainnya:        [1,200,000] (18% gaji)     │    │
│ │ ───────────────────────────────────────────│    │
│ │ Total:          [6,000,000]                │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ 💡 Tip: Ini hanya contoh, bisa diubah kapan saja   │
│                                                     │
│ [Use Default] [Customize] [Skip - Atur Nanti]      │
│                                                     │
│ [← Back]              [Lanjut →]                    │
│ Progress: ●●●○○ (3/5)                               │
└─────────────────────────────────────────────────────┘
```

**Step 5: Explore Features** (30 seconds)
```
┌─────────────────────────────────────────────────────┐
│ 🎉 Setup Selesai! (4/5)                             │
├─────────────────────────────────────────────────────┤
│ Selamat! Akun Anda siap digunakan.                 │
│                                                     │
│ APA YANG BISA DILAKUKAN:                           │
│                                                     │
│ ✅ Catat Pemasukan & Pengeluaran                    │
│    Track setiap rupiah masuk dan keluar            │
│                                                     │
│ 💸 Transfer Antar Akun                              │
│    Pindahkan uang dari BCA ke Gopay, dll           │
│                                                     │
│ 💳 Kelola Cicilan Kartu Kredit                      │
│    Auto-generate tagihan bulanan, no telat bayar   │
│                                                     │
│ 📊 Lihat Laporan & Analytics                        │
│    Trend 6 bulan, YoY comparison, spending heatmap │
│                                                     │
│ 🔄 Transaksi Berulang Otomatis                      │
│    Set gaji, tagihan, langganan untuk auto-add     │
│                                                     │
│ [Mulai Mencatat →]                                  │
│ [Watch Video Tutorial (2 min)]                      │
│                                                     │
│ Progress: ●●●●○ (4/5)                               │
└─────────────────────────────────────────────────────┘
```

**Step 6: Optional - Sample Data** (15 seconds)
```
┌─────────────────────────────────────────────────────┐
│ 🎲 Mau Coba dengan Data Contoh? (5/5)              │
├─────────────────────────────────────────────────────┤
│ Kami bisa generate data contoh untuk eksplorasi    │
│                                                     │
│ Data yang akan dibuat:                              │
│ • 50 transaksi (mix income & expense)               │
│ • 3 akun (BCA, Gopay, CIMB CC)                      │
│ • 1 cicilan aktif (iPhone 15)                       │
│ • Budget untuk 5 kategori                           │
│ • 2 recurring transactions                          │
│                                                     │
│ 💡 Berguna untuk:                                   │
│ - Explore fitur tanpa input manual                 │
│ - Lihat tampilan dashboard dengan data             │
│ - Test export, filter, analytics                   │
│                                                     │
│ ⚠️ Data bisa dihapus kapan saja di Settings        │
│                                                     │
│ [Ya, Generate Sample Data]                          │
│ [Tidak, Mulai Kosong]                               │
│                                                     │
│ Progress: ●●●●● (5/5)                               │
└─────────────────────────────────────────────────────┘
```

**B. Resume Capability**

User bisa exit di tengah wizard → Data disimpan:

```typescript
interface OnboardingProgress {
  userId: string
  currentStep: number
  completedSteps: number[]
  data: {
    accounts?: Array<{ name: string, type: string }>
    transactions?: Array<{ desc: string, amount: number }>
    budgets?: Record<string, number>
  }
  createdAt: Date
  lastModified: Date
}

// Save to localStorage or database
function saveOnboardingProgress(progress: OnboardingProgress) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('onboarding_progress', JSON.stringify(progress))
  }
}

// Resume on return
function loadOnboardingProgress(): OnboardingProgress | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('onboarding_progress')
    return stored ? JSON.parse(stored) : null
  }
  return null
}
```

Resume UI:
```
┌─────────────────────────────────────────────┐
│ 👋 Selamat Datang Kembali!                  │
├─────────────────────────────────────────────┤
│ Anda sebelumnya menyelesaikan:              │
│ ●●○○○ (2/5 steps)                           │
│                                             │
│ [Lanjutkan Setup]                           │
│ [Mulai dari Awal]                           │
│ [Skip - Jelajahi Dashboard]                │
└─────────────────────────────────────────────┘
```

**C. Tooltips & Help Hints**

During wizard, show contextual help:

```
[Input Field: Saldo Awal]
┌─────────────────────────────────┐
│ ℹ️ Apa itu Saldo Awal?          │
├─────────────────────────────────┤
│ Saldo yang ada di akun Anda    │
│ saat ini. Contoh:               │
│                                 │
│ • BCA: Rp 5.000.000             │
│ • Gopay: Rp 125.000             │
│ • Tunai: Rp 450.000             │
│                                 │
│ Boleh kosong (Rp 0) jika akun  │
│ baru atau mau mulai dari nol.  │
│                                 │
│ [Got it]                        │
└─────────────────────────────────┘
```

**D. Completion Celebration**

After Step 5:
```
┌─────────────────────────────────────────────┐
│                                             │
│              🎉 CONGRATULATIONS! 🎉          │
│                                             │
│         Setup Complete! You're Ready.       │
│                                             │
│         [Confetti Animation]                │
│                                             │
│         What You've Achieved:               │
│         ✅ 1 Account Created                 │
│         ✅ 1 Transaction Logged              │
│         ✅ Budget Set for 5 Categories       │
│                                             │
│         [Start Using Dompetku →]            │
│                                             │
└─────────────────────────────────────────────┘
```

#### **User Journey**:
```
1. New user sign up / first login
2. Wizard auto-shows (modal overlay)
3. Read welcome → Click "Mulai Setup"
4. Step 1: Click "BCA Tahapan" template → Account created
5. Step 2: Click "Makan Siang Rp 25k" example → Transaction created
6. Step 3: Click "Use Default" budget → Budget saved
7. Step 4: Review features → Click "Mulai Mencatat"
8. Step 5: Skip sample data (mau real data)
9. Confetti animation → Click "Start Using"
10. Dashboard loads dengan 1 account, 1 transaction, 5 budgets
11. Feels familiar (tidak kosong), confident to continue
```

#### **Technical Requirements**:
- Wizard component: Stepper with progress bar
- State management: Zustand atau Context API
- Persistence: localStorage (client-side) + database (server-side backup)
- Animation: Framer Motion untuk smooth transitions
- Server actions:
  - `createOnboardingSampleData(userId)`
  - `saveOnboardingProgress(userId, progress)`
  - `getOnboardingProgress(userId)`
- Analytics tracking:
  - Step completion rates
  - Time spent per step
  - Skip rates
  - Completion rate

#### **Success Criteria**:
✅ Wizard shown to 100% new users (first login)
✅ Completion rate 70%+ (from start to finish)
✅ Average completion time < 3 minutes
✅ Skip rate < 20% (most users complete wizard)
✅ Sample data acceptance rate 40%+ (if offered)
✅ User retention +25% (week 1 to week 4)
✅ First transaction creation rate 80%+ (vs 40% before)

---

### **📌 Deliverable 2: Floating Action Button (FAB) with Quick Actions** ⭐ HIGH

#### **Problem Statement**:
Common actions require too many clicks:
- Add transaction: Dashboard → /transaksi → Click add → Fill form (4 steps)
- Transfer: Dashboard → /akun → Select account → Transfer tab (3 steps)
- Bayar cicilan: Dashboard → /cicilan → Find installment → Pay (3 steps)

Mobile UX especially painful (thumb reach).

#### **What We'll Build**:

**A. FAB Component** (Fixed Position)

**Desktop Position**: Bottom-right corner (above bottom nav if exists)
**Mobile Position**: Bottom-right corner (thumb-friendly zone)

**Closed State**:
```
┌──────┐
│  ➕  │  ← FAB Button (56x56px, primary color)
└──────┘
    ↑
 Shadow
```

**Opened State (Radial Menu)**:
```
        [💸 Transfer]
              ↑
    [🎯 Budget] ← → [💳 Cicilan]
              ↓
           [➕ Main]
              ↓
    [🔄 Recurring] ← → [🏦 Akun]
              ↓
        [💰 Transaksi]
```

Animation: Radial expand from center (300ms ease-out)

**B. Quick Actions (6 Primary)**

**1. Transaksi Baru** (Most Common)
```
Icon: 💰
Action: Open add transaction form (modal or slide-up sheet)
Shortcut: T
```

**2. Transfer Antar Akun**
```
Icon: 💸
Action: Open transfer form
Shortcut: F
```

**3. Bayar Cicilan**
```
Icon: 💳
Action: Open installment payment selector
Shortcut: P
```

**4. Set Budget**
```
Icon: 🎯
Action: Navigate to /anggaran with add form open
Shortcut: B
```

**5. Recurring Baru**
```
Icon: 🔄
Action: Open recurring transaction form
Shortcut: R
```

**6. Tambah Akun**
```
Icon: 🏦
Action: Open add account form
Shortcut: A
```

**C. Smart Suggestions** (Context-Aware)

Show relevant actions based on context:

**Example 1**: Tanggal gajian (25 setiap bulan)
```
FAB badge: 💡 (notification dot)

Open menu → Top action highlighted:
┌────────────────────────────────┐
│ 💡 SUGGESTED                   │
│ 💰 Catat Gaji Bulanan          │
│    (Hari gajian nih!)          │
│                                │
│ [Quick Add: Rp 15.000.000 →]  │
└────────────────────────────────┘
```

**Example 2**: Tanggal jatuh tempo cicilan (15 setiap bulan)
```
FAB badge: ⚠️

Open menu → Top action highlighted:
┌────────────────────────────────┐
│ ⚠️ REMINDER                     │
│ 💳 Bayar Cicilan iPhone        │
│    Due today! (Rp 1.000.000)   │
│                                │
│ [Pay Now →]                    │
└────────────────────────────────┘
```

**D. Recent Actions** (Last 3 Used)

Bottom of radial menu or modal:
```
Recently Used:
┌───────────┬───────────┬───────────┐
│🍔 Makan   │🚗 Grab    │💸 Transfer│
│2 min ago  │1 hour ago │Yesterday  │
└───────────┴───────────┴───────────┘

Tap to repeat with same details
(amount editable before submit)
```

**E. Customization** (Settings)

User bisa customize FAB menu:

```
/pengaturan/quick-actions

┌─────────────────────────────────────────────┐
│ ⚙️ CUSTOMIZE QUICK ACTIONS                  │
├─────────────────────────────────────────────┤
│ Choose up to 6 favorite actions:            │
│                                             │
│ ☑ Transaksi Baru (💰)         [Default]    │
│ ☑ Transfer (💸)               [Default]    │
│ ☑ Bayar Cicilan (💳)          [Default]    │
│ ☐ Export Excel (📥)                        │
│ ☐ Scan Receipt (📸)           [Premium]    │
│ ☑ Set Budget (🎯)                          │
│ ☑ Recurring (🔄)                           │
│ ☑ Tambah Akun (🏦)                         │
│                                             │
│ FAB Position:                               │
│ ○ Bottom Right (default)                   │
│ ○ Bottom Left                              │
│                                             │
│ Show Recent Actions: ☑ Yes  ☐ No           │
│ Show Smart Suggestions: ☑ Yes  ☐ No        │
│                                             │
│ [Reset to Default]  [Save Changes]          │
└─────────────────────────────────────────────┘
```

**F. Mobile-Specific Features**

**Swipe Gesture** (Optional):
- Swipe up from FAB → Expand menu
- Swipe down → Close menu
- Tap outside → Close menu

**Bottom Sheet Modal** (Alternative to Radial):
```
[Swipe down to close]
┌─────────────────────────────────────────────┐
│                   ─                         │
│                                             │
│ ⚡ QUICK ACTIONS                            │
├─────────────────────────────────────────────┤
│ 💰 Tambah Transaksi                         │
│ 💸 Transfer Antar Akun                      │
│ 💳 Bayar Cicilan                            │
│ 🎯 Set Budget                               │
│ 🔄 Recurring Baru                           │
│ 🏦 Tambah Akun                              │
├─────────────────────────────────────────────┤
│ 📌 RECENT                                   │
│ 🍔 Makan Siang (Rp 25k)       [Repeat]     │
│ 🚗 Grab (Rp 45k)              [Repeat]     │
└─────────────────────────────────────────────┘
```

#### **User Journey**:
```
Mobile User:
1. Sedang scroll dashboard
2. Ingin catat "Beli kopi Rp 35k"
3. Tap FAB (kanan bawah)
4. Bottom sheet slide up
5. Tap "Tambah Transaksi"
6. Form modal muncul (pre-filled dengan default akun)
7. Input: Deskripsi "Kopi", Nominal "35000"
8. Auto-suggest kategori: "Makan & Minum"
9. Submit (1 tap)
10. Success toast
11. Sheet dismiss
12. Dashboard update dengan transaction baru

Total: 3 taps + 2 inputs (vs 4 navigation steps before)
```

#### **Technical Requirements**:
- Component: Reusable `<FAB>` with customizable actions
- Animation: Framer Motion untuk radial expand/collapse
- Z-index: Above all content, below modals (z-index: 900)
- Touch target: Min 56x56px (Material Design spec)
- Keyboard shortcuts: Global shortcuts (Cmd+T, Cmd+F, etc)
- State management: Zustand untuk FAB open/close state
- Persistence: Save customization to UserPreference table

#### **Success Criteria**:
✅ FAB visible on all pages (except modals, full-screen views)
✅ Touch target accessible (right thumb reach on mobile)
✅ Animation smooth (60fps)
✅ Quick action execution < 2 seconds (from FAB tap to form submit)
✅ 40%+ of transactions created via FAB (vs navigation menu)
✅ Customization adoption 20%+ (users who modify default actions)

---
