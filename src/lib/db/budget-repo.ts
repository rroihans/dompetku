import { db, BudgetRecord } from "./app-db";
import { Money } from "@/lib/money";

export interface BudgetData {
    kategori: string;
    bulan: number;  // 1-12
    tahun: number;  // 2024, 2025, etc
    nominal: number;
}

// Buat atau update budget
export async function upsertBudget(data: BudgetData) {
    try {
        // Validasi
        if (data.nominal <= 0) {
            return { success: false, error: "Nominal harus lebih dari 0" };
        }

        if (data.bulan < 1 || data.bulan > 12) {
            return { success: false, error: "Bulan harus antara 1-12" };
        }

        const now = new Date();

        // Cari existing budget
        // We can use [bulan+tahun] index and filter by category or just getAll for month and find
        const existing = await db.budget
            .where({ bulan: data.bulan, tahun: data.tahun })
            .filter(b => b.kategori === data.kategori)
            .first();

        let budget;
        if (existing) {
            // Update
            await db.budget.update(existing.id, {
                nominal: data.nominal,
                updatedAt: now
            });
            budget = await db.budget.get(existing.id);
        } else {
            // Create
            const id = crypto.randomUUID();
            budget = {
                id,
                kategori: data.kategori,
                bulan: data.bulan,
                tahun: data.tahun,
                nominal: data.nominal,
                createdAt: now,
                updatedAt: now
            };
            await db.budget.add(budget);
        }

        return { success: true, data: budget };
    } catch (error: any) {
        console.error("upsertBudget error", error);
        return { success: false, error: "Gagal menyimpan budget" };
    }
}

// Ambil budget untuk bulan tertentu
export async function getBudgetByMonth(bulan: number, tahun: number) {
    try {
        const budgets = await db.budget
            .where({ bulan, tahun })
            .sortBy("kategori");
        return { success: true, data: budgets };
    } catch (error: any) {
        return { success: false, data: [], error: "Gagal mengambil budget" };
    }
}

// Ambil budget dengan realisasi pengeluaran
export async function getBudgetWithRealization(bulan: number, tahun: number) {
    try {
        // Ambil semua budget untuk bulan ini
        const budgets = await db.budget
            .where({ bulan, tahun })
            .sortBy("kategori");

        // Ambil pengeluaran per kategori untuk bulan ini
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999);

        // Fetch transactions directly from Dexie
        const transaksi = await db.transaksi
            .where("tanggal")
            .between(startDate, endDate, true, true)
            .toArray();

        // We need to check account type for each transaction.
        // Optimization: Fetch all accounts once or fetch relevant accounts.
        // Fetch all accounts into a map for fast lookup.
        const akunList = await db.akun.toArray();
        const akunMap = new Map(akunList.map(a => [a.id, a]));

        // Filter for EXPENSE transactions
        const expenseTransactions = transaksi.filter(tx => {
            const debitAkun = akunMap.get(tx.debitAkunId);
            return debitAkun?.tipe === "EXPENSE";
        });

        const recurringList = await db.recurringTransaction.toArray();
        // Manual filter for complex OR logic
        const activeRecurring = recurringList.filter(r => {
            if (!r.aktif || r.tipeTransaksi !== "KELUAR") return false;
            // Check tanggalSelesai
            if (r.tanggalSelesai && r.tanggalSelesai < startDate) return false;
            return true;
        });

        // Group by kategori (Realisasi)
        const realisasiMap = new Map<string, number>();
        for (const tx of expenseTransactions) {
            const current = realisasiMap.get(tx.kategori) || 0;
            const nominal = Money.toFloat(tx.nominalInt);
            realisasiMap.set(tx.kategori, current + nominal);
        }

        // Group by kategori (Proyeksi Recurring)
        const proyeksiMap = new Map<string, number>();
        for (const r of activeRecurring) {
            // Cek apakah sudah dieksekusi bulan ini
            const isExecuted = r.terakhirDieksekusi &&
                new Date(r.terakhirDieksekusi) >= startDate &&
                new Date(r.terakhirDieksekusi) <= endDate;

            if (!isExecuted) {
                const current = proyeksiMap.get(r.kategori) || 0;
                // nominal in Recurring is nominalInt
                proyeksiMap.set(r.kategori, current + Money.toFloat(r.nominalInt));
            }
        }

        // Hitung sisa hari
        const now = new Date();
        const isCurrentMonth = now.getMonth() + 1 === bulan && now.getFullYear() === tahun;
        let sisaHari = 0;
        if (isCurrentMonth) {
            const lastDay = new Date(tahun, bulan, 0).getDate();
            sisaHari = lastDay - now.getDate() + 1;
        } else {
            const targetMonth = new Date(tahun, bulan - 1, 1);
            if (targetMonth > now) {
                sisaHari = new Date(tahun, bulan, 0).getDate();
            }
        }

        // Gabungkan budget dengan realisasi dan proyeksi
        const result = budgets.map(b => {
            const realisasi = realisasiMap.get(b.kategori) || 0;
            const proyeksi = proyeksiMap.get(b.kategori) || 0;
            const totalPrediksi = realisasi + proyeksi;
            const sisa = b.nominal - totalPrediksi;
            return {
                ...b,
                realisasi,
                proyeksi,
                persentase: b.nominal > 0 ? Math.round((realisasi / b.nominal) * 100) : (realisasi > 0 ? 100 : 0),
                persentaseProyeksi: b.nominal > 0 ? Math.round((totalPrediksi / b.nominal) * 100) : (totalPrediksi > 0 ? 100 : 0),
                sisa,
                saranHarian: sisa > 0 && sisaHari > 0 ? Math.floor(sisa / sisaHari) : 0,
            };
        });

        // Tambahkan kategori yang ada pengeluaran tapi tidak ada budget
        const budgetKategori = new Set(budgets.map(b => b.kategori));
        const unbudgetedCategories: any[] = [];

        // Merge realisasi and proyeksi categories
        const allCategories = new Set([...realisasiMap.keys(), ...proyeksiMap.keys()]);

        allCategories.forEach(kategori => {
            if (!budgetKategori.has(kategori)) {
                const realisasi = realisasiMap.get(kategori) || 0;
                const proyeksi = proyeksiMap.get(kategori) || 0;
                const total = realisasi + proyeksi;
                unbudgetedCategories.push({
                    id: null,
                    kategori,
                    bulan,
                    tahun,
                    nominal: 0,
                    realisasi,
                    proyeksi,
                    persentase: 100,
                    sisa: -total,
                    noBudget: true,
                });
            }
        });

        return {
            success: true,
            data: {
                budgets: result,
                unbudgeted: unbudgetedCategories,
                totalBudget: budgets.reduce((sum, b) => sum + b.nominal, 0),
                totalRealisasi: Array.from(realisasiMap.values()).reduce((sum, n) => sum + n, 0),
                totalProyeksi: Array.from(proyeksiMap.values()).reduce((sum, n) => sum + n, 0),
                sisaHari,
            }
        };
    } catch (error: any) {
        console.error("getBudgetWithRealization error", error);
        return {
            success: false,
            data: { budgets: [], unbudgeted: [], totalBudget: 0, totalRealisasi: 0, totalProyeksi: 0, sisaHari: 0 }
        };
    }
}

