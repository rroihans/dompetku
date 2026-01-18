# Specification: Sprint 1 - Critical Fixes & Foundation

## 1. Overview
This track focuses on the first sprint of critical improvements for Dompetku. The primary goal is to fix critical functional gaps and improve system integrity.
The scope includes:
1.  **Credit Card Payment Flow:** Enabling users to pay CC bills directly with proper accounting.
2.  **Budget Alert System:** Real-time feedback when spending exceeds defined limits.
3.  **Balance Verification Tool:** automated integrity checks and "auto-fix" for account balances.
4.  **Input Validation Enhancement:** Strengthening data quality across the application.

## 2. Functional Requirements

### 2.1 Credit Card Payment Flow
*   **Payment Interface:**
    *   Add "Bayar Tagihan" tab/section in Credit Card details page.
    *   Display "Minimum Payment" and "Full Payment" amounts.
    *   Allow input of "Custom Amount" (Must be >= Minimum Payment).
    *   Select "Source Account" (e.g., BCA, Gopay).
    *   Show Confirmation Dialog before processing.
*   **Transaction Processing:**
    *   Create a pair of transactions (Debit CC, Credit Source) atomically.
    *   Update `saldoSekarang` for both accounts.
*   **History:**
    *   Log payments in the database.
    *   Display "Last paid" info on the CC card/header.

### 2.2 Budget Alert System
*   **Triggers:**
    *   Evaluate budget status immediately after a transaction is created.
    *   Thresholds:
        *   80% -> Warning
        *   100% -> Danger
        *   120% -> Critical
*   **Notifications:**
    *   Show **Toast Notification** immediately upon transaction success.
    *   Display **Dashboard Banner** summarizing over-budget categories.
    *   No blocking of transactions; purely informational.

### 2.3 Balance Verification Tool
*   **Verification Logic:**
    *   Calculate `Expected Balance = Initial Balance + Sum(Debits) - Sum(Credits)`.
    *   Compare `Expected` vs `Actual` (`saldoSekarang` in DB).
*   **UI (Settings Page):**
    *   Table listing all accounts with status (Valid/Error).
    *   Detail view for errors showing the discrepancy.
*   **Auto-Fix:**
    *   Button to update `saldoSekarang` to match `Expected Balance`.
    *   **Audit:** Log the correction action to the existing `LogSistem` table (Level: WARN/INFO).

### 2.4 Input Validation
*   **Client-Side:**
    *   Real-time validation feedback (red border, text) for forms.
    *   Disable submit buttons if invalid.
*   **Server-Side:**
    *   Zod schema validation for all actions.
    *   Specific rules:
        *   Transaction nominal > 0.
        *   Tenor 1-60 months.
        *   Dates valid (no future dates for transactions unless scheduled).
*   **Scope:** Transaction Form, Installment Conversion, CC Settings.

### 2.5 Credit Card Statement (Preparation)
*   **Manual Trigger:** Add a button in Settings/Admin to "Generate Statements" for the current period manually (as a precursor to automation).

## 3. Technical Implementation
*   **Database:** Use `Prisma` transactions for all money movements.
*   **State Management:** Use `React Hook Form` + `Zod` for validation.
*   **UI Components:** Extend `Shadcn UI` (Toast, Dialog, Form).
*   **Precision:** Use `BigInt` for all financial calculations.

## 4. Acceptance Criteria
*   [ ] User can complete a CC payment in < 3 clicks.
*   [ ] "Custom Amount" payment strictly enforces `>= Minimum Payment`.
*   [ ] Budget alert toast appears < 500ms after transaction.
*   [ ] Balance Verification tool correctly identifies and fixes mismatched balances.
*   [ ] "Auto-Fix" actions are recorded in `LogSistem`.
*   [ ] Forms prevent submission of negative numbers or invalid tenors.
