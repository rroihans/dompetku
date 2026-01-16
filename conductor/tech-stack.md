# Tech Stack: Dompetku (Enterprise Standard)

## Core Framework
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Runtime:** Node.js

## Frontend & UI/UX
- **Styling:** Tailwind CSS 4
- **Components:** Shadcn UI (Radix UI primitives: Dialog, Select, Tabs, Switch, Tooltip)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Design System:** Mobile-First, Responsive (Sidebar Desktop, Bottom-Nav Mobile)
- **Language UI:** 100% Bahasa Indonesia
- **Theme:** Dark & Light Mode Support (Slate & Emerald palette)
- **Notifications:** Sonner (Toast system)

## Data & Backend
- **ORM:** Prisma
- **Database:** SQLite
- **Architecture:** Double-Entry Bookkeeping (Debit & Kredit) with Integer-based Money (BigInt/Sen) for precision.
- **Banking Automation:** Policy-based engine for recurring fees and tiered interest calculations with deterministic billing patterns (Fixed Date, 3rd Friday, Last Working Day).
- **Reliability:** Idempotency Key for data mutation and real-time data synchronization for net worth analytics.
- **Validation:** Zod & React Hook Form
- **Logging:** Custom logger (lib/logger.ts)