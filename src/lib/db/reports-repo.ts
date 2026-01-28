import { db } from "./app-db";
import { Money } from "@/lib/money";

interface RingkasanBulanan {
    bulan: number;
    tahun: number;
    bulanNama: string;
    totalPemasukan: number;
    totalPengeluaran: number;
    selisih: number;
    pengeluaranPerKategori: { kategori: string; total: number; persentase: number }[];
    pemasukanPerKategori: { kategori: string; total: number; persentase: number }[];
    transaksiTerbesar: { deskripsi: string; nominal: number; kategori: string; tanggal: Date }[];
    rataRataHarian: number;
    jumlahTransaksi: number;
}

const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export async function getRingkasanBulanan(bulan: number, tahun: number): Promise<RingkasanBulanan> {
    try {
        const startOfMonth = new Date(tahun, bulan - 1, 1);
        const endOfMonth = new Date(tahun, bulan, 0, 23, 59, 59, 999);
        const daysInMonth = new Date(tahun, bulan, 0).getDate();

        // Ambil semua transaksi bulan ini
        // For performance, we can filter by date range index if available [tanggal] or [tanggal+id]
        const transaksi = await db.transaksi
            .where("tanggal")
            .between(startOfMonth, endOfMonth, true, true)
            .toArray();

        // Get account map for type checking
        const akunList = await db.akun.toArray();
        const akunMap = new Map(akunList.map(a => [a.id, a]));

        // Hitung pemasukan dan pengeluaran
        let totalPemasukan = 0;
        let totalPengeluaran = 0;
        const pengeluaranMap = new Map<string, number>();
        const pemasukanMap = new Map<string, number>();

        const transaksiEnriched = [];

        for (const tx of transaksi) {
            const debitAkun = akunMap.get(tx.debitAkunId);
            const kreditAkun = akunMap.get(tx.kreditAkunId);

            const isExpense = debitAkun?.tipe === "EXPENSE";
            const isIncome = kreditAkun?.tipe === "INCOME";
            const nominal = Money.toFloat(tx.nominalInt);

            if (isExpense) {
                totalPengeluaran += nominal;
                const existing = pengeluaranMap.get(tx.kategori) || 0;
                pengeluaranMap.set(tx.kategori, existing + nominal);
            } else if (isIncome) {
                totalPemasukan += nominal;
                const existing = pemasukanMap.get(tx.kategori) || 0;
                pemasukanMap.set(tx.kategori, existing + nominal);
            }

            transaksiEnriched.push({
                ...tx,
                debitAkun,
                nominalFloat: nominal
            });
        }

        // Convert to array with percentage
        const pengeluaranPerKategori = Array.from(pengeluaranMap.entries())
            .map(([kategori, total]) => ({
                kategori,
                total,
                persentase: totalPengeluaran > 0 ? (total / totalPengeluaran) * 100 : 0
            }))
            .sort((a, b) => b.total - a.total);

        const pemasukanPerKategori = Array.from(pemasukanMap.entries())
            .map(([kategori, total]) => ({
                kategori,
                total,
                persentase: totalPemasukan > 0 ? (total / totalPemasukan) * 100 : 0
            }))
            .sort((a, b) => b.total - a.total);

        // Transaksi terbesar (pengeluaran) -> debitAkun.tipe === "EXPENSE"
        // We need to sort descending by nominal
        const pengeluaranOnly = transaksiEnriched.filter(tx => tx.debitAkun?.tipe === "EXPENSE");
        pengeluaranOnly.sort((a, b) => b.nominalInt - a.nominalInt);

        const transaksiTerbesar = pengeluaranOnly
            .slice(0, 5)
            .map(tx => ({
                deskripsi: tx.deskripsi,
                nominal: Money.toFloat(tx.nominalInt),
                kategori: tx.kategori,
                tanggal: tx.tanggal
            }));

        return {
            bulan,
            tahun,
            bulanNama: NAMA_BULAN[bulan - 1],
            totalPemasukan,
            totalPengeluaran,
            selisih: totalPemasukan - totalPengeluaran,
            pengeluaranPerKategori,
            pemasukanPerKategori,
            transaksiTerbesar,
            rataRataHarian: totalPengeluaran / daysInMonth,
            jumlahTransaksi: transaksi.length
        };
    } catch (error: any) {
        console.error("getRingkasanBulanan error", error);
        return {
            bulan,
            tahun,
            bulanNama: NAMA_BULAN[bulan - 1] || "",
            totalPemasukan: 0,
            totalPengeluaran: 0,
            selisih: 0,
            pengeluaranPerKategori: [],
            pemasukanPerKategori: [],
            transaksiTerbesar: [],
            rataRataHarian: 0,
            jumlahTransaksi: 0
        };
    }
}

export async function getAvailableMonths(): Promise<{ bulan: number; tahun: number }[]> {
    try {
        // We need all truncated dates (YYYY-MM)
        // Full scan of 'tanggal' index is cheapest way using keys
        const keys = await db.transaksi.orderBy("tanggal").reverse().primaryKeys();

        // However, we need the actual Date object to extract month/year.
        // Or we can query index keys? id is primary key. 'tanggal' is index.
        // db.transaksi.orderBy("tanggal").uniqueKeys() ? Dexie doesn't have uniqueKeys easily for non-unique index.

        const transactions = await db.transaksi.orderBy("tanggal").reverse().toArray();
        // Since we might have many transactions, this could be slow.
        // Optimization: Use `each` to iterate and break if we have enough? No we need all available MONTHS.
        // Optimization: Use separate 'summaryMonth' table which is already aggregated?
        // Yes! `db.summaryMonth` has `month` field (YYYY-MM).

        const summaries = await db.summaryMonth.orderBy("month").reverse().toArray();
        if (summaries.length > 0) {
            return summaries.map(s => {
                const [y, m] = s.month.split("-").map(Number);
                return { bulan: m, tahun: y };
            });
        }

        // Fallback if summaryMonth is empty (migration scenario)
        const monthSet = new Set<string>();
        const result: { bulan: number; tahun: number }[] = [];

        for (const tx of transactions) {
            const key = `${tx.tanggal.getFullYear()}-${tx.tanggal.getMonth() + 1}`;
            if (!monthSet.has(key)) {
                monthSet.add(key);
                result.push({
                    bulan: tx.tanggal.getMonth() + 1,
                    tahun: tx.tanggal.getFullYear()
                });
            }
        }

        // Add current month if not exists
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
        if (!monthSet.has(currentKey)) {
            result.unshift({
                bulan: now.getMonth() + 1,
                tahun: now.getFullYear()
            });
        }

        return result;

    } catch (error) {
        console.error("getAvailableMonths error", error);
        return [{ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() }];
    }
}
