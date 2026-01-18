# Plan: Analytics & UI Polish

## Phase 1: Transaction & Heatmap Enhancements
Focus on the quick logic and state changes.

- [ ] Task: Update Filter Panel Default State
    - [ ] Modify `src/components/transaksi/advanced-filter-panel.tsx` to set `isExpanded` default to `true`.
- [ ] Task: Enhance Heatmap Insights Logic
    - [ ] Update `getSpendingHeatmap` in `src/app/actions/analytics-heatmap.ts`.
    - [ ] Add logic for `Zero Spending Days`, `Highest Spending Day`, and `Daily Average`.
    - [ ] Lower `Weekend Spike` threshold (e.g., 1.3x instead of 1.5x).
    - [ ] Add "Normal Pattern" fallback.
- [ ] Task: Update Heatmap Insight UI
    - [ ] Modify `src/app/statistik/heatmap/heatmap-client.tsx` to use softer colors for insights.

## Phase 2: YoY Mobile & Visual Polish
Focus on responsiveness and styling.

- [ ] Task: Fix YoY Charts Mobile Layout
    - [ ] Update `src/components/analytics/yoy/charts.tsx`.
    - [ ] Ensure chart container has appropriate height on mobile (e.g., `h-[300px]` or aspect ratio).
- [ ] Task: Fix YoY Category Table Overflow
    - [ ] Update `src/components/analytics/yoy/category-table.tsx`.
    - [ ] Wrap table in `<div className="overflow-x-auto">`.
- [ ] Task: Polish Insight Colors (YoY)
    - [ ] Update `src/components/analytics/yoy/insight-list.tsx` to use the softer color palette (Yellow-50/900, etc.).

## Phase 3: Navigation Reorganization
Structure the menu for better accessibility.

- [ ] Task: Sidebar Grouping
    - [ ] Update `src/components/layout/sidebar.tsx`.
    - [ ] Implement a `NavGroup` component or logic to render nested menus.
    - [ ] Group items: Dashboard, Transaksi, Analisis (Statistik, Laporan, YoY, Heatmap), Perencanaan (Anggaran, Cicilan, Recurring, Kalender), Akun, Pengaturan.
- [ ] Task: Bottom Nav Enhancement
    - [ ] Update `src/components/layout/bottom-nav.tsx`.
    - [ ] Ensure primary items are visible.
    - [ ] Update "Menu" (Hamburger/Drawer) to reflect the grouped structure.
- [ ] Task: Conductor - User Manual Verification 'Analytics Polish' (Protocol in workflow.md)

## Phase 4: Final Verification
- [ ] Task: Run full build check.
- [ ] Task: Update `LOG_PERUBAHAN.md`.