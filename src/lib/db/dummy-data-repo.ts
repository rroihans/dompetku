import { db } from "./app-db";
import { createId } from "./transactions-repo";
import { Money } from "../money";
import { rebuildSummaries } from "./maintenance";

const DUMMY_SETTING_KEY = "dummy_data_active";

export async function isDummyDataActive(): Promise<boolean> {
    const setting = await db.appSetting.get({ kunci: DUMMY_SETTING_KEY });
    return setting?.nilai === "true";
}

export async function toggleDummyData(): Promise<boolean> {
    const active = await isDummyDataActive();
    if (active) {
        await clearAllDummyData();
        return false;
    } else {
        await generateAllDummyData();
        return true;
    }
}

export async function clearAllDummyData() {
    console.time("clearAllDummyData");
    await db.transaction('rw', db.tables, async () => {
        const tablesToClear = [
            db.akun,
            db.transaksi,
            db.rencanaCicilan,
            db.recurringTransaction,
            db.budget,
            db.netWorthSnapshot,
            db.currencyRate,
            db.adminFee,
            db.installmentTemplate,
            db.notification,
            db.filterPreset,
            db.accountTemplate,
            db.templateTransaksi,
            db.logSistem,
            db.kategori,
            db.archivePeriod
        ];

        // We use 1 for dummy data to ensure compatibility with all IndexedDB versions
        // which always support integer keys.
        await Promise.all(tablesToClear.map(table => 
            table.where("isDummy").equals(1).delete()
        ));

        // Update setting
        const setting = await db.appSetting.get({ kunci: DUMMY_SETTING_KEY });
        if (setting) {
            await db.appSetting.update(setting.id, { nilai: "false", updatedAt: new Date() });
        }
    });

    // Rebuild summaries to reflect empty state
    await rebuildSummaries();
    console.timeEnd("clearAllDummyData");
}

