# Plan: Data Integrity & Automation Fixes

This plan implements real-time net worth snapshots, stable running balance calculations, and idempotency for recurring transactions.

## Phase 1: Stability & Database Optimization
Goal: Ensure the foundation for accurate calculations and unique constraints is in place.

- [ ] **Task 1: Database Indexing & Schema**
    - [ ] Sub-task: Add a combined index for `tanggal` and `id` on the `Transaksi` table to optimize sorted reads.
    - [ ] Sub-task: Verify `idempotencyKey` has a unique constraint in `schema.prisma`.
- [ ] **Task 2: Stable Running Balance Logic**
    - [ ] Sub-task: Modify `src/app/actions/transaksi.ts` to include `id: 'desc'` as a secondary sort in `getTransaksi`.
    - [ ] Sub-task: Update the running balance calculation logic to ensure it processes the sorted array deterministically.
- [ ] **Task: Conductor - User Manual Verification 'Stability & Database Optimization' (Protocol in workflow.md)**

## Phase 2: Real-time Net Worth Snapshots
Goal: Implement non-blocking updates to net worth data after setiap transaksi.

- [ ] **Task 1: Optimize Snapshot Action**
    - [ ] Sub-task: Refactor `saveNetWorthSnapshot` in `src/app/actions/networth.ts` to use an `upsert` operation for the current day.
- [ ] **Task 2: Integrate Trigger in Server Actions**
    - [ ] Sub-task: Add the snapshot trigger to `createTransaksi`, `deleteTransaksi`, and `updateTransaksi`.
    - [ ] Sub-task: Ensure the trigger is non-blocking (fire-and-forget) to maintain UI performance.
- [ ] **Task: Conductor - User Manual Verification 'Real-time Net Worth Snapshots' (Protocol in workflow.md)**

## Phase 3: Recurring Transaction Idempotency
Goal: Prevent duplicate transactions during automation.

- [ ] **Task 1: Idempotency Key Generation**
    - [ ] Sub-task: Update the recurring transaction engine (likely in `src/app/actions/recurring.ts` or a script) to generate keys using the `recurring_{id}_{date}` format.
- [ ] **Task 2: Verification**
    - [ ] Sub-task: Write a test/script to attempt creating the same recurring transaction twice and verify the second attempt is ignored via the idempotency key.
- [ ] **Task: Conductor - User Manual Verification 'Recurring Transaction Idempotency' (Protocol in workflow.md)**
