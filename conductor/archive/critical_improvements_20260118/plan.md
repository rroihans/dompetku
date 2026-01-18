# Plan: Sprint 1 - Critical Fixes & Foundation

## Phase 1: Input Validation & Foundation
Focus on securing the data entry points first to prevent future data corruption.

- [x] Task: Define Zod Schemas
    - [x] Create/Update schemas in `src/lib/validations/` for Transaction, Cicilan, and CC Settings.
    - [x] Implement strict rules (nominal > 0, tenor 1-60, dates).
- [x] Task: Server-Side Validation Integration
    - [x] Update `createTransaksiSimple` action to use new schemas.
    - [x] Update `createCicilan` and `convertToInstallment` actions.
    - [x] Update CC Settings update action.
- [x] Task: Client-Side Form Enhancements
    - [x] Refactor Transaction Form to use `react-hook-form` + `zod` resolver (if not already).
    - [x] Add inline error messages and visual feedback (red borders).
    - [x] Implement disable-submit-on-error logic.

## Phase 2: Balance Verification Tool
Build the integrity checker to ensure the data we are working with is valid.

- [x] Task: Implement Verification Logic (Backend)
    - [x] Create `verifyAccountBalances` server action.
    - [x] Implement `Expected Balance` calculation logic using BigInt.
    - [x] Return structured result `{ isValid, errors: [] }`.
- [x] Task: Implement Admin UI
    - [x] Create page `/pengaturan/verify-balance`.
    - [x] Build Table View for account statuses.
    - [x] Build Detail View for discrepancies.
- [x] Task: Implement Auto-Fix Feature
    - [x] Create `fixAccountBalance` server action.
    - [x] Implement update logic for `saldoSekarang`.
    - [x] Implement logging to `LogSistem` for the fix action.
    - [x] Connect UI "Auto-Fix" button to the action.

## Phase 3: Budget Alert System
Implement the feedback loop for user spending.

- [x] Task: Alert Logic Implementation
    - [x] Create `checkBudgetAlert(kategori, month, year, amount)` utility.
    - [x] Integrate check into `createTransaksiSimple` (post-transaction).
- [x] Task: Notification UI
    - [x] Implement Toast triggers based on alert level (Warning, Danger, Critical).
    - [x] Create "Budget Banner" component for the Dashboard.
    - [x] Integrate Banner into the main Dashboard view.

## Phase 4: Credit Card Payment Flow
Implement the critical feature for paying CC bills.

- [x] Task: Payment Backend Logic
    - [x] Create `payCreditCardBill` server action.
    - [x] Implement validation (Amount >= Min, Sufficient Source Funds).
    - [x] Implement Atomic Transaction (Debit CC, Credit Source).
    - [x] Implement logging to `LogSistem` (Payment History).
- [x] Task: Payment Interface (UI)
    - [x] Add "Bayar Tagihan" tab to CC Detail Page.
    - [x] Build Payment Form (Source select, Amount input, Calculator display).
    - [x] Implement Confirmation Dialog.
    - [x] Connect Form to backend action.
- [x] Task: Manual Statement Trigger (Prep)
    - [x] Add "Generate Statement (Manual)" button in CC Settings.
    - [x] Wire up a basic placeholder action or the actual logic if feasible within time.

## Phase 5: Final Polish & Verification
- [x] Task: Run full project lint & build check.
- [x] Task: Manual End-to-End Testing (Payment Flow, Alerts, Verification).
- [x] Task: Update `LOG_PERUBAHAN.md`.