# Project Overview

## Dependencies
```json
{
  "@prisma/client": "^5.10.2",
  "@radix-ui/react-alert-dialog": "^1.1.15",
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "@radix-ui/react-radio-group": "^1.3.8",
  "@radix-ui/react-slot": "^1.2.4",
  "@radix-ui/react-switch": "^1.2.6",
  "@radix-ui/react-tabs": "^1.1.13",
  "@radix-ui/react-tooltip": "^1.2.8",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "dotenv": "^17.2.3",
  "lucide-react": "^0.562.0",
  "next": "16.1.1",
  "next-themes": "^0.4.6",
  "prisma": "^5.10.2",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "recharts": "^3.6.0",
  "sonner": "^2.0.7",
  "tailwind-merge": "^3.4.0",
  "tailwindcss-animate": "^1.0.7"
}
```

## Folder Structure
```text
.agent/
  ├─ rules/
    ├─ arsitektur-sistem.md
    ├─ aturan-utama.md
    ├─ logging-session.md
    ├─ standar-logging.md
    ├─ standar-ui-ux.md
  ├─ workflows/
    ├─ init-proyek.md
.env
.gitignore
CHANGELOG.md
components.json
conductor/
  ├─ archive/
    ├─ account_templates_20260102/
      ├─ metadata.json
      ├─ plan.md
      ├─ spec.md
    ├─ analitik_drilldown_20260102/
      ├─ metadata.json
      ├─ plan.md
      ├─ spec.md
    ├─ flexible_templates_20260102/
      ├─ metadata.json
      ├─ plan.md
      ├─ spec.md
    ├─ integrity_automation_20260102/
      ├─ metadata.json
      ├─ plan.md
      ├─ spec.md
    ├─ min_balance_interest_20260102/
      ├─ metadata.json
      ├─ plan.md
      ├─ spec.md
    ├─ optimasi_20260102/
      ├─ metadata.json
      ├─ plan.md
      ├─ spec.md
    ├─ optimization_refactor_20260116/
      ├─ index.md
      ├─ metadata.json
      ├─ plan.md
      ├─ spec.md
  ├─ code_styleguides/
    ├─ general.md
    ├─ html-css.md
    ├─ javascript.md
    ├─ typescript.md
  ├─ product-guidelines.md
  ├─ product.md
  ├─ setup_state.json
  ├─ tech-stack.md
  ├─ tracks/
  ├─ tracks.md
  ├─ workflow.md
dev.db
DOKUMENTASI_PROYEK.md
dompetku.rar
eslint.config.mjs
GEMINI.md
LOG_PERUBAHAN.md
next-env.d.ts
next.config.ts
package-lock.json
package.json
postcss.config.mjs
prisma/
  ├─ dev.db
  ├─ dev.db-journal
  ├─ migrations/
    ├─ 20260101175930_add_transaksi_indexes/
      ├─ migration.sql
    ├─ 20260102015718_add_transaksi_composite_index/
      ├─ migration.sql
    ├─ 20260102072704_add_account_templates/
      ├─ migration.sql
    ├─ 20260102161638_refactor_flexible_templates/
      ├─ migration.sql
    ├─ 20260102174113_add_transaction_indices/
      ├─ migration.sql
    ├─ 20260108085638_credit_card_management/
      ├─ migration.sql
    ├─ 20260108110251_add_decimal_format/
      ├─ migration.sql
    ├─ 20260116060315_add_int_columns_migration/
      ├─ migration.sql
    ├─ 20260116061005_rename_columns_final/
      ├─ migration.sql
    ├─ 20260116061525_add_performance_indexes/
      ├─ migration.sql
    ├─ migration_lock.toml
  ├─ schema.prisma
  ├─ seed.ts
public/
  ├─ file.svg
  ├─ globe.svg
  ├─ next.svg
  ├─ vercel.svg
  ├─ window.svg
README.md
scripts/
  ├─ activate-min-balance.ts
  ├─ apply-settings.ts
  ├─ backdate-account.ts
  ├─ check-db.ts
  ├─ cleanup-duplicates.ts
  ├─ deep-diagnostic.ts
  ├─ generate-ai-docs.ts
  ├─ generate-budget-dummy.ts
  ├─ generate-cicilan-dummy.ts
  ├─ generate-dummy-data.ts
  ├─ link-test-data.ts
  ├─ migrate-to-flexible-settings.ts
  ├─ reset-test-interest.ts
  ├─ setup-final-test.ts
  ├─ super-fix.ts
  ├─ test-min-balance-negative.ts
  ├─ test-min-balance-stress.ts
  ├─ test-money.ts
  ├─ test-recurring.ts
src/
  ├─ app/
    ├─ actions/
      ├─ admin-fee.ts
      ├─ akun.ts
      ├─ analytics.ts
      ├─ anggaran.ts
      ├─ backup.ts
      ├─ calendar.ts
      ├─ cicilan.ts
      ├─ credit-card-payment.ts
      ├─ currency.ts
      ├─ debug-automation.ts
      ├─ debug-quick.ts
      ├─ debug.ts
      ├─ installment.ts
      ├─ laporan.ts
      ├─ networth.ts
      ├─ recurring-admin.ts
      ├─ recurring.ts
      ├─ seed.ts
      ├─ template.ts
      ├─ transaksi.ts
      ├─ transfer.ts
    ├─ akun/
      ├─ loading.tsx
      ├─ page.tsx
      ├─ [id]/
    ├─ anggaran/
      ├─ loading.tsx
      ├─ page.tsx
    ├─ cicilan/
      ├─ loading.tsx
      ├─ page.tsx
    ├─ debug-automation/
      ├─ page.tsx
    ├─ devdb/
      ├─ page.tsx
    ├─ error.tsx
    ├─ favicon.ico
    ├─ global-error.tsx
    ├─ globals.css
    ├─ kalender/
      ├─ calendar-client.tsx
      ├─ page.tsx
    ├─ laporan/
      ├─ loading.tsx
      ├─ page.tsx
    ├─ layout.tsx
    ├─ loading.tsx
    ├─ not-found.tsx
    ├─ page.tsx
    ├─ pengaturan/
      ├─ page.tsx
    ├─ recurring/
      ├─ loading.tsx
      ├─ page.tsx
    ├─ statistik/
      ├─ page.tsx
    ├─ template/
      ├─ page.tsx
    ├─ template-akun/
      ├─ page.tsx
    ├─ transaksi/
      ├─ loading.tsx
      ├─ page.tsx
  ├─ components/
    ├─ akun/
      ├─ account-settings-components.tsx
      ├─ admin-fee-manager.tsx
      ├─ akun-actions.tsx
      ├─ edit-account-form.tsx
    ├─ anggaran/
      ├─ budget-actions.tsx
    ├─ calendar/
      ├─ financial-calendar.tsx
    ├─ charts/
      ├─ admin-fee-reminder.tsx
      ├─ asset-composition-chart.tsx
      ├─ budget-chart.tsx
      ├─ client-chart-wrapper.tsx
      ├─ drilldown-pie-chart.tsx
      ├─ enhanced-stat-cards.tsx
      ├─ expense-pie-chart.tsx
      ├─ monthly-comparison-chart.tsx
      ├─ monthly-trend-chart.tsx
      ├─ net-worth-chart.tsx
      ├─ saldo-trend-chart.tsx
    ├─ cicilan/
      ├─ cicilan-actions.tsx
    ├─ credit-card/
      ├─ payment-calculator.tsx
    ├─ forms/
      ├─ add-account-form.tsx
      ├─ add-account-template-form.tsx
      ├─ add-budget-form.tsx
      ├─ add-cicilan-form.tsx
      ├─ add-recurring-form.tsx
      ├─ add-template-form.tsx
      ├─ add-transaction-form.tsx
      ├─ transfer-form.tsx
    ├─ layout/
      ├─ bottom-nav.tsx
      ├─ debug-menu.tsx
      ├─ privacy-toggle.tsx
      ├─ sidebar.tsx
      ├─ theme-toggle.tsx
    ├─ recurring/
      ├─ recurring-actions.tsx
    ├─ settings/
      ├─ currency-settings.tsx
      ├─ financial-automation-card.tsx
    ├─ template/
      ├─ delete-account-template-button.tsx
      ├─ delete-template-button.tsx
      ├─ toggle-template-status-button.tsx
      ├─ use-template-button.tsx
    ├─ theme-provider.tsx
    ├─ transaksi/
      ├─ convert-to-installment-dialog.tsx
      ├─ transaksi-actions.tsx
      ├─ transaksi-filter.tsx
    ├─ ui/
      ├─ alert-dialog.tsx
      ├─ badge.tsx
      ├─ button.tsx
      ├─ card.tsx
      ├─ confirm-dialog.tsx
      ├─ dialog.tsx
      ├─ dropdown-menu.tsx
      ├─ form-field.tsx
      ├─ input.tsx
      ├─ label.tsx
      ├─ radio-group.tsx
      ├─ select.tsx
      ├─ skeleton.tsx
      ├─ switch.tsx
      ├─ tabs.tsx
      ├─ tooltip.tsx
  ├─ hooks/
  ├─ lib/
    ├─ constants/
      ├─ error-messages.ts
    ├─ currency.ts
    ├─ decimal-utils.ts
    ├─ format.ts
    ├─ logger.ts
    ├─ money.ts
    ├─ prisma.ts
    ├─ template-utils.ts
    ├─ utils.ts
    ├─ validation.ts
    ├─ validations/
      ├─ transaksi.ts
  ├─ types/
    ├─ index.ts
tsconfig.json
tsconfig.tsbuildinfo
xx.md

```

## README
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.