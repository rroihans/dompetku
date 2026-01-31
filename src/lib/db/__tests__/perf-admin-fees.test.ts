
import { describe, it, expect, beforeEach } from 'vitest'
import { db, type AkunRecord } from '@/lib/db/app-db'
import { processMonthlyAdminFees } from '@/lib/db/recurring-repo'
import { resetDatabase } from './setup/test-db'

describe('Performance - Admin Fees', () => {
    beforeEach(async () => {
        await resetDatabase()
    })

    it('benchmarks processMonthlyAdminFees with 50 accounts', async () => {
        const numAccounts = 50;
        const accounts: AkunRecord[] = [];
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        for (let i = 0; i < numAccounts; i++) {
            accounts.push({
                id: crypto.randomUUID(),
                nama: `Account ${i}`,
                tipe: 'BANK',
                saldoAwalInt: 100000000,
                saldoSekarangInt: 100000000,
                biayaAdminAktif: true,
                biayaAdminNominalInt: 500000, // 5000.00
                biayaAdminPola: 'TANGGAL_TETAP',
                biayaAdminTanggal: 1,
                lastAdminChargeDate: lastMonth,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        await db.akun.bulkAdd(accounts);

        const start = performance.now();
        const result = await processMonthlyAdminFees();
        const end = performance.now();

        expect(result.success).toBe(true);
        expect(result.processed).toBe(numAccounts);

        console.log(`Processing ${numAccounts} accounts took ${(end - start).toFixed(2)}ms`);
    });
});