export async function generateAllDummyData() {
    console.time("generateAllDummyData");
    await db.transaction('rw', db.tables, async () => {
        const now = new Date();

        // Mark as active immediately so UI knows
        const existingSetting = await db.appSetting.get({ kunci: DUMMY_SETTING_KEY });
        if (existingSetting) {
            await db.appSetting.update(existingSetting.id, { nilai: "true", updatedAt: now });
        } else {
            await db.appSetting.add({
                id: createId(),
                kunci: DUMMY_SETTING_KEY,
                nilai: "true",
                createdAt: now,
                updatedAt: now
            });
        }

        // ============================================
        // 1. AKUN (ACCOUNTS)
        // ============================================
        const akunIds = {
            // Real accounts
            bcaUtama: createId(),
            mandiri: createId(),
            gopay: createId(),
            ovo: createId(),
            shopeePay: createId(),
            cash: createId(),
            bcaCC: createId(),
            mandiriCC: createId(),
            tabunganDarurat: createId(),
            investasi: createId(),
            // Expense categories
            makanan: "EXP_MAKANAN_DUMMY",
            transportasi: "EXP_TRANSPORT_DUMMY",
            belanja: "EXP_BELANJA_DUMMY",
            hiburan: "EXP_HIBURAN_DUMMY",
            utilitas: "EXP_UTILITAS_DUMMY",
            kesehatan: "EXP_KESEHATAN_DUMMY",
            pendidikan: "EXP_PENDIDIKAN_DUMMY",
            biayaAdmin: "EXP_ADMIN_DUMMY",
            // Income categories
            gaji: "INC_GAJI_DUMMY",
            bonus: "INC_BONUS_DUMMY",
            investasiIncome: "INC_INVESTASI_DUMMY",
            freelance: "INC_FREELANCE_DUMMY",
        };

        await db.akun.bulkAdd([
            // Bank Accounts
            { id: akunIds.bcaUtama, nama: "BCA Utama (Demo)", tipe: "BANK", saldoSekarangInt: Money.fromFloat(45000000), saldoAwalInt: Money.fromFloat(30000000), warna: "#0066cc", icon: "building", biayaAdminAktif: true, biayaAdminNominalInt: Money.fromFloat(15000), biayaAdminPola: "TANGGAL_TETAP", biayaAdminTanggal: 1, isDummy: 1, createdAt: now, updatedAt: now },
            { id: akunIds.mandiri, nama: "Mandiri Payroll (Demo)", tipe: "BANK", saldoSekarangInt: Money.fromFloat(12500000), saldoAwalInt: Money.fromFloat(5000000), warna: "#003399", icon: "building", biayaAdminAktif: true, biayaAdminNominalInt: Money.fromFloat(12500), biayaAdminPola: "TANGGAL_TETAP", biayaAdminTanggal: 1, isDummy: 1, createdAt: now, updatedAt: now },
            { id: akunIds.tabunganDarurat, nama: "Tabungan Darurat (Demo)", tipe: "BANK", saldoSekarangInt: Money.fromFloat(100000000), saldoAwalInt: Money.fromFloat(100000000), warna: "#228B22", icon: "shield", isDummy: 1, createdAt: now, updatedAt: now },
            { id: akunIds.investasi, nama: "Reksa Dana (Demo)", tipe: "BANK", saldoSekarangInt: Money.fromFloat(75000000), saldoAwalInt: Money.fromFloat(50000000), warna: "#4B0082", icon: "trending-up", isDummy: 1, createdAt: now, updatedAt: now },
            // E-Wallets
            { id: akunIds.gopay, nama: "GoPay (Demo)", tipe: "E_WALLET", saldoSekarangInt: Money.fromFloat(850000), saldoAwalInt: 0, warna: "#00AA5B", icon: "smartphone", isDummy: 1, createdAt: now, updatedAt: now },
            { id: akunIds.ovo, nama: "OVO (Demo)", tipe: "E_WALLET", saldoSekarangInt: Money.fromFloat(320000), saldoAwalInt: 0, warna: "#4C3494", icon: "smartphone", isDummy: 1, createdAt: now, updatedAt: now },
            { id: akunIds.shopeePay, nama: "ShopeePay (Demo)", tipe: "E_WALLET", saldoSekarangInt: Money.fromFloat(150000), saldoAwalInt: 0, warna: "#EE4D2D", icon: "smartphone", isDummy: 1, createdAt: now, updatedAt: now },
            // Cash
            { id: akunIds.cash, nama: "Dompet Tunai (Demo)", tipe: "CASH", saldoSekarangInt: Money.fromFloat(750000), saldoAwalInt: Money.fromFloat(500000), warna: "#666666", icon: "wallet", isDummy: 1, createdAt: now, updatedAt: now },
            // Credit Cards
            { id: akunIds.bcaCC, nama: "BCA CC Platinum (Demo)", tipe: "CREDIT_CARD", saldoSekarangInt: Money.fromFloat(-8500000), saldoAwalInt: 0, limitKreditInt: Money.fromFloat(50000000), warna: "#FFD700", icon: "credit-card", billingDate: 25, dueDate: 15, isDummy: 1, createdAt: now, updatedAt: now },
            { id: akunIds.mandiriCC, nama: "Mandiri CC (Demo)", tipe: "CREDIT_CARD", saldoSekarangInt: Money.fromFloat(-3200000), saldoAwalInt: 0, limitKreditInt: Money.fromFloat(25000000), warna: "#C0C0C0", icon: "credit-card", billingDate: 1, dueDate: 20, isDummy: 1, createdAt: now, updatedAt: now },
        ]);

        // ============================================
        // 1.b KATEGORI (CATEGORIES)
        // ============================================
        const catMap = {
             Makanan: createId(),
             Transportasi: createId(),
             Belanja: createId(),
             Hiburan: createId(),
             Utilitas: createId(),
             Kesehatan: createId(),
             Pendidikan: createId(),
             Admin: createId(),
             Gaji: createId(),
             Bonus: createId(),
             Investasi: createId(),
             Freelance: createId(),
             Transfer: createId()
        };

        await db.kategori.bulkAdd([
             { id: catMap.Makanan, nama: "Makanan (Demo)", nature: "NEED", icon: "utensils", warna: "#ef4444", show: true, order: 1, isDummy: 1, createdAt: now, updatedAt: now },
             { id: catMap.Transportasi, nama: "Transport (Demo)", nature: "NEED", icon: "bus", warna: "#f97316", show: true, order: 2, isDummy: 1, createdAt: now, updatedAt: now },
             { id: catMap.Belanja, nama: "Belanja (Demo)", nature: "WANT", icon: "shopping-bag", warna: "#eab308", show: true, order: 3, isDummy: 1, createdAt: now, updatedAt: now },
             { id: catMap.Hiburan, nama: "Hiburan (Demo)", nature: "WANT", icon: "film", warna: "#8b5cf6", show: true, order: 4, isDummy: 1, createdAt: now, updatedAt: now },
             { id: catMap.Utilitas, nama: "Tagihan (Demo)", nature: "MUST", icon: "zap", warna: "#3b82f6", show: true, order: 5, isDummy: 1, createdAt: now, updatedAt: now },
             { id: catMap.Kesehatan, nama: "Kesehatan (Demo)", nature: "MUST", icon: "heart", warna: "#ec4899", show: true, order: 6, isDummy: 1, createdAt: now, updatedAt: now },
             { id: catMap.Pendidikan, nama: "Edukasi (Demo)", nature: "MUST", icon: "book-open", warna: "#06b6d4", show: true, order: 7, isDummy: 1, createdAt: now, updatedAt: now },
             { id: catMap.Admin, nama: "Biaya Admin (Demo)", nature: "MUST", icon: "receipt", warna: "#64748b", show: true, order: 99, isDummy: 1, createdAt: now, updatedAt: now },
        ]);

        // EXPENSE ACCOUNTS for double entry
        await db.akun.bulkAdd([
             { id: akunIds.makanan, nama: "Makanan (Demo)", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.transportasi, nama: "Transport (Demo)", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.belanja, nama: "Belanja (Demo)", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.hiburan, nama: "Hiburan (Demo)", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.utilitas, nama: "Tagihan (Demo)", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.kesehatan, nama: "Kesehatan (Demo)", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.pendidikan, nama: "Edukasi (Demo)", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.biayaAdmin, nama: "Biaya Admin (Demo)", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             
             { id: akunIds.gaji, nama: "Gaji (Demo)", tipe: "INCOME", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.bonus, nama: "Bonus (Demo)", tipe: "INCOME", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.investasiIncome, nama: "Investasi (Demo)", tipe: "INCOME", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
             { id: akunIds.freelance, nama: "Freelance (Demo)", tipe: "INCOME", saldoSekarangInt: 0, saldoAwalInt: 0, isDummy: 1, createdAt: now, updatedAt: now },
        ]);


        // ============================================
        // 2. TRANSAKSI (24 months of history)
        // ============================================
        const txs: any[] = [];
        // Map category name to Account ID
        const categories = [
            { kategori: "Makanan (Demo)", debit: akunIds.makanan, minNom: 25000, maxNom: 150000, freq: 25 },
            { kategori: "Transport (Demo)", debit: akunIds.transportasi, minNom: 10000, maxNom: 100000, freq: 15 },
            { kategori: "Belanja (Demo)", debit: akunIds.belanja, minNom: 50000, maxNom: 500000, freq: 8 },
            { kategori: "Hiburan (Demo)", debit: akunIds.hiburan, minNom: 30000, maxNom: 300000, freq: 6 },
            { kategori: "Tagihan (Demo)", debit: akunIds.utilitas, minNom: 100000, maxNom: 800000, freq: 3 },
            { kategori: "Kesehatan (Demo)", debit: akunIds.kesehatan, minNom: 50000, maxNom: 500000, freq: 2 },
        ];

        const desks = {
            "Makanan (Demo)": ["Makan Siang", "Makan Malam", "Kopi", "Snack", "Sarapan"],
            "Transport (Demo)": ["Ojek Online", "Bensin", "Parkir", "Tol"],
            "Belanja (Demo)": ["Supermarket", "Minimarket", "Toko Online", "Baju"],
            "Hiburan (Demo)": ["Nonton", "Game", "Langganan", "Jalan-jalan"],
            "Tagihan (Demo)": ["Listrik", "Air", "Internet", "Pulsa"],
            "Kesehatan (Demo)": ["Obat", "Vitamin", "Dokter"],
        };

        const kreditSources = [akunIds.bcaUtama, akunIds.mandiri, akunIds.gopay, akunIds.ovo, akunIds.cash, akunIds.bcaCC];

        // Generate 24 months of transactions
        for (let m = 0; m < 24; m++) {
            const year = now.getFullYear() - Math.floor(m / 12);
            const month = now.getMonth() - (m % 12);
            const targetDate = new Date(year, month, 1);
            if (targetDate > now) continue;

            // Monthly Salary
            txs.push({
                id: createId(),
                tanggal: new Date(year, month, 25),
                nominalInt: Money.fromFloat(15000000 + Math.random() * 2000000),
                debitAkunId: akunIds.mandiri,
                kreditAkunId: akunIds.gaji,
                deskripsi: "Gaji Bulanan (Demo)",
                kategori: "Gaji (Demo)",
                isDummy: 1,
                createdAt: now,
            });

            // Expenses
            for (const cat of categories) {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const numTx = Math.floor(cat.freq * (0.7 + Math.random() * 0.6));

                for (let t = 0; t < numTx; t++) {
                    const day = Math.min(Math.floor(Math.random() * daysInMonth) + 1, daysInMonth);
                    const txDate = new Date(year, month, day);
                    if (txDate > now) continue;

                    const nominal = cat.minNom + Math.random() * (cat.maxNom - cat.minNom);
                    const descList = desks[cat.kategori as keyof typeof desks] || ["Pengeluaran"];
                    const desc = descList[Math.floor(Math.random() * descList.length)];
                    const kredit = kreditSources[Math.floor(Math.random() * kreditSources.length)];

                    txs.push({
                        id: createId(),
                        tanggal: txDate,
                        nominalInt: Money.fromFloat(Math.round(nominal / 1000) * 1000),
                        debitAkunId: cat.debit,
                        kreditAkunId: kredit,
                        deskripsi: desc + " (Demo)",
                        kategori: cat.kategori,
                        isDummy: 1,
                        createdAt: now,
                    });
                }
            }
        }

        await db.transaksi.bulkAdd(txs);

        // ============================================
        // 3. RENCANA CICILAN
        // ============================================
        const cicilanList = [
            { nama: "iPhone 15 (Demo)", total: 25000000, tenor: 12, alreadyPaid: 6, akunKredit: akunIds.bcaCC },
            { nama: "Laptop (Demo)", total: 35000000, tenor: 24, alreadyPaid: 8, akunKredit: akunIds.mandiriCC },
        ];

        for (const c of cicilanList) {
            const cicilanId = createId();
            const perBulan = Math.ceil(c.total / c.tenor);
            const sisaTenor = c.tenor - c.alreadyPaid;

            await db.rencanaCicilan.add({
                id: cicilanId,
                namaProduk: c.nama,
                totalPokokInt: Money.fromFloat(c.total),
                tenor: c.tenor,
                cicilanKe: c.alreadyPaid,
                nominalPerBulanInt: Money.fromFloat(perBulan),
                tanggalJatuhTempo: 15,
                akunKreditId: c.akunKredit,
                akunDebitId: akunIds.belanja,
                status: sisaTenor === 0 ? "LUNAS" : "AKTIF",
                isDummy: 1,
                createdAt: now,
                updatedAt: now,
            });
        }

        // ============================================
        // 4. RECURRING
        // ============================================
        const recurringList = [
            { nama: "Netflix (Demo)", nominal: 199000, frek: "BULANAN", akun: akunIds.bcaCC, kat: "Hiburan (Demo)", tipe: "KELUAR" },
            { nama: "Spotify (Demo)", nominal: 79900, frek: "BULANAN", akun: akunIds.gopay, kat: "Hiburan (Demo)", tipe: "KELUAR" },
        ];

        for (const r of recurringList) {
            await db.recurringTransaction.add({
                id: createId(),
                nama: r.nama,
                nominalInt: Money.fromFloat(r.nominal),
                frekuensi: r.frek,
                hariDalamBulan: 5,
                tanggalMulai: new Date(now.getFullYear() - 1, 0, 1),
                aktif: true,
                akunId: r.akun,
                kategori: r.kat,
                tipeTransaksi: r.tipe,
                terakhirDieksekusi: now,
                isDummy: 1,
                createdAt: now,
                updatedAt: now,
            });
        }

        // ============================================
        // 5. BUDGETS
        // ============================================
        const budgetCategories = [
            { kat: "Makanan (Demo)", limit: 3000000 },
            { kat: "Transport (Demo)", limit: 1000000 },
        ];

        for (let m = 0; m < 6; m++) {
            const budgetMonth = now.getMonth() - m + 1;
            const budgetYear = now.getFullYear() - (budgetMonth <= 0 ? 1 : 0);
            const actualMonth = budgetMonth <= 0 ? 12 + budgetMonth : budgetMonth;

            for (const b of budgetCategories) {
                await db.budget.add({
                    id: createId(),
                    kategori: b.kat,
                    bulan: actualMonth,
                    tahun: budgetYear,
                    nominal: b.limit,
                    isDummy: 1,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }
        
    });

    await rebuildSummaries();
    console.timeEnd("generateAllDummyData");
}

