# Specification: Optimization & Production Alignment

## 1. Overview
This track focuses on synchronizing all features of Dompetku v0.5.0 to ensure 100% data integrity, seamless UX, and zero inconsistencies, effectively making the application "Production-Ready". It covers critical bug fixes, high-value UX improvements, and a new real-time clock feature.

## 2. Goals
- **Data Integrity:** Eliminate double counting in Net Worth and ensure database consistency (FKs, orphans).
- **UX Synchronization:** Ensure settings in one part of the app (e.g., Account Admin Fees) are perfectly reflected in others (e.g., Recurring Transactions).
- **Feature Completeness:** Activate "read-only" UI elements (Calendar) and add missing feedback loops (Notifications).
- **Visual Polish:** Add a real-time clock and refine dashboard presentation.

## 3. Scope & Requirements

### 3.1 Tier 1: Critical Fixes
- **Net Worth Calculation:**
    - Remove installment (cicilan) debt from `calculateCurrentNetWorth` to fix double-counting (it's already in the Credit Card balance).
    - Update Dashboard to distinctively show "Total Hutang Kartu Kredit" vs. "Dibayar via Cicilan".
- **Admin Fee Synchronization:**
    - Add "Automasi Aktif" section to `/akun/[id]` with link to `/recurring`.
    - Add "Lihat Pengaturan Akun" back-link in `/recurring` for auto-generated items.
    - **Behavior:** When deleting an auto-generated recurring item, show a **Warning Dialog** explaining it will disable the setting in the Account, then proceed to sync the update if confirmed.
- **Database Integrity:**
    - Create `scripts/check-integrity.ts` to detect orphaned records (recurring w/o account, cicilan w/o card, etc.).
    - Add "Periksa Integritas Database" button in Settings to trigger the check/fix.

### 3.2 Tier 2: High Priority Improvements
- **Budget & Recurring Integration:**
    - Update Budget logic to include *projected* recurring transactions for the current month.
    - Visualize "Spent" vs. "Scheduled" in the Budget progress bars.
- **Interactive Calendar:**
    - Make calendar events clickable.
    - **Cicilan:** "Bayar", "Detail".
    - **Recurring:** "Edit", "Skip Month".
    - **Transaksi:** "Edit", "Duplicate", "Delete".
- **Notification System:**
    - Create a Notification infrastructure (DB model or Log system).
    - **Triggers:**
        - Budget Warning (>= 80%).
        - Cicilan Due Soon (3 days).
        - Recurring Execution Failed.
        - **Low Balance Alert:** Account balance drops below user-defined threshold.
        - **Large Transaction Alert:** Transaction exceeds user-defined limit.
        - **Goal Achievement:** Savings goal reached.
    - **UI:** Notification Bell in top bar & dedicated Notifications page.

### 3.3 Tier 3: Nice-to-Have
- **Automated Snapshots:**
    - Implement daily Cron job (00:00) to call `saveNetWorthSnapshot()`.
    - Store data in the **Existing NetWorth Table**.
    - Add manual "Snapshot Now" button in Settings.
- **Template Naming:**
    - Rename UI labels: "Template Akun" -> "Template Pengaturan Bank", "Template Transaksi" -> "Template Transaksi Cepat".
- **Selective Export:**
    - Allow exporting specific data sets (Budgets only, Templates only, etc.) in Backup settings.

### 3.4 New Feature: Real-Time Clock
- **Display:** Date and Time in Top Bar.
- **Behavior:** Show **Device Time** (User's local time).
- **Responsive:** Full format on Desktop, compact on Mobile.

## 4. Non-Functional Requirements
- **Performance:** Integrity checks should not block the main UI thread (use suitable timeouts or background processing if possible).
- **Reliability:** Notifications must be generated asynchronously to not delay the triggering action.
- **Code Quality:** All new logic must be covered by tests.

## 5. Out of Scope
- Rename of Database Models (Schema changes are limited to new fields/tables, not renaming existing core tables).
- Server-side time enforcement for the Clock.