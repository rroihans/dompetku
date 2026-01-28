import { db } from "./app-db";
import { Money } from "@/lib/money";
import { calculateNextBillingDate, getApplicableInterestRate, type TierBunga } from "@/lib/template-utils";
import { logSistem } from "../logger";

// Helper to get minimum balance for a month
export async function getMinimumBalanceForMonth(akunId: string, year: number, month: number) {
    const startTime = performance.now();
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const akun = await db.akun.get(akunId);
    if (!akun) throw new Error("Akun tidak ditemukan");
    if (akun.createdAt > endDate) return { minBalance: 0, executionTime: performance.now() - startTime, notExists: true };

    // Calculate running balance at startDate
    // 1. Get all transactions before startDate
    const debitSum = await db.transaksi
        .where("debitAkunId").equals(akunId)
        .and(tx => tx.tanggal < startDate)
        .toArray()
        .then(txs => txs.reduce((sum, tx) => sum + BigInt(tx.nominalInt), BigInt(0)));

    const kreditSum = await db.transaksi
        .where("kreditAkunId").equals(akunId)
        .and(tx => tx.tanggal < startDate)
        .toArray()
        .then(txs => txs.reduce((sum, tx) => sum + BigInt(tx.nominalInt), BigInt(0)));

    const sumMutations = Number(debitSum) - Number(kreditSum); // Careful with Number precision for very large BigInts, but here we use Int for storage (number in JS is double)
    // Actually AkunRecord uses nominalInt (number). Server action used BigInt. 
    // In Dexie implementation `nominalInt` is number.
    // So `sumMutations` can be number.

    // In app-db.ts: nominalInt: number
    // So we use number math.

    // Start with current balance, subtract mutations AFTER startDate? 
    // Easier: Start with saldoAwal, add mutations UP TO startDate.
    let runningBalance = akun.saldoAwalInt + sumMutations;

    // However, if we only have current balance, better to backtrack from current?
    // But `saldoSekarang` is mutable. `saldoAwal` is static.
    // Let's stick to: runningBalance at start = saldoAwal + (Debit - Kredit before start)

    let minBalance = runningBalance;

    // Get transactions in range
    const transactions = await db.transaksi
        .where("tanggal").between(startDate, endDate, true, true)
        .filter(tx => tx.debitAkunId === akunId || tx.kreditAkunId === akunId)
        .sortBy("tanggal");

    for (const tx of transactions) {
        if (tx.debitAkunId === akunId) runningBalance += tx.nominalInt;
        else runningBalance -= tx.nominalInt;

        if (runningBalance < minBalance) minBalance = runningBalance;
    }

    return { minBalance: Money.toFloat(minBalance), executionTime: performance.now() - startTime };
}

