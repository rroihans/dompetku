# Implementation Plan - Comprehensive Optimization & Refactor

## Phase 1: Financial Integrity (Float -> Int Migration)
**Goal:** Eliminate floating-point errors by migrating database and logic to Integer-based math.

- [x] Task: Create `Money` utility library
    - [x] Create `src/lib/money.ts` with `fromFloat`, `toFloat`, `format`, `add`, `subtract`.
    - [x] Add unit tests for `Money` utility to verify precision.
- [x] Task: Database Schema Migration (Parallel Columns)
    - [x] Modify `schema.prisma`: Add `_int` suffix columns (e.g., `nominalInt`, `saldoSekarangInt`) to `Transaksi` and `Akun`.
    - [x] Run `prisma migrate dev` to create the columns.
- [x] Task: Data Backfill Script
    - [x] Create `scripts/migrate-float-to-int.ts`.
    - [x] Implement logic to read old Float values, convert to Int (x100), and write to new columns.
    - [x] Run script and verify data accuracy with a sampling check.
- [x] Task: Update Application Logic (Read/Write)
    - [x] Refactor `src/actions/transaksi.ts` to write to both columns (Double Write) but read from `Int`.
    - [x] Refactor `src/actions/akun.ts` and balance updates to use Integer math.
    - [x] Update UI components to format display values using `Money.format`.

## Phase 2: Cleanup & Schema Finalization
**Goal:** Remove old Float columns and finalize the schema.

- [x] Task: Switch Source of Truth
    - [x] Update all queries to exclusively use `_int` columns.
    - [x] Remove logic that writes to old Float columns.
- [x] Task: Rename Columns (Migration)
    - [x] Create migration to drop old Float columns.
    - [x] Rename `_int` columns to original names (e.g., `nominalInt` -> `nominal`).
    - [x] Regenerate Prisma client.

## Phase 3: Concurrency & Performance
**Goal:** Fix race conditions and optimize critical queries.

- [x] Task: Fix Idempotency Race Condition
    - [x] Update `src/actions/recurring.ts`: Move idempotency check *outside* the `prisma.$transaction`.
- [x] Task: Optimize Dashboard Queries
    - [x] Refactor `src/actions/analytics.ts`: Replace loop-based queries with a single `findMany` + in-memory grouping.
- [x] Task: Add Database Indexes
    - [x] Update `schema.prisma` with recommended indexes (`[bulan, tahun]`, etc.).
    - [x] Run `prisma migrate dev`.

## Phase 4: UX & Code Quality Standardisation
**Goal:** Standardize error handling, validation, and types.

- [x] Task: Setup Standards
    - [x] Create `src/lib/constants/error-messages.ts`.
    - [x] Create `src/lib/validations/transaksi.ts` (and others).
    - [x] Define `ServerActionResult<T>` in `src/types/index.ts`.
- [x] Task: Refactor Transaction Actions
    - [x] Update `src/actions/transaksi.ts` to use shared Zod schema.
    - [x] Apply `ServerActionResult` return type.
    - [x] Use centralized error messages.
- [x] Task: Refactor UI Components
    - [x] Update Transaction Form to use shared Zod schema.
    - [x] Implement `useMemo` in `Dashboard` component for expensive derivations.
