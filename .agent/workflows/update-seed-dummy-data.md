---
description: Update seed dummy data to match the current application state.
---

1. Execute `view_file src/lib/db/app-db.ts` to identify all available tables.
2. Execute `view_file src/lib/db/seed.ts` to see current seeding logic.
3. Update `src/lib/db/seed.ts` to include dummy data for any missing tables (e.g., Recurring, Installments, Templates).
4. Ensure the seed function populates ALL tables so no feature is empty.