// Hapus budget
export async function deleteBudget(id: string) {
    try {
        await db.budget.delete(id);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Gagal menghapus budget" };
    }
}

// Salin budget dari bulan sebelumnya
export async function copyBudgetFromPreviousMonth(bulan: number, tahun: number) {
    try {
        // Hitung bulan sebelumnya
        let prevBulan = bulan - 1;
        let prevTahun = tahun;
        if (prevBulan < 1) {
            prevBulan = 12;
            prevTahun = tahun - 1;
        }

        // Ambil budget bulan sebelumnya
        const prevBudgets = await db.budget
            .where({ bulan: prevBulan, tahun: prevTahun })
            .toArray();

        if (prevBudgets.length === 0) {
            return { success: false, error: "Tidak ada budget di bulan sebelumnya" };
        }

        const now = new Date();
        let created = 0;

        for (const pb of prevBudgets) {
            // Cek apakah sudah ada
            const existing = await db.budget
                .where({ bulan, tahun })
                .filter(b => b.kategori === pb.kategori)
                .first();

            if (!existing) {
                await db.budget.add({
                    id: crypto.randomUUID(),
                    kategori: pb.kategori,
                    bulan,
                    tahun,
                    nominal: pb.nominal,
                    createdAt: now,
                    updatedAt: now
                });
                created++;
            }
        }

        return { success: true, copied: created };
    } catch (error: any) {
        return { success: false, error: "Gagal menyalin budget" };
    }
}

// Dapatkan kategori yang sudah pernah digunakan
export async function getAvailableCategories() {
    try {
        // Ambil dari akun expense
        const expenseAccounts = await db.akun
            .where("tipe").equals("EXPENSE")
            .toArray();

        // Extract kategori dari nama akun "[EXPENSE] Kategori"
        const categories = expenseAccounts
            .map(a => a.nama.replace("[EXPENSE] ", ""))
            .filter(k => k.length > 0)
            .sort();

        // Deduplicate
        return { success: true, data: Array.from(new Set(categories)) };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function getOverBudgetCategories(bulan?: number, tahun?: number) {
    const now = new Date();
    const b = bulan || now.getMonth() + 1;
    const t = tahun || now.getFullYear();

    const result = await getBudgetWithRealization(b, t);
    if (!result.success || !result.data) {
        return { success: false, data: [] };
    }

    // Get budgets that are over 80% used (WARNING) or over 100% (DANGER/CRITICAL)
    const allBudgets = [
        ...result.data.budgets,
        ...result.data.unbudgeted
    ];

    const alerts = allBudgets
        .filter(budget => {
            const percentage = budget.nominal > 0
                ? (budget.realisasi / budget.nominal) * 100
                : (budget.realisasi > 0 ? 100 : 0);
            return percentage >= 80; // Show if 80%+ used
        })
        .map(budget => {
            const limit = budget.nominal || 0;
            const used = budget.realisasi || 0;
            const percentage = limit > 0 ? (used / limit) * 100 : (used > 0 ? 100 : 0);
            const overAmount = Math.max(0, used - limit);

            let status = "SAFE";
            if (percentage >= 120) status = "CRITICAL";
            else if (percentage >= 100) status = "DANGER";
            else if (percentage >= 80) status = "WARNING";

            return {
                kategori: budget.kategori,
                limit,
                used,
                percentage,
                overAmount,
                status
            };
        })
        .sort((a, b) => b.percentage - a.percentage); // Highest percentage first

    return { success: true, data: alerts };
}
