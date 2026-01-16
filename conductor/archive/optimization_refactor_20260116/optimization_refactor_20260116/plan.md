# Implementation Plan - Optimization & Production Alignment

## Phase 1: Critical Fixes (Tier 1)
- [x] Task: Fix Net Worth Double Counting
    - [x] Sub-task: Create test case verifying double counting in `calculateCurrentNetWorth`
    - [x] Sub-task: Refactor `src/app/actions/networth.ts` to exclude direct installment summation
    - [x] Sub-task: Update Dashboard UI to split "Hutang Kartu Kredit" and "Cicilan" info
    - [x] Sub-task: Verify fix with test case
- [x] Task: Admin Fee Synchronization
    - [x] Sub-task: Add "Automasi Aktif" section to `src/app/akun/[id]/page.tsx`
    - [x] Sub-task: Add back-link logic in `src/app/recurring/page.tsx`
    - [x] Sub-task: Implement "Warning Dialog" and sync logic when deleting auto-recurring items
- [x] Task: Database Integrity System
    - [x] Sub-task: Create `scripts/check-integrity.ts` with detection logic
    - [x] Sub-task: Add "Periksa Integritas" UI in Settings
    - [x] Sub-task: Implement auto-fix logic for orphaned records

## Phase 2: High Priority Improvements (Tier 2)
- [x] Task: Budget & Recurring Integration
    - [x] Sub-task: TDD - Update `getBudgetWithRealization` to include projected recurring
    - [x] Sub-task: Update Budget UI cards to show Realization vs. Projected
- [x] Task: Interactive Calendar
    - [x] Sub-task: Refactor `financial-calendar.tsx` to handle event clicks
    - [x] Sub-task: Implement actions: Pay Cicilan, Edit/Skip Recurring, Edit Transaction
- [x] Task: Notification System Infrastructure
    - [x] Sub-task: Define Notification schema/model (or Log system adapter)
    - [x] Sub-task: Create `src/app/actions/notifications.ts`
    - [x] Sub-task: Implement UI: Notification Bell & List Page
- [x] Task: Notification Triggers
    - [x] Sub-task: Implement Budget Warning (>80%)
    - [x] Sub-task: Implement Cicilan Due & Recurring Failure alerts
    - [x] Sub-task: Implement Low Balance, Large Transaction, & Goal alerts

## Phase 3: Nice-to-Have & Polish (Tier 3)
- [x] Task: Automated Snapshots
    - [x] Sub-task: Create `src/app/api/cron/daily/route.ts`
    - [x] Sub-task: Wire up manual trigger in Settings
- [x] Task: UI Refinements
    - [x] Sub-task: Update labels for Template pages
    - [x] Sub-task: Implement Selective Export in `src/app/actions/backup.ts`
- [x] Task: Real-Time Clock Feature
    - [x] Sub-task: Create `LiveClock` component (Device time)
    - [x] Sub-task: Integrate into Top Bar layout
    - [x] Sub-task: Optimize for Mobile/Desktop

## Phase 4: Verification
- [x] Task: Full System Test
    - [x] Sub-task: Verify all Data Integrity fixes
    - [x] Sub-task: Test all Notification triggers
    - [x] Sub-task: Mobile responsiveness check
- [x] Task: Final Build & Lint
    - [x] Sub-task: Run `npm run build`
    - [x] Sub-task: Run linter and fix issues