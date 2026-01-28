import { db, type TransaksiRecord, type AkunRecord } from "./app-db";
import { Money } from "@/lib/money";

export async function rebuildSummaries() {
    console.time("rebuildSummaries");
    try {
        // 1. Clear all summary tables
        await Promise.all([
            db.summaryMonth.clear(),
            db.summaryCategoryMonth.clear(),
            db.summaryHeatmapDay.clear(),
            db.summaryAccountMonth.clear(),
        ]);

        // 2. In-memory aggregation maps
        const summaryMonth = new Map<string, any>();
        const summaryCategory = new Map<string, any>();
        const summaryHeatmap = new Map<string, any>();
        const summaryAccount = new Map<string, any>();

        // Cache account types for fast lookup
        const accounts = await db.akun.toArray();
        const accountMap = new Map<string, AkunRecord>(accounts.map(a => [a.id, a]));

        // 3. Scan all transactions
        await db.transaksi.each(tx => {
            const date = tx.tanggal;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

            const nominal = tx.nominalInt;
            const debitAkun = accountMap.get(tx.debitAkunId);
            const kreditAkun = accountMap.get(tx.kreditAkunId);

            const isExpense = debitAkun?.tipe === "EXPENSE";
            const isIncome = kreditAkun?.tipe === "INCOME";

            // Update Summary Month
            if (!summaryMonth.has(monthKey)) {
                summaryMonth.set(monthKey, { id: monthKey, month: monthKey, totalIn: 0, totalOut: 0, txCount: 0 });
            }
            const sm = summaryMonth.get(monthKey);
            if (isIncome) sm.totalIn += nominal;
            if (isExpense) sm.totalOut += nominal;
            sm.txCount++;

            // Update Summary Category Month (only expenses)
            if (isExpense) {
                const catKey = `${monthKey}|${tx.kategori}`;
                if (!summaryCategory.has(catKey)) {
                    summaryCategory.set(catKey, { id: catKey, month: monthKey, kategori: tx.kategori, totalOut: 0, txCount: 0 });
                }
                const sc = summaryCategory.get(catKey);
                sc.totalOut += nominal;
                sc.txCount++;

                // Update Summary Heatmap (expenses)
                if (!summaryHeatmap.has(dayKey)) {
                    summaryHeatmap.set(dayKey, { id: dayKey, tanggal: dayKey, totalOut: 0, txCount: 0 });
                }
                const sh = summaryHeatmap.get(dayKey);
                sh.totalOut += nominal;
                sh.txCount++;
            }

            // Update Summary Account Month
            // Debit Side
            const debitKey = `${monthKey}|${tx.debitAkunId}`;
            if (!summaryAccount.has(debitKey)) {
                summaryAccount.set(debitKey, { id: debitKey, month: monthKey, akunId: tx.debitAkunId, delta: 0, txCount: 0 });
            }
            const sad = summaryAccount.get(debitKey);
            sad.delta += nominal; // Debit increases balance (for assets) OR increases expense (for expense accounts)
            // Wait, delta means "change in balance".
            // For Asset: Debit = +Balance.
            // For Liability: Debit = -Balance.
            // For Expense: Debit = +Expense (but usually we track flow).
            // Logic in summary.ts:
            // updateSummaryAccountMonth(..., input.debitAkunId, delta: nominalInt)
            // It just adds nominalInt. So we follow that.
            sad.txCount++;

            // Kredit Side
            const kreditKey = `${monthKey}|${tx.kreditAkunId}`;
            if (!summaryAccount.has(kreditKey)) {
                summaryAccount.set(kreditKey, { id: kreditKey, month: monthKey, akunId: tx.kreditAkunId, delta: 0, txCount: 0 });
            }
            const sak = summaryAccount.get(kreditKey);
            sak.delta -= nominal; // Kredit decreases balance
            sak.txCount++;
        });

        // 4. Bulk Put
        // Compute net for summaryMonth
        const smArray = Array.from(summaryMonth.values()).map(r => ({ ...r, net: r.totalIn - r.totalOut }));

        await db.transaction('rw', [db.summaryMonth, db.summaryCategoryMonth, db.summaryHeatmapDay, db.summaryAccountMonth], async () => {
            await db.summaryMonth.bulkAdd(smArray);
            await db.summaryCategoryMonth.bulkAdd(Array.from(summaryCategory.values()));
            await db.summaryHeatmapDay.bulkAdd(Array.from(summaryHeatmap.values()));
            await db.summaryAccountMonth.bulkAdd(Array.from(summaryAccount.values()));
        });

        console.timeEnd("rebuildSummaries");
        return { success: true };
    } catch (error) {
        console.error("Rebuild failed", error);
        return { success: false, error };
    }
}

export async function checkIntegrity() {
    // 1. Check Account Balances
    // Recompute cached properties like saldoSekarangInt from scratch
    const accounts = await db.akun.toArray();
    const errors: string[] = [];

    // We can use summaryAccountMonth to help, or just iterate all transactions for truth
    // Let's iterate transactions to be sure (Memory intensive if not careful, but streaming is ok)

    const computedBalances = new Map<string, number>();
    // Initialize with saldoAwal
    for (const acc of accounts) {
        computedBalances.set(acc.id, acc.saldoAwalInt);
    }

    await db.transaksi.each(tx => {
        const nominal = tx.nominalInt;

        const debitBal = computedBalances.get(tx.debitAkunId) ?? 0;
        computedBalances.set(tx.debitAkunId, debitBal + nominal);

        const kreditBal = computedBalances.get(tx.kreditAkunId) ?? 0;
        computedBalances.set(tx.kreditAkunId, kreditBal - nominal);
    });

    for (const acc of accounts) {
        const computed = computedBalances.get(acc.id) ?? 0;
        if (computed !== acc.saldoSekarangInt) {
            errors.push(`Account ${acc.nama} (${acc.id}): Stored ${acc.saldoSekarangInt}, Computed ${computed}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
