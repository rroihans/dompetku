# Plan: Sprint 3 - Analytics & Advanced Features

## Phase 1: Database & Foundation
Prepare the database schema and utility functions.

- [x] Task: Schema Update
    - [x] Create `FilterPreset` model in `prisma/schema.prisma`.
    - [x] Run migration `npx prisma migrate dev`.
- [x] Task: Insight Logic Implementation
    - [x] Create `src/lib/analytics/insights.ts`.
    - [x] Implement `generateInsights` with the specific rule-based logic provided.
    - [x] Implement `generateMessage` helper with emoji logic.

## Phase 2: Year-over-Year (YoY) Comparison
Implement the historical comparison feature.

- [x] Task: Backend Logic (YoY)
    - [x] Create `src/app/actions/analytics-yoy.ts`.
    - [x] Implement `getYearOverYearComparison(year1, year2)` to aggregate monthly/category data.
    - [x] Integrate `generateInsights` into the response.
- [x] Task: UI Implementation
    - [x] Create `/laporan/comparison` page (or tab in `/laporan`).
    - [x] Build `YoYSummaryCards` component.
    - [x] Build `CategoryComparisonTable` component.
    - [x] Build `YoYCharts` component (Bar & Line charts using Recharts).
    - [x] Build `InsightList` component to display generated insights.

## Phase 3: Spending Heatmap
Implement the daily spending visualization.

- [x] Task: Backend Logic (Heatmap)
    - [x] Create `src/app/actions/analytics-heatmap.ts`.
    - [x] Implement `getSpendingHeatmap(month, year)` to aggregate daily stats.
- [x] Task: UI Implementation
    - [x] Create `/statistik/heatmap` page.
    - [x] Build `HeatmapGrid` component (Desktop view, custom Grid).
    - [x] Build `HeatmapWeeklySwipe` component (Mobile view).
    - [x] Build `HeatmapCell` with color scaling logic.
    - [x] Implement `DailyDetailModal` for drill-down.

## Phase 4: Advanced Filters & Search
Enhance the transaction list with powerful filtering.

- [x] Task: Backend Logic (Filters)
    - [x] Update `getTransaksi` in `src/app/actions/transaksi.ts` to support multi-select arrays for categories/accounts.
    - [x] Create `src/lib/query-builder.ts` to transform nested JSON rules into Prisma `where` inputs.
    - [x] Create `src/app/actions/filter-preset.ts` (CRUD for presets).
- [x] Task: UI Implementation (Filter Panel)
    - [x] Create `AdvancedFilterPanel` component in `/transaksi`.
    - [x] Implement UI for Date Range Picker, Multi-select Dropdowns, Amount Range.
    - [x] Implement `ActiveFilterChips` component.
    - [x] Integrate URL sync using `useSearchParams` and `useRouter`.
- [x] Task: UI Implementation (Logic Builder)
    - [x] Create `FilterLogicBuilder` component.
    - [x] Implement recursive UI for Groups (AND/OR) and Rules.
    - [x] Integrate builder output with `getTransaksi` action.
- [x] Task: UI Implementation (Presets)
    - [x] Create `SavePresetDialog`.
    - [x] Create `PresetList` sidebar/dropdown.
    - [x] Connect to backend actions for saving/loading.

## Phase 5: Floating Action Button (FAB)
Implement the quick action button for enhanced UX.

- [x] Task: Component Implementation
    - [x] Create `src/components/ui/fab.tsx`.
    - [x] Implement radial or vertical expansion animation using Framer Motion (or CSS).
    - [x] Add Quick Actions icons and labels (Transaction, Transfer, etc.).
- [x] Task: Integration
    - [x] Add `FAB` component to the global layout (e.g., `src/app/layout.tsx` or main wrapper).
    - [x] Ensure `FAB` handles modal/drawer opening for "New Transaction", "Transfer", etc.
    - [x] Verify z-index and responsiveness on mobile.

## Phase 6: Final Polish
- [x] Task: Run full project build & lint check.
- [x] Task: Update `LOG_PERUBAHAN.md`.