export async function processMonthlyAdminFees(dryRun: boolean = false) {
    try {
        const today = new Date();
        const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        // Get accounts (Bank, E-Wallet) with biayaAdminAktif
        const akunList = await db.akun
            .where("tipe").anyOf(["BANK", "E_WALLET"])
            .filter(a => !!a.biayaAdminAktif)
            .toArray();

        const processedTransactions = [];
        const failedAccounts = [];
        const skippedAccounts = [];

        for (const akun of akunList) {
            if (!akun.biayaAdminNominalInt) {
                skippedAccounts.push({ name: akun.nama, reason: "Tidak ada nominal biaya admin" });
                continue;
            }

            const billingDate = calculateNextBillingDate(
                akun.biayaAdminPola || 'FIXED_DATE',
                akun.biayaAdminTanggal || 1,
                new Date(today.getFullYear(), today.getMonth(), 1)
            );

            if (billingDate > today) {
                skippedAccounts.push({ name: akun.nama, reason: `Tanggal tagihan belum tiba (${billingDate.toLocaleDateString('id-ID')})` });
                continue;
            }

            const lastChargeStr = akun.lastAdminChargeDate ?
                `${akun.lastAdminChargeDate.getFullYear()}-${String(akun.lastAdminChargeDate.getMonth() + 1).padStart(2, '0')}` : null;

            if (lastChargeStr === currentMonthStr) {
                skippedAccounts.push({ name: akun.nama, reason: "Sudah diproses bulan ini" });
                continue;
            }

            const nominal = Money.toFloat(akun.biayaAdminNominalInt);
            const deskripsi = `Biaya admin bulanan ${akun.nama}`;

            if (dryRun) {
                processedTransactions.push({ akunId: akun.id, namaAkun: akun.nama, nominal, tanggal: billingDate });
                continue;
            }

            try {
                await db.transaction('rw', db.akun, db.transaksi, db.logSistem, async () => {
                    // Check expense account
                    let kategoriAkun = await db.akun.where("nama").equals("[EXPENSE] Biaya Admin Bank").first();
                    if (!kategoriAkun) {
                        const newId = crypto.randomUUID();
                        const now = new Date();
                        await db.akun.add({
                            id: newId,
                            nama: "[EXPENSE] Biaya Admin Bank",
                            tipe: "EXPENSE",
                            saldoAwalInt: 0,
                            saldoSekarangInt: 0,
                            warna: "#ef4444",
                            createdAt: now,
                            updatedAt: now
                        });
                        kategoriAkun = await db.akun.get(newId);
                    }

                    if (!kategoriAkun) throw new Error("Gagal membuat akun kategori");

                    const txId = crypto.randomUUID();
                    const now = new Date();

                    const txData = {
                        id: txId,
                        tanggal: billingDate,
                        deskripsi,
                        nominalInt: akun.biayaAdminNominalInt!,
                        kategori: "Biaya Admin Bank",
                        debitAkunId: kategoriAkun.id,
                        kreditAkunId: akun.id,
                        idempotencyKey: `admin-${akun.id}-${currentMonthStr}`,
                        createdAt: now
                    };

                    await db.transaksi.add(txData);

                    // Update balances
                    await db.akun.update(akun.id, {
                        saldoSekarangInt: akun.saldoSekarangInt - akun.biayaAdminNominalInt!,
                        lastAdminChargeDate: billingDate
                    });

                    // Expense account balance doesn't really matter conceptually but let's update it or assume it's calculated on fly? 
                    // In Dexie repo we usually don't maintain 'saldoSekarang' for expense accounts strictly if they are just categories, 
                    // but if they are 'akun', we might.
                    // Let's update it to be consistent.
                    await db.akun.update(kategoriAkun.id, {
                        saldoSekarangInt: kategoriAkun.saldoSekarangInt + akun.biayaAdminNominalInt!
                    });

                    processedTransactions.push(txData);
                });
            } catch (e: any) {
                failedAccounts.push({ name: akun.nama, error: e.message });
            }
        }

        const logMessage = dryRun
            ? `[SIMULASI] Biaya admin: ${processedTransactions.length} akun terdeteksi`
            : `Biaya admin diproses: ${processedTransactions.length} berhasil, ${failedAccounts.length} gagal`;

        await logSistem("INFO", "AUTOMASI", logMessage); // Use local logSistem which uses db

        return { success: true, processed: processedTransactions.length, failed: failedAccounts.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function processMonthlyInterest(dryRun: boolean = false) {
    try {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const targetMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        const useMinBalanceSetting = await db.appSetting.where("kunci").equals("USE_MIN_BALANCE_METHOD").first();
        const useMinBalance = useMinBalanceSetting?.nilai === "true";

        const akunList = await db.akun
            .where("tipe").anyOf(["BANK", "E_WALLET"])
            .filter(a => !!a.bungaAktif)
            .toArray();

        const processedTransactions = [];
        const skippedAccounts = [];
        const failedAccounts = [];

        for (const akun of akunList) {
            const lastCreditStr = akun.lastInterestCreditDate ?
                `${akun.lastInterestCreditDate.getFullYear()}-${String(akun.lastInterestCreditDate.getMonth() + 1).padStart(2, '0')}` : null;

            if (lastCreditStr === targetMonthStr) {
                skippedAccounts.push({ name: akun.nama, reason: "Sudah dikreditkan bulan ini" });
                continue;
            }

            let basisBunga = akun.saldoSekarangInt;
            let methodUsed = "Saldo Akhir";

            if (useMinBalance) {
                const res = await getMinimumBalanceForMonth(akun.id, lastMonth.getFullYear(), lastMonth.getMonth() + 1);
                if (res.notExists) {
                    skippedAccounts.push({ name: akun.nama, reason: "Akun belum ada di bulan lalu" });
                    continue;
                }
                const minBalanceInt = Money.fromFloat(res.minBalance);
                basisBunga = minBalanceInt > 0 ? minBalanceInt : 0;
                methodUsed = "Saldo Terendah";
            }

            const tiers: TierBunga[] = JSON.parse(akun.bungaTiers || "[]");
            const basisBungaFloat = Money.toFloat(basisBunga);
            const bungaPa = getApplicableInterestRate(basisBungaFloat, tiers);

            if (bungaPa <= 0) {
                skippedAccounts.push({ name: akun.nama, reason: "Bunga tidak berlaku untuk saldo ini" });
                continue;
            }

            const bungaBersih = Math.floor((basisBungaFloat * (bungaPa / 100) / 12) * 0.8);
            if (bungaBersih < 1) {
                skippedAccounts.push({ name: akun.nama, reason: "Bunga terlalu kecil (< Rp 1)" });
                continue;
            }

            if (dryRun) {
                processedTransactions.push({ name: akun.nama, nominal: bungaBersih });
                continue;
            }

            try {
                const bungaBersihInt = Money.fromFloat(bungaBersih);

                await db.transaction('rw', db.akun, db.transaksi, db.logSistem, async () => {
                    let kategoriAkun = await db.akun.where("nama").equals("[INCOME] Bunga Tabungan").first();
                    if (!kategoriAkun) {
                        const newId = crypto.randomUUID();
                        const now = new Date();
                        await db.akun.add({
                            id: newId,
                            nama: "[INCOME] Bunga Tabungan",
                            tipe: "INCOME", // Using general naming, usually 'PENDAPATAN' or 'INCOME' depending on schema usage?
                            // app-db says: tipe: string; // BANK | E_WALLET | CASH | CREDIT_CARD | EXPENSE | INCOME
                            saldoAwalInt: 0,
                            saldoSekarangInt: 0,
                            warna: "#10b981",
                            createdAt: now,
                            updatedAt: now
                        });
                        kategoriAkun = await db.akun.get(newId);
                    }
                    if (!kategoriAkun) throw new Error("Gagal membuat akun kategori");

                    const txId = crypto.randomUUID();
                    const now = new Date();

                    await db.transaksi.add({
                        id: txId,
                        tanggal: lastMonthEnd,
                        deskripsi: `Bunga tabungan ${akun.nama} (${methodUsed})`,
                        nominalInt: bungaBersihInt,
                        kategori: "Bunga Tabungan",
                        debitAkunId: akun.id,
                        kreditAkunId: kategoriAkun.id,
                        idempotencyKey: `interest-${akun.id}-${targetMonthStr}`,
                        createdAt: now
                    });

                    await db.akun.update(akun.id, {
                        saldoSekarangInt: akun.saldoSekarangInt + bungaBersihInt,
                        lastInterestCreditDate: lastMonthEnd
                    });

                    await db.akun.update(kategoriAkun.id, {
                        saldoSekarangInt: kategoriAkun.saldoSekarangInt + bungaBersihInt
                    });

                    processedTransactions.push({ name: akun.nama });
                });
            } catch (e: any) {
                failedAccounts.push({ name: akun.nama, error: e.message });
            }
        }

        const logMessage = dryRun
            ? `[SIMULASI] Bunga tabungan: ${processedTransactions.length} akun terdeteksi`
            : `Bunga tabungan diproses: ${processedTransactions.length} berhasil`;

        await logSistem("INFO", "AUTOMASI", logMessage);

        return { success: true, processed: processedTransactions.length, failed: 0 };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function resetAccountToTemplate(akunId: string) {
    try {
        const akun = await db.akun.get(akunId);
        if (!akun || !akun.templateId) return { success: false, error: "Akun/Template tidak ditemukan" };

        const template = await db.accountTemplate.get(akun.templateId);
        if (!template) return { success: false, error: "Template tidak ditemukan" };

        await db.akun.update(akunId, {
            biayaAdminAktif: true,
            biayaAdminNominalInt: template.biayaAdmin ? Money.fromFloat(template.biayaAdmin) : null,
            biayaAdminPola: template.polaTagihan,
            biayaAdminTanggal: template.tanggalTagihan,
            bungaAktif: true,
            bungaTiers: template.bungaTier,
            lastInterestCreditDate: null,
            lastAdminChargeDate: null
        });

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
