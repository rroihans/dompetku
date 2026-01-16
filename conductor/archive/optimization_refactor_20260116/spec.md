# Track Specification: Comprehensive Optimization & Refactor (v0.5.0)

## 1. Overview
This track implements the recommendations from the "Comprehensive Optimization Audit (v0.5.0)". The primary goal is to elevate the system's maturity by addressing critical data integrity issues (Float to Integer), resolving concurrency bugs, improving performance, and standardizing UX/DX patterns.

## 2. Scope
This track encompasses four major areas of improvement:
1.  **Financial Integrity (P0):** Migration of all monetary fields from `Float` to `Int` (Sen/Cents) to eliminate floating-point rounding errors.
2.  **Concurrency & Performance (P1):** Fixing idempotency race conditions, optimizing heavy dashboard queries, and adding missing database indexes.
3.  **UX & Error Handling (P2):** Standardizing user-facing error messages and unifying validation logic (Client/Server) using Zod.
4.  **Code Quality (P3):** Enhancing type safety for Server Actions and implementing memoization for expensive UI renders.

## 3. Functional Requirements

### 3.1 Data Integrity (Float -> Int)
- **Schema:** All monetary fields (e.g., `Transaksi.nominal`, `Akun.saldoSekarang`) must be migrated to `Int`.
- **Logic:** All financial calculations must be performed using integer arithmetic (e.g., Rp 10.000,50 -> 1000050).
- **Helpers:** A `Money` utility class must be created to handle conversion, formatting, and arithmetic.
- **Migration:** Must use a "Safe/Parallel" column strategy (Add new -> Backfill -> Verify -> Switch).

### 3.2 Concurrency & Performance
- **Idempotency:** The duplicate check must occur *before* initiating the Prisma transaction to prevent race conditions.
- **Dashboard:** The 6-month trend chart must use a single optimized aggregation query with in-memory grouping instead of 12+ separate DB calls.
- **Indexes:** Add composite indexes for common query patterns (e.g., `[bulan, tahun]`, `[idempotencyKey]`).

### 3.3 UX & Validation
- **Standardization:** All Server Actions must return a standardized `ServerActionResult<T>` type.
- **Validation:** Zod schemas must be extracted to `src/lib/validations` and shared between Client forms and Server Actions.
- **Messages:** User-facing error messages must be centralized in `src/lib/constants/error-messages.ts`.

### 3.4 Code Quality
- **Type Safety:** Server Actions must have explicit return types.
- **Memoization:** Expensive UI computations (e.g., derived account states) must be wrapped in `useMemo`.

## 4. Non-Functional Requirements
- **Zero Data Loss:** The migration process must guarantee 100% data preservation.
- **Performance:** Dashboard load time should decrease by at least 50% (target < 200ms for data fetch).
- **Backward Compatibility:** Existing features must function identically after the refactor.

## 5. Acceptance Criteria
- [ ] Database schema uses `Int` for all money fields.
- [ ] No floating-point errors observed in split calculations (e.g., installments).
- [ ] `npm run build` passes with strict type checking on new types.
- [ ] Dashboard loads in a single batch query.
- [ ] Concurrent recurring transaction execution does not produce duplicates or errors.
- [ ] Error messages are consistent across the app.

## 6. Out of Scope
- Implementation of new features (e.g., Multi-user support).
- "Soft Delete" functionality (deferred to future tracks).
