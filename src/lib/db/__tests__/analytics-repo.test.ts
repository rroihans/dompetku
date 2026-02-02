import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db/app-db'
import { resetDatabase, createTestAccounts } from './setup/test-db'
import { getDashboardAnalytics } from '@/lib/db/analytics-repo'
import { createTransaksi } from '@/lib/db/transactions-repo'
import { createTransactionTemplate, getTransactionTemplates } from '@/lib/db/transaction-templates-repo'

describe('Analytics Repo Extensions', () => {
    let testAccounts: Awaited<ReturnType<typeof createTestAccounts>>

    beforeEach(async () => {
        await resetDatabase()
        testAccounts = await createTestAccounts()
    })

    describe('getDashboardAnalytics - Today & Yesterday', () => {
        it('should return empty stats when no transactions exist', async () => {
            const result = await getDashboardAnalytics()
            expect(result.today.income).toBe(0)
            expect(result.today.expense).toBe(0)
            expect(result.comparison.hasYesterdayData).toBe(false)
        })

        it('should calculate today stats correctly', async () => {
            const today = new Date()
            
            // Income
            await createTransaksi({
                tanggal: today,
                nominal: 100000,
                deskripsi: 'Salary',
                kategori: 'Gaji',
                debitAkunId: testAccounts.bank.id,
                kreditAkunId: testAccounts.salaryIncome.id
            })

            // Expense
            await createTransaksi({
                tanggal: today,
                nominal: 20000,
                deskripsi: 'Lunch',
                kategori: 'Makan',
                debitAkunId: testAccounts.foodExpense.id,
                kreditAkunId: testAccounts.bank.id
            })

            const result = await getDashboardAnalytics()
            
            expect(result.today.income).toBe(100000)
            expect(result.today.expense).toBe(20000)
            expect(result.today.net).toBe(80000)
            expect(result.today.transactionCount).toBe(2)
            expect(result.today.transactions).toHaveLength(2)
        })

        it('should calculate yesterday stats correctly including income', async () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            // Yesterday: Income 100000
            await createTransaksi({
                tanggal: yesterday,
                nominal: 100000,
                deskripsi: 'Old Salary',
                kategori: 'Gaji',
                debitAkunId: testAccounts.bank.id,
                kreditAkunId: testAccounts.salaryIncome.id
            })

            // Yesterday: Expense 50000
            await createTransaksi({
                tanggal: yesterday,
                nominal: 50000,
                deskripsi: 'Old Dinner',
                kategori: 'Makan',
                debitAkunId: testAccounts.foodExpense.id,
                kreditAkunId: testAccounts.bank.id
            })

            const result = await getDashboardAnalytics()

            expect(result.yesterday.income).toBe(100000)
            expect(result.yesterday.expense).toBe(50000)
            expect(result.yesterday.net).toBe(50000)
        })

        it('should calculate comparison with yesterday', async () => {
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            // Yesterday: Expense 50000
            await createTransaksi({
                tanggal: yesterday,
                nominal: 50000,
                deskripsi: 'Dinner',
                kategori: 'Makan',
                debitAkunId: testAccounts.foodExpense.id,
                kreditAkunId: testAccounts.bank.id
            })

            // Today: Expense 75000
            await createTransaksi({
                tanggal: today,
                nominal: 75000,
                deskripsi: 'Shopping',
                kategori: 'Belanja',
                debitAkunId: testAccounts.foodExpense.id, // Reusing expense account
                kreditAkunId: testAccounts.bank.id
            })

            const result = await getDashboardAnalytics()

            expect(result.yesterday.expense).toBe(50000)
            expect(result.today.expense).toBe(75000)
            // Change: (75000 - 50000) / 50000 = 0.5 = 50%
            expect(result.comparison.expenseChange).toBe(50)
            expect(result.comparison.hasYesterdayData).toBe(true)
        })
    })

    describe('getTransactionTemplates Limit', () => {
        it('should limit templates when option provided', async () => {
            // Create 5 templates
            for (let i = 0; i < 5; i++) {
                await createTransactionTemplate({
                    nama: `Template ${i}`,
                    deskripsi: 'Desc',
                    nominal: 1000 * (i+1),
                    kategori: 'Makan',
                    tipeTransaksi: 'KELUAR',
                    akunId: testAccounts.bank.id
                })
            }

            const all = await getTransactionTemplates()
            expect(all.data).toHaveLength(5)

            const limited = await getTransactionTemplates({ limit: 3 })
            expect(limited.data).toHaveLength(3)
        })
    })
})
