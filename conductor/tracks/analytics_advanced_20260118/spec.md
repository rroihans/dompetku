# Specification: Sprint 3 - Analytics & Advanced Features

## 1. Overview
This track implements the core analytics and advanced filtering capabilities for Dompetku. It focuses on transforming raw data into actionable insights through visual comparisons, spending patterns, and powerful search tools.
**Note:** Excel/CSV Export deliverable has been descoped for this track.
**Added:** Floating Action Button (FAB) from Sprint 4 has been pulled into this track.

## 2. Functional Requirements

### 2.1 Year-over-Year (YoY) Comparison
*   **Comparison Dashboard:**
    *   New tab "Perbandingan Tahunan" in `/laporan`.
    *   Year selector (Default: Current Year vs Previous Year).
    *   Summary Cards: Total Expense, Total Income, Savings Rate (with % change).
*   **Category Breakdown:**
    *   Table showing comparison per category.
    *   Columns: 2025 Amount, 2026 Amount, Change (Amount & %), Trend Icon.
*   **Visualizations:**
    *   **Side-by-Side Bar Chart:** Monthly expenses comparison (Jan 2025 vs Jan 2026, etc.).
    *   **Overlay Line Chart:** Cumulative or monthly trend lines.
*   **Automated Insights:**
    *   Implement specific rule-based logic provided by user.
    *   Logic includes minimum change thresholds (Rp 100k) and category-specific thresholds (Income 10%, Essential 20%, Discretionary 30%).
    *   Generate human-readable messages with emojis.

### 2.2 Spending Heatmap
*   **Visualization:**
    *   **Desktop:** Full month calendar grid.
    *   **Mobile:** Swipeable week view (7 days).
*   **Data Representation:**
    *   Color scale based on daily spending intensity (Low, Medium, High, Very High).
    *   Show daily total amount in cell.
*   **Interaction:**
    *   Hover (Desktop): Tooltip with Top 3 Transactions & Top Category.
    *   Click: Open "Daily Detail Modal" showing full transaction list for that day.
*   **Pattern Analysis:**
    *   Detect "Weekend Spikes", "Paycheck Splurge", and "Consistent Spending" patterns.

### 2.3 Advanced Filters & Search
*   **UI Components:**
    *   Collapsible "Advanced Filters" panel in `/transaksi`.
    *   Active Filter Chips (removable).
*   **Filtering Capabilities:**
    *   **Multi-select:** Categories, Accounts.
    *   **Ranges:** Amount (Min/Max), Date (Custom + Quick Presets like "Last 3 Months").
    *   **Logic:** Standard AND logic between fields.
    *   **Advanced Logic Builder:** Nested Grouping (AND/OR) for complex queries (e.g. `(Cat=Food AND Amt>50k) OR (Cat=Transport)`).
*   **State Management:**
    *   Sync filter state to URL Search Params (shareable views).
*   **Saved Presets (Database):**
    *   New DB Model `FilterPreset`.
    *   Ability to Save, Load, and Delete filter configurations.

### 2.4 Floating Action Button (FAB)
*   **UI Component:**
    *   Fixed position button (Bottom-Right).
    *   **Closed:** Plus icon (+).
    *   **Open:** Radial menu or vertical list of actions.
*   **Quick Actions:**
    1.  New Transaction (💰) - Opens Add Form.
    2.  Transfer (💸) - Opens Transfer Form.
    3.  Pay Installment (💳) - Opens Installment List/Pay.
    4.  Set Budget (🎯) - Navigates to Budget.
    5.  New Recurring (🔄) - Opens Recurring Form.
    6.  Add Account (🏦) - Opens Add Account Form.
*   **Behavior:**
    *   Visible on all main pages (Dashboard, Transaksi, Akun, etc.).
    *   Smooth expansion animation.
    *   Mobile-friendly touch target (min 56px).

## 3. Technical Implementation

### 3.1 Architecture
*   **Server Actions:**
    *   `getYearOverYearComparison(year1, year2)`
    *   `getSpendingHeatmap(month, year)`
    *   `saveFilterPreset`, `getFilterPresets`, `deleteFilterPreset`
*   **Frontend:**
    *   Custom SVG/Grid implementation for Heatmap (Tailwind).
    *   Recharts for YoY charts.
    *   URL state management via `next/navigation`.
    *   Framer Motion for FAB animations.

### 3.2 Database Schema
```prisma
model FilterPreset {
  id          String   @id @default(cuid())
  // userId      String   // Multi-user future proofing, can omit if single user app currently
  name        String
  icon        String?
  filters     String   // JSON string of filter configuration
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3.3 Insight Logic (Custom)
```typescript
function generateInsights(currentMonth: MonthlyData, previousMonth: MonthlyData) {
    // Implementation of user-provided logic with thresholds:
    // Income: 10%, Essential: 20%, Discretionary: 30%
    // Min Change: 100k
}
```

## 4. Out of Scope
*   Excel/CSV Export (Deliverable 2).

## 5. Acceptance Criteria
*   [ ] YoY Dashboard correctly calculates percentage changes and renders charts.
*   [ ] Custom Insight Logic correctly flags "Makan & Minum" increases >20%.
*   [ ] Heatmap renders correctly on Desktop (Grid) and Mobile (Swipe).
*   [ ] Clicking a Heatmap cell opens details.
*   [ ] Users can save a filter combination and reload it later (persisted in DB).
*   [ ] URL sharing of filtered transaction views works.
*   [ ] FAB appears on Dashboard and expands to show quick actions.