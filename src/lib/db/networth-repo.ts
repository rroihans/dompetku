import { db, type NetWorthSnapshotRecord } from "./app-db";
import { Money } from "@/lib/money";

export interface NetWorthData {
    tanggal: Date
    totalAset: number
    totalHutang: number
    totalCicilan: number
    netWorth: number
    breakdown: Record<string, number>
}

const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

export async function calculateCurrentNetWorth(): Promise<NetWorthData> {
    try {
        const akuns = await db.akun
            .filter(a => USER_ACCOUNT_TYPES.includes(a.tipe))
            .toArray();

        const breakdown: Record<string, number> = {}
        let totalAset = 0
        let totalHutang = 0
        let totalCicilan = 0

        for (const akun of akuns) {
            if (!breakdown[akun.tipe]) {
                breakdown[akun.tipe] = 0
            }
            const saldo = Money.toFloat(akun.saldoSekarangInt)
            breakdown[akun.tipe] += saldo

            if (akun.tipe === "CREDIT_CARD") {
                // Credit Card: saldo negatif = hutang, saldo positif = overpayment (aset)
                // Convention: transaksi belanja mengurangi saldo CC (menjadi negatif)
                // Pembayaran CC menambah saldo (menuju 0 atau positif jika overpay)
                if (saldo < 0) {
                    totalHutang += Math.abs(saldo)
                } else if (saldo > 0) {
                    // Overpayment is considered an asset (rare but possible)
                    totalAset += saldo
                }
            } else {
                // BANK, E_WALLET, CASH: saldo positif = aset, saldo negatif = hutang (overdraft)
                if (saldo > 0) {
                    totalAset += saldo
                } else if (saldo < 0) {
                    // Negative balance on bank = overdraft (hutang)
                    totalHutang += Math.abs(saldo)
                }
            }
        }

        const cicilanAktif = await db.rencanaCicilan
            .where({ status: "AKTIF" })
            .toArray();

        for (const cicilan of cicilanAktif) {
            const sisaBulan = cicilan.tenor - cicilan.cicilanKe + 1
            const nominal = Money.toFloat(cicilan.nominalPerBulanInt)
            const sisaHutang = nominal * sisaBulan
            totalCicilan += sisaHutang
        }

        // Net Worth = Aset - Hutang CC - Sisa Cicilan
        const netWorth = totalAset - totalHutang - totalCicilan

        return {
            tanggal: new Date(),
            totalAset,
            totalHutang,
            totalCicilan,
            netWorth,
            breakdown
        }
    } catch (error) {
        console.error("Error calculating net worth:", error)
        return {
            tanggal: new Date(),
            totalAset: 0,
            totalHutang: 0,
            totalCicilan: 0,
            netWorth: 0,
            breakdown: {}
        }
    }
}

export async function saveNetWorthSnapshot() {
    try {
        const data = await calculateCurrentNetWorth()
        const now = new Date()

        // Create date key (YYYY-MM-DD format)
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

        // Check if snapshot for today already exists
        const existing = await db.netWorthSnapshot.get(dateKey)

        const snapshotRecord: NetWorthSnapshotRecord = {
            id: dateKey,
            tanggal: now,
            totalAset: data.totalAset,
            totalHutang: data.totalHutang + data.totalCicilan, // Combine all liabilities
            netWorth: data.netWorth,
            breakdown: JSON.stringify(data.breakdown),
            createdAt: existing?.createdAt ?? now
        }

        await db.netWorthSnapshot.put(snapshotRecord)

        return { success: true, data }
    } catch (error: any) {
        console.error("saveNetWorthSnapshot error:", error)
        return { success: false, error: "Gagal menyimpan snapshot" }
    }
}

// Get historical net worth data for charts
export async function getNetWorthHistory(days: number = 30): Promise<{ success: boolean; data: NetWorthSnapshotRecord[] }> {
    try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const startKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
        const endKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

        const snapshots = await db.netWorthSnapshot
            .filter(s => s.id >= startKey && s.id <= endKey)
            .toArray()

        return { success: true, data: snapshots.sort((a, b) => a.id.localeCompare(b.id)) }
    } catch (error) {
        console.error("getNetWorthHistory error:", error)
        return { success: false, data: [] }
    }
}
