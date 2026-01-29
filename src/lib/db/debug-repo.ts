
import { db } from "./app-db";
import { calculateNextBillingDate } from "@/lib/template-utils";
import { Money } from "@/lib/money";

export async function getDatabaseStats() {
    try {
        const [
            akun,
            akunUser,
            transaksi,
            recurring,
            log,
            setting
        ] = await Promise.all([
            db.akun.count(),
            db.akun.where("tipe").equals("BANK").or("tipe").equals("E_WALLET").count(),
            db.transaksi.count(),
            db.recurringTransaction.count(),
            db.logSistem.count(),
            db.appSetting.count()
        ]);

        return {
            akun,
            akunUser,
            transaksi,
            recurring,
            log,
            setting
        };
    } catch (error) {
        return { akun: 0, akunUser: 0, transaksi: 0, recurring: 0, log: 0, setting: 0 };
    }
}

export async function getAkunData(page: number = 1) {
    return await getPaginatedData(db.akun, page);
}

export async function getTransaksiData(page: number = 1) {
    return await getPaginatedData(db.transaksi, page);
}

export async function getRecurringData(page: number = 1) {
    return await getPaginatedData(db.recurringTransaction, page);
}

export async function getAppSettingsData(page: number = 1) {
    return await getPaginatedData(db.appSetting, page);
}

export async function getLogData(page: number = 1, context?: string) {
    const table = db.logSistem;
    if (context) {
        const offset = (page - 1) * 50;
        const count = await table.where('modul').equals(context).count();
        const data = await table.where('modul').equals(context).offset(offset).limit(50).reverse().toArray();
        return {
            success: true,
            data,
            pagination: {
                page,
                totalPages: Math.ceil(count / 50),
                total: count
            }
        };
    }
    return await getPaginatedData(table, page, true); // Reverse for logs
}

async function getPaginatedData(table: any, page: number, reverse: boolean = false) {
    try {
        const limit = 50;
        const offset = (page - 1) * limit;
        const count = await table.count();

        let collection = table.toCollection();
        if (reverse) collection = collection.reverse();

        const data = await collection.offset(offset).limit(limit).toArray();

        return {
            success: true,
            data,
            pagination: {
                page,
                totalPages: Math.ceil(count / limit),
                total: count
            }
        };
    } catch (error) {
        return { success: false, data: [], pagination: { page: 1, totalPages: 1, total: 0 } };
    }
}

export async function logSistem(level: string, context: string, pesan: string, stack?: string) {
    try {
        await db.logSistem.add({
            id: crypto.randomUUID(),
            level,
            modul: context,
            pesan,
            stackTrace: stack, // Map stack to stackTrace
            createdAt: new Date()
        });
    } catch (e) {
        console.error("Log failed", e);
    }
}

// Quick Debug Logic
export async function quickDebugAdminFee() {
    try {
        const banks = await db.akun
            .filter(a => a.tipe === "BANK" || a.tipe === "E_WALLET")
            .toArray();

        const totalBankEWallet = banks.length;
        const withAdminFee = banks.filter(a => a.biayaAdminAktif);

        const now = new Date();
        const processedAccounts = [];
        let willBeProcessedCount = 0;

        for (const akun of withAdminFee) {
            const issues: string[] = [];
            let willProcess = false;

            // Logic Simulation
            const nominal = akun.biayaAdminNominalInt ? Money.toFloat(akun.biayaAdminNominalInt) : 0;
            const pola = akun.biayaAdminPola;
            const tanggal = akun.biayaAdminTanggal;

            if (nominal <= 0) issues.push("Nominal 0");
            if (!pola || pola === "MANUAL") issues.push("Pola belum diset atau MANUAL");

            // Calculate next billing
            const lastCharged = akun.lastAdminChargeDate ? new Date(akun.lastAdminChargeDate) : null;

            let isDue = false;
            let nextDate: Date | null = null;

            // Validate based on pattern type
            const polaNeedsTanggal = pola === "TANGGAL_TETAP";
            const isPolaValid = pola && pola !== "MANUAL" && (!polaNeedsTanggal || tanggal);

            if (isPolaValid) {
                // Calculate next billing date
                nextDate = calculateNextBillingDate(
                    pola,
                    tanggal,
                    lastCharged || new Date(now.getFullYear(), now.getMonth(), 1)
                );

                if (nextDate <= now) {
                    isDue = true;
                }
            } else if (pola === "TANGGAL_TETAP" && !tanggal) {
                issues.push("Pola TANGGAL_TETAP memerlukan tanggal");
            }

            if (isDue) {
                // Check if already charged this month
                if (lastCharged && lastCharged.getMonth() === now.getMonth() && lastCharged.getFullYear() === now.getFullYear()) {
                    issues.push("Sudah diproses bulan ini");
                    willProcess = false;
                } else {
                    willProcess = true;
                    willBeProcessedCount++;
                }
            } else if (isPolaValid) {
                issues.push(`Belum jatuh tempo (Next: ${nextDate?.toLocaleDateString('id-ID')})`);
            }

            processedAccounts.push({
                nama: akun.nama,
                nominal,
                pola,
                tanggalPola: tanggal,
                calculatedBillingDate: nextDate?.toLocaleDateString(),
                lastCharged: lastCharged?.toLocaleDateString(),
                willProcess,
                issues
            });
        }

        const recentLogs = await db.logSistem
            .where('modul').equals('ADMIN_FEE')
            .reverse()
            .limit(5).toArray();

        return {
            totalBankEWallet,
            withAdminFeeActive: withAdminFee.length,
            willBeProcessed: willBeProcessedCount,
            currentMonth: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
            accounts: processedAccounts,
            recentLogs
        };

    } catch (error) {
        console.error("quickDebugAdminFee error", error);
        return {
            totalBankEWallet: 0,
            withAdminFeeActive: 0,
            willBeProcessed: 0,
            currentMonth: "-",
            accounts: [],
            recentLogs: []
        };
    }
}
