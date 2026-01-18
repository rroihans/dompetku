# Specification: Analytics & UI Polish

## 1. Overview
This track focuses on polishing the recently released Analytics features based on user feedback. It addresses UX friction in filters, lack of insights in Heatmap, mobile layout issues in YoY comparison, visual improvements for insights, and reorganizing the navigation menu.

## 2. Functional Requirements

### 2.1 Transaction Filters
*   **Default State:** The "Advanced Filter" panel should be **expanded by default** when visiting the transaction page.

### 2.2 Spending Heatmap Insights
*   **Goal:** Ensure there is always valuable information displayed, not just the legend.
*   **New Patterns:**
    *   **Daily Average:** Always show the average daily spending.
    *   **Zero Spending:** Detect and celebrate days with 0 spending.
    *   **Highest Day:** Identify the peak spending day.
*   **Thresholds:** Lower the sensitivity for "Weekend Spike" (e.g., from 50% to 30% diff) to make it trigger more often.
*   **Empty State:** If truly no specific patterns, display a positive "Normal Spending" message.

### 2.3 Year-over-Year (YoY) Mobile Layout
*   **Charts:** Ensure charts are visible on mobile.
    *   **Strategy:** Stack/Resize. Force a min-height but ensure container handles width correctly (responsive).
*   **Category Table:** Fix overflow issue.
    *   **Strategy:** Allow horizontal scrolling for the table container or hide less important columns (e.g., "Change Rp") on very small screens.

### 2.4 Visual Improvements
*   **Insight Colors:** Improve the "Yellow/Warning" styling.
    *   **Style:** Use softer pastel backgrounds (e.g., `bg-yellow-50` or `bg-amber-50`) with high-contrast dark text (e.g., `text-yellow-900`) to improve readability and aesthetics.

### 2.5 Navigation Reorganization
*   **Problem:** Too many top-level menu items. New pages (Heatmap, YoY) are not accessible.
*   **Solution:** Group related items into Dropdowns/Collapsibles in Sidebar and Bottom Sheet/Menu in Mobile.
*   **New Structure:**
    *   **Dashboard** (Home)
    *   **Transaksi** (List)
    *   **Analisis & Laporan** (Group):
        *   Ringkasan (Statistik)
        *   Laporan Bulanan
        *   Perbandingan Tahunan (YoY)
        *   Spending Heatmap
    *   **Perencanaan** (Group):
        *   Anggaran (Budget)
        *   Cicilan
        *   Recurring
        *   Kalender
    *   **Akun & Aset**
    *   **Pengaturan**

## 3. Technical Implementation

### 3.1 Components to Update
*   `src/components/transaksi/advanced-filter-panel.tsx`: Change default `isExpanded` state.
*   `src/app/actions/analytics-heatmap.ts`: Update `getSpendingHeatmap` logic to include new patterns and adjust thresholds.
*   `src/components/analytics/yoy/charts.tsx`: Adjust `ResponsiveContainer` or parent `div` styling for mobile.
*   `src/components/analytics/yoy/category-table.tsx`: Add `overflow-x-auto` wrapper.
*   `src/components/analytics/yoy/insight-list.tsx` & `heatmap-client.tsx`: Update Tailwind classes for alerts.
*   `src/components/layout/sidebar.tsx`: Implement collapsible subgroups or grouped headers.
*   `src/components/layout/bottom-nav.tsx`: Adjust simplified menu or "More" menu to show full hierarchy.

## 4. Acceptance Criteria
*   [ ] Transaction filter panel is open by default.
*   [ ] Heatmap always shows at least 1 insight (Average/Peak/Normal).
*   [ ] YoY Charts are visible and readable on mobile (375px width).
*   [ ] YoY Category table scrolls horizontally on mobile instead of clipping.
*   [ ] Insight text is legible against the background color.
*   [ ] Sidebar displays grouped menus for Analytics and Planning.
*   [ ] All new pages (Heatmap, YoY) are accessible via the menu.