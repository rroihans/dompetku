import { db } from "./app-db";
import { createId } from "./transactions-repo";
import { Money } from "../money";

/**
 * Comprehensive Seed Data Generator
 * Generates realistic dummy data for all features
 */
export async function seedDummyData() {
    await db.transaction('rw', db.tables, async () => {
        // Clear all first
        await Promise.all(db.tables.map(table => table.clear()));

        const now = new Date();

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
            makanan: "EXP_MAKANAN",
            transportasi: "EXP_TRANSPORT",
            belanja: "EXP_BELANJA",
            hiburan: "EXP_HIBURAN",
            utilitas: "EXP_UTILITAS",
            kesehatan: "EXP_KESEHATAN",
            pendidikan: "EXP_PENDIDIKAN",
            biayaAdmin: "EXP_ADMIN",
            // Income categories
            gaji: "INC_GAJI",
            bonus: "INC_BONUS",
            investasiIncome: "INC_INVESTASI",
            freelance: "INC_FREELANCE",
        };

        await db.akun.bulkAdd([
            // Bank Accounts
            { id: akunIds.bcaUtama, nama: "BCA Utama", tipe: "BANK", saldoSekarangInt: Money.fromFloat(45000000), saldoAwalInt: Money.fromFloat(30000000), warna: "#0066cc", icon: "building", biayaAdminAktif: true, biayaAdminNominalInt: Money.fromFloat(15000), biayaAdminPola: "TANGGAL_TETAP", biayaAdminTanggal: 1, createdAt: now, updatedAt: now },
            { id: akunIds.mandiri, nama: "Mandiri Payroll", tipe: "BANK", saldoSekarangInt: Money.fromFloat(12500000), saldoAwalInt: Money.fromFloat(5000000), warna: "#003399", icon: "building", biayaAdminAktif: true, biayaAdminNominalInt: Money.fromFloat(12500), biayaAdminPola: "TANGGAL_TETAP", biayaAdminTanggal: 1, createdAt: now, updatedAt: now },
            { id: akunIds.tabunganDarurat, nama: "Tabungan Darurat", tipe: "BANK", saldoSekarangInt: Money.fromFloat(100000000), saldoAwalInt: Money.fromFloat(100000000), warna: "#228B22", icon: "shield", createdAt: now, updatedAt: now },
            { id: akunIds.investasi, nama: "Reksa Dana", tipe: "BANK", saldoSekarangInt: Money.fromFloat(75000000), saldoAwalInt: Money.fromFloat(50000000), warna: "#4B0082", icon: "trending-up", createdAt: now, updatedAt: now },
            // E-Wallets
            { id: akunIds.gopay, nama: "GoPay", tipe: "E_WALLET", saldoSekarangInt: Money.fromFloat(850000), saldoAwalInt: 0, warna: "#00AA5B", icon: "smartphone", createdAt: now, updatedAt: now },
            { id: akunIds.ovo, nama: "OVO", tipe: "E_WALLET", saldoSekarangInt: Money.fromFloat(320000), saldoAwalInt: 0, warna: "#4C3494", icon: "smartphone", createdAt: now, updatedAt: now },
            { id: akunIds.shopeePay, nama: "ShopeePay", tipe: "E_WALLET", saldoSekarangInt: Money.fromFloat(150000), saldoAwalInt: 0, warna: "#EE4D2D", icon: "smartphone", createdAt: now, updatedAt: now },
            // Cash
            { id: akunIds.cash, nama: "Dompet Tunai", tipe: "CASH", saldoSekarangInt: Money.fromFloat(750000), saldoAwalInt: Money.fromFloat(500000), warna: "#666666", icon: "wallet", createdAt: now, updatedAt: now },
            // Credit Cards
            { id: akunIds.bcaCC, nama: "BCA CC Platinum", tipe: "CREDIT_CARD", saldoSekarangInt: Money.fromFloat(-8500000), saldoAwalInt: 0, limitKreditInt: Money.fromFloat(50000000), warna: "#FFD700", icon: "credit-card", billingDate: 25, dueDate: 15, createdAt: now, updatedAt: now },
            { id: akunIds.mandiriCC, nama: "Mandiri CC", tipe: "CREDIT_CARD", saldoSekarangInt: Money.fromFloat(-3200000), saldoAwalInt: 0, limitKreditInt: Money.fromFloat(25000000), warna: "#C0C0C0", icon: "credit-card", billingDate: 1, dueDate: 20, createdAt: now, updatedAt: now },
            // Expense Categories
            { id: akunIds.makanan, nama: "Makanan & Minuman", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.transportasi, nama: "Transportasi", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.belanja, nama: "Belanja Online", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.hiburan, nama: "Hiburan & Gaya Hidup", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.utilitas, nama: "Utilitas & Tagihan", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.kesehatan, nama: "Kesehatan", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.pendidikan, nama: "Pendidikan", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.biayaAdmin, nama: "Biaya Admin Bank", tipe: "EXPENSE", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            // Income Categories
            { id: akunIds.gaji, nama: "Gaji Bulanan", tipe: "INCOME", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.bonus, nama: "Bonus & THR", tipe: "INCOME", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.investasiIncome, nama: "Dividen & Bunga", tipe: "INCOME", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
            { id: akunIds.freelance, nama: "Penghasilan Freelance", tipe: "INCOME", saldoSekarangInt: 0, saldoAwalInt: 0, createdAt: now, updatedAt: now },
        ]);

        // ============================================
        // 2. TRANSAKSI (24 months of history)
        // ============================================
        const txs: any[] = [];
        const categories = [
            { kategori: "Makanan", debit: akunIds.makanan, minNom: 25000, maxNom: 150000, freq: 25 },
            { kategori: "Transportasi", debit: akunIds.transportasi, minNom: 10000, maxNom: 100000, freq: 15 },
            { kategori: "Belanja", debit: akunIds.belanja, minNom: 50000, maxNom: 500000, freq: 8 },
            { kategori: "Hiburan", debit: akunIds.hiburan, minNom: 30000, maxNom: 300000, freq: 6 },
            { kategori: "Utilitas", debit: akunIds.utilitas, minNom: 100000, maxNom: 800000, freq: 3 },
            { kategori: "Kesehatan", debit: akunIds.kesehatan, minNom: 50000, maxNom: 500000, freq: 2 },
        ];

        const desks = {
            Makanan: ["Makan Siang", "Makan Malam", "Kopi Starbucks", "Nasi Padang", "Sate Ayam", "Bakso", "Martabak", "Indomie", "GoFood", "GrabFood"],
            Transportasi: ["Gojek", "Grab", "MRT Jakarta", "Transjakarta", "Bensin", "Parkir", "Tol", "Ojol Pulang", "Maxim"],
            Belanja: ["Tokopedia", "Shopee", "Lazada", "Blibli", "Uniqlo", "H&M", "Miniso", "Alfamart", "Indomaret"],
            Hiburan: ["Netflix", "Spotify", "Bioskop CGV", "Karaoke", "Steam Game", "YouTube Premium", "Disney+"],
            Utilitas: ["PLN Token", "PDAM", "Internet Indihome", "Pulsa Telkomsel", "Gas LPG", "Iuran RT"],
            Kesehatan: ["Apotek", "Halodoc", "Vitamin", "Check Up", "Dokter Gigi", "Obat Flu"],
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
                deskripsi: "Gaji Bulanan",
                kategori: "Gaji",
                createdAt: now,
            });

            // Transfer to BCA
            txs.push({
                id: createId(),
                tanggal: new Date(year, month, 26),
                nominalInt: Money.fromFloat(10000000),
                debitAkunId: akunIds.bcaUtama,
                kreditAkunId: akunIds.mandiri,
                deskripsi: "Transfer ke BCA",
                kategori: "Transfer",
                createdAt: now,
            });

            // Top up e-wallets
            txs.push({
                id: createId(),
                tanggal: new Date(year, month, 27),
                nominalInt: Money.fromFloat(500000),
                debitAkunId: akunIds.gopay,
                kreditAkunId: akunIds.bcaUtama,
                deskripsi: "Top Up GoPay",
                kategori: "Transfer",
                createdAt: now,
            });

            // Expenses throughout month
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
                        deskripsi: desc,
                        kategori: cat.kategori,
                        createdAt: now,
                    });
                }
            }

            // Weekly Side Hustle (to make graph wavy)
            for (let w = 1; w <= 4; w++) {
                const hustleDate = new Date(year, month, w * 7 - Math.floor(Math.random() * 2));
                if (hustleDate > now) continue;

                txs.push({
                    id: createId(),
                    tanggal: hustleDate,
                    nominalInt: Money.fromFloat(1500000 + Math.random() * 500000),
                    debitAkunId: akunIds.gopay, // Use a different account or exist
                    kreditAkunId: akunIds.freelance,
                    deskripsi: "Project Freelance Mingguan",
                    kategori: "Penghasilan Freelance",
                    createdAt: now,
                });
            }

            // Bank admin fees
            txs.push({
                id: createId(),
                tanggal: new Date(year, month, 1),
                nominalInt: Money.fromFloat(15000),
                debitAkunId: akunIds.biayaAdmin,
                kreditAkunId: akunIds.bcaUtama,
                deskripsi: "Biaya Admin BCA",
                kategori: "Biaya Admin Bank",
                createdAt: now,
            });
        }

        await db.transaksi.bulkAdd(txs);

        // ============================================
        // 3. RENCANA CICILAN (Installments)
        // ============================================
        const cicilanList = [
            { nama: "iPhone 15 Pro Max", total: 25000000, tenor: 12, sudahBayar: 6, akunKredit: akunIds.bcaCC },
            { nama: "Laptop ASUS ROG", total: 35000000, tenor: 24, sudahBayar: 8, akunKredit: akunIds.mandiriCC },
            { nama: "AC Daikin 1PK", total: 8000000, tenor: 6, sudahBayar: 4, akunKredit: akunIds.bcaCC },
            { nama: "Samsung Galaxy S24", total: 18000000, tenor: 12, sudahBayar: 3, akunKredit: akunIds.bcaCC },
            { nama: "Sofa Minimalis", total: 12000000, tenor: 10, sudahBayar: 10, akunKredit: akunIds.mandiriCC }, // Lunas
        ];

        for (const c of cicilanList) {
            const cicilanId = createId();
            const perBulan = Math.ceil(c.total / c.tenor);
            const sisaTenor = c.tenor - c.sudahBayar;

            await db.rencanaCicilan.add({
                id: cicilanId,
                namaProduk: c.nama,
                totalPokokInt: Money.fromFloat(c.total),
                tenor: c.tenor,
                cicilanKe: c.sudahBayar,
                nominalPerBulanInt: Money.fromFloat(perBulan),
                tanggalJatuhTempo: 15,
                akunKreditId: c.akunKredit,
                akunDebitId: akunIds.belanja,
                status: sisaTenor === 0 ? "LUNAS" : "AKTIF",
                createdAt: now,
                updatedAt: now,
            });
        }

        // ============================================
        // 4. RECURRING TRANSACTIONS
        // ============================================
        const recurringList = [
            { nama: "Netflix Premium", nominal: 199000, frek: "BULANAN", akun: akunIds.bcaCC, kat: "Hiburan & Gaya Hidup", tipe: "KELUAR" },
            { nama: "Spotify Family", nominal: 79900, frek: "BULANAN", akun: akunIds.gopay, kat: "Hiburan & Gaya Hidup", tipe: "KELUAR" },
            { nama: "YouTube Premium", nominal: 59000, frek: "BULANAN", akun: akunIds.ovo, kat: "Hiburan & Gaya Hidup", tipe: "KELUAR" },
            { nama: "Disney+ Hotstar", nominal: 39000, frek: "BULANAN", akun: akunIds.bcaCC, kat: "Hiburan & Gaya Hidup", tipe: "KELUAR" },
            { nama: "Internet Indihome", nominal: 450000, frek: "BULANAN", akun: akunIds.bcaUtama, kat: "Utilitas & Tagihan", tipe: "KELUAR" },
            { nama: "Listrik PLN", nominal: 350000, frek: "BULANAN", akun: akunIds.bcaUtama, kat: "Utilitas & Tagihan", tipe: "KELUAR" },
            { nama: "PDAM Air", nominal: 85000, frek: "BULANAN", akun: akunIds.mandiri, kat: "Utilitas & Tagihan", tipe: "KELUAR" },
            { nama: "Gym Membership", nominal: 300000, frek: "BULANAN", akun: akunIds.bcaCC, kat: "Kesehatan", tipe: "KELUAR" },
            { nama: "Asuransi Kesehatan", nominal: 500000, frek: "BULANAN", akun: akunIds.mandiri, kat: "Kesehatan", tipe: "KELUAR" },
            { nama: "BPJS Mandiri", nominal: 150000, frek: "BULANAN", akun: akunIds.bcaUtama, kat: "Kesehatan", tipe: "KELUAR" },
        ];

        for (const r of recurringList) {
            await db.recurringTransaction.add({
                id: createId(),
                nama: r.nama,
                nominalInt: Money.fromFloat(r.nominal),
                frekuensi: r.frek,
                hariDalamBulan: 5 + Math.floor(Math.random() * 20),
                tanggalMulai: new Date(now.getFullYear() - 1, 0, 1),
                aktif: true,
                akunId: r.akun,
                kategori: r.kat,
                tipeTransaksi: r.tipe,
                terakhirDieksekusi: new Date(now.getFullYear(), now.getMonth(), 5),
                createdAt: now,
                updatedAt: now,
            });
        }

        // ============================================
        // 5. BUDGETS
        // ============================================
        const budgetCategories = [
            { kat: "Makanan & Minuman", limit: 3000000 },
            { kat: "Transportasi", limit: 1000000 },
            { kat: "Belanja Online", limit: 2000000 },
            { kat: "Hiburan & Gaya Hidup", limit: 1500000 },
            { kat: "Utilitas & Tagihan", limit: 1500000 },
            { kat: "Kesehatan", limit: 500000 },
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
                    nominal: b.limit + Math.floor(Math.random() * 500000),
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }

        // ============================================
        // 6. TEMPLATE TRANSAKSI
        // ============================================
        const templates = [
            { nama: "Makan Siang Kantor", kat: "Makanan & Minuman", nom: 35000, tipe: "KELUAR", akun: akunIds.gopay },
            { nama: "Bensin Motor", kat: "Transportasi", nom: 50000, tipe: "KELUAR", akun: akunIds.cash },
            { nama: "Kopi Pagi", kat: "Makanan & Minuman", nom: 25000, tipe: "KELUAR", akun: akunIds.ovo },
            { nama: "Parkir Mall", kat: "Transportasi", nom: 15000, tipe: "KELUAR", akun: akunIds.cash },
            { nama: "Laundry Mingguan", kat: "Belanja Online", nom: 50000, tipe: "KELUAR", akun: akunIds.gopay },
            { nama: "Ojol Pulang Kerja", kat: "Transportasi", nom: 25000, tipe: "KELUAR", akun: akunIds.gopay },
            { nama: "Top Up GoPay 500K", kat: "Transfer", nom: 500000, tipe: "TRANSFER", akun: akunIds.bcaUtama },
            { nama: "Top Up OVO 300K", kat: "Transfer", nom: 300000, tipe: "TRANSFER", akun: akunIds.bcaUtama },
        ];

        for (const t of templates) {
            await db.templateTransaksi.add({
                id: createId(),
                nama: t.nama,
                deskripsi: t.nama,
                kategori: t.kat,
                nominal: t.nom,
                tipeTransaksi: t.tipe,
                akunId: t.akun,
                usageCount: Math.floor(Math.random() * 50),
                createdAt: now,
                updatedAt: now,
            });
        }

        // ============================================
        // 7. ACCOUNT TEMPLATES
        // ============================================
        await db.accountTemplate.bulkAdd([
            { id: createId(), nama: "Bank BCA", tipeAkun: "BANK", biayaAdmin: 15000, polaTagihan: "TANGGAL_TETAP", tanggalTagihan: 1, isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "Bank Mandiri", tipeAkun: "BANK", biayaAdmin: 12500, polaTagihan: "TANGGAL_TETAP", tanggalTagihan: 1, isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "Bank BNI", tipeAkun: "BANK", biayaAdmin: 11000, polaTagihan: "TANGGAL_TETAP", tanggalTagihan: 1, isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "GoPay", tipeAkun: "E_WALLET", polaTagihan: "NONE", isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "OVO", tipeAkun: "E_WALLET", polaTagihan: "NONE", isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "DANA", tipeAkun: "E_WALLET", polaTagihan: "NONE", isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "ShopeePay", tipeAkun: "E_WALLET", polaTagihan: "NONE", isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "CC BCA Platinum", tipeAkun: "CREDIT_CARD", polaTagihan: "TANGGAL_TETAP", tanggalTagihan: 25, isActive: true, createdAt: now, updatedAt: now },
        ]);

        // ============================================
        // 8. INSTALLMENT TEMPLATES
        // ============================================
        await db.installmentTemplate.bulkAdd([
            { id: createId(), nama: "BCA Card 0%", bankName: "BCA", cardType: "Platinum", tenorOptions: "[3, 6, 12, 24]", adminFeeType: "FLAT", interestRate: 0, isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "Mandiri Card", bankName: "Mandiri", cardType: "Gold", tenorOptions: "[3, 6, 12]", adminFeeType: "PERCENT", adminFeeAmount: 0.99, interestRate: 0.99, isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "BNI Card", bankName: "BNI", cardType: "Platinum", tenorOptions: "[6, 12]", adminFeeType: "FLAT", interestRate: 0, isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "Kredivo", bankName: "Kredivo", cardType: "PayLater", tenorOptions: "[3, 6, 12]", adminFeeType: "PERCENT", adminFeeAmount: 2.95, interestRate: 2.95, isActive: true, createdAt: now, updatedAt: now },
            { id: createId(), nama: "Akulaku", bankName: "Akulaku", cardType: "PayLater", tenorOptions: "[3, 6, 12]", adminFeeType: "PERCENT", adminFeeAmount: 3.5, interestRate: 3.5, isActive: true, createdAt: now, updatedAt: now },
        ]);

        // ============================================
        // 9. NOTIFICATIONS
        // ============================================
        await db.notification.bulkAdd([
            { id: createId(), title: "Cicilan Jatuh Tempo", message: "Cicilan iPhone 15 Pro Max jatuh tempo dalam 3 hari", type: "cicilan", severity: "WARNING", read: false, createdAt: new Date(now.getTime() - 1000 * 60 * 30), updatedAt: now },
            { id: createId(), title: "Budget Hampir Habis", message: "Budget Makanan & Minuman bulan ini tersisa 15%", type: "budget", severity: "WARNING", read: false, createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2), updatedAt: now },
            { id: createId(), title: "Transaksi Berhasil", message: "Transfer ke GoPay Rp500.000 berhasil", type: "transaksi", severity: "INFO", read: true, createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), updatedAt: now },
            { id: createId(), title: "Tagihan Kartu Kredit", message: "Tagihan BCA CC Platinum bulan ini Rp8.500.000", type: "cc", severity: "INFO", read: false, createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48), updatedAt: now },
            { id: createId(), title: "Recurring Dieksekusi", message: "Netflix Premium Rp199.000 telah didebit otomatis", type: "recurring", severity: "INFO", read: true, createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 72), updatedAt: now },
        ]);

        // ============================================
        // 10. CURRENCY RATES
        // ============================================
        await db.currencyRate.bulkAdd([
            { id: createId(), kodeAsal: "USD", kodeTujuan: "IDR", rate: 16250, sumber: "manual", tanggalUpdate: now, createdAt: now, updatedAt: now },
            { id: createId(), kodeAsal: "EUR", kodeTujuan: "IDR", rate: 17500, sumber: "manual", tanggalUpdate: now, createdAt: now, updatedAt: now },
            { id: createId(), kodeAsal: "SGD", kodeTujuan: "IDR", rate: 12100, sumber: "manual", tanggalUpdate: now, createdAt: now, updatedAt: now },
            { id: createId(), kodeAsal: "MYR", kodeTujuan: "IDR", rate: 3650, sumber: "manual", tanggalUpdate: now, createdAt: now, updatedAt: now },
            { id: createId(), kodeAsal: "JPY", kodeTujuan: "IDR", rate: 108, sumber: "manual", tanggalUpdate: now, createdAt: now, updatedAt: now },
            { id: createId(), kodeAsal: "GBP", kodeTujuan: "IDR", rate: 20500, sumber: "manual", tanggalUpdate: now, createdAt: now, updatedAt: now },
            { id: createId(), kodeAsal: "AUD", kodeTujuan: "IDR", rate: 10700, sumber: "manual", tanggalUpdate: now, createdAt: now, updatedAt: now },
        ]);

        // ============================================
        // 11. FILTER PRESETS
        // ============================================
        await db.filterPreset.bulkAdd([
            { id: createId(), name: "Pengeluaran Makanan Bulan Ini", filters: JSON.stringify({ kategori: "Makanan & Minuman", period: "thisMonth" }), usageCount: 15, createdAt: now, updatedAt: now },
            { id: createId(), name: "Semua CC Transactions", filters: JSON.stringify({ akunId: akunIds.bcaCC }), usageCount: 8, createdAt: now, updatedAt: now },
            { id: createId(), name: "Transfer E-Wallet", filters: JSON.stringify({ kategori: "Transfer" }), usageCount: 5, createdAt: now, updatedAt: now },
        ]);

        // ============================================
        // 12. ADMIN FEES (With Linked Recurring)
        // ============================================
        const bcaRecurringId = createId();
        const mandiriRecurringId = createId();

        await db.recurringTransaction.bulkAdd([
            {
                id: bcaRecurringId,
                nama: "[Auto] Biaya Admin BCA",
                nominalInt: Money.fromFloat(15000),
                kategori: "Biaya Admin Bank",
                tipeTransaksi: "KELUAR",
                akunId: akunIds.bcaUtama,
                frekuensi: "BULANAN",
                hariDalamBulan: 1,
                aktif: true,
                isAutoGenerated: true,
                createdAt: now,
                updatedAt: now,
                tanggalMulai: new Date(now.getFullYear(), now.getMonth(), 1), // This month
            },
            {
                id: mandiriRecurringId,
                nama: "[Auto] Biaya Admin Mandiri",
                nominalInt: Money.fromFloat(12500),
                kategori: "Biaya Admin Bank",
                tipeTransaksi: "KELUAR",
                akunId: akunIds.mandiri,
                frekuensi: "BULANAN",
                hariDalamBulan: 1,
                aktif: true,
                isAutoGenerated: true,
                createdAt: now,
                updatedAt: now,
                tanggalMulai: new Date(now.getFullYear(), now.getMonth(), 1),
            }
        ]);

        await db.adminFee.bulkAdd([
            { id: createId(), akunId: akunIds.bcaUtama, deskripsi: "Biaya Admin BCA", nominal: 15000, isActive: true, recurringTxId: bcaRecurringId, createdAt: now, updatedAt: now },
            { id: createId(), akunId: akunIds.mandiri, deskripsi: "Biaya Admin Mandiri", nominal: 12500, isActive: true, recurringTxId: mandiriRecurringId, createdAt: now, updatedAt: now },
        ]);

        // ============================================
        // 13. APP SETTINGS
        // ============================================
        await db.appSetting.bulkAdd([
            { id: createId(), kunci: "theme", nilai: "dark", createdAt: now, updatedAt: now },
            { id: createId(), kunci: "currency", nilai: "IDR", createdAt: now, updatedAt: now },
            { id: createId(), kunci: "privacyMode", nilai: "false", createdAt: now, updatedAt: now },
            { id: createId(), kunci: "lastSyncDate", nilai: now.toISOString(), createdAt: now, updatedAt: now },
        ]);

        // ============================================
        // 14. LOG SISTEM
        // ============================================
        await db.logSistem.bulkAdd([
            { id: createId(), level: "INFO", modul: "SEED", pesan: "Data demo berhasil di-generate", createdAt: now },
            { id: createId(), level: "INFO", modul: "AUTH", pesan: "User logged in", createdAt: new Date(now.getTime() - 1000 * 60 * 60) },
            { id: createId(), level: "WARNING", modul: "BUDGET", pesan: "Budget Makanan mendekati limit", createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2) },
        ]);

        // ============================================
        // 15. NET WORTH SNAPSHOTS (12 months history)
        // ============================================
        const netWorthSnapshots = [];
        for (let m = 0; m < 12; m++) {
            const snapshotDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
            const baseAset = 200000000 + (12 - m) * 5000000 + Math.random() * 10000000;
            const baseHutang = 15000000 - m * 500000 + Math.random() * 2000000;
            netWorthSnapshots.push({
                id: createId(),
                tanggal: snapshotDate,
                totalAset: Math.round(baseAset),
                totalHutang: Math.round(baseHutang),
                netWorth: Math.round(baseAset - baseHutang),
                breakdown: JSON.stringify({
                    bank: Math.round(baseAset * 0.6),
                    eWallet: Math.round(baseAset * 0.05),
                    cash: Math.round(baseAset * 0.02),
                    investasi: Math.round(baseAset * 0.33),
                    creditCard: Math.round(baseHutang)
                }),
                createdAt: snapshotDate
            });
        }
        await db.netWorthSnapshot.bulkAdd(netWorthSnapshots);

        // ============================================
        // 16. ARCHIVE PERIODS
        // ============================================
        await db.archivePeriod.bulkAdd([
            { id: "2024-12", archived: true, archiveFileRef: "archive_2024_12.json", createdAt: new Date(2025, 0, 1) },
            { id: "2025-01", archived: false, createdAt: new Date(2025, 1, 1) },
        ]);

        console.log(`✅ Seeding complete!
- Accounts: 22
- Transactions: ${txs.length}+
- Cicilan: 5
- Recurring: 10
- Budgets: ${budgetCategories.length * 6}
- Templates: 8
- Account Templates: 8
- Installment Templates: 5
- Notifications: 5
- Currency Rates: 7
- Filter Presets: 3
- Admin Fees: 2
- App Settings: 4
- Log Sistem: 3
- Net Worth Snapshots: 12
- Archive Periods: 2`);
    });
}

