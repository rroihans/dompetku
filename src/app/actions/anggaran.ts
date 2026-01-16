"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { Money } from "@/lib/money"

export interface BudgetData {
    kategori: string
    bulan: number  // 1-12
    tahun: number  // 2024, 2025, etc
    nominal: number
}

// Buat atau update budget
export async function upsertBudget(data: BudgetData) {
    try {
        // Validasi
        if (data.nominal <= 0) {
            return { success: false, error: "Nominal harus lebih dari 0" }
        }

        if (data.bulan < 1 || data.bulan > 12) {
            return { success: false, error: "Bulan harus antara 1-12" }
        }

        // Cari existing budget
        const existing = await prisma.budget.findFirst({
            where: {
                kategori: data.kategori,
                bulan: data.bulan,
                tahun: data.tahun,
            }
        })

        let budget
        if (existing) {
            // Update
            budget = await prisma.budget.update({
                where: { id: existing.id },
                data: { nominal: data.nominal }
            })
            await logSistem("INFO", "BUDGET", `Budget diperbarui: ${data.kategori} ${data.bulan}/${data.tahun}`)
        } else {
            // Create
            budget = await prisma.budget.create({
                data: {
                    kategori: data.kategori,
                    bulan: data.bulan,
                    tahun: data.tahun,
                    nominal: data.nominal,
                }
            })
            await logSistem("INFO", "BUDGET", `Budget dibuat: ${data.kategori} ${data.bulan}/${data.tahun}`)
        }

        revalidatePath("/anggaran")
        revalidatePath("/")

        return { success: true, data: budget }
    } catch (error) {
        await logSistem("ERROR", "BUDGET", "Gagal menyimpan budget", (error as Error).stack)
        return { success: false, error: "Gagal menyimpan budget" }
    }
}

// Ambil budget untuk bulan tertentu
export async function getBudgetByMonth(bulan: number, tahun: number) {
    try {
        const budgets = await prisma.budget.findMany({
            where: { bulan, tahun },
            orderBy: { kategori: "asc" }
        })
        return { success: true, data: budgets }
    } catch (error) {
        await logSistem("ERROR", "BUDGET", "Gagal mengambil budget", (error as Error).stack)
        return { success: false, data: [], error: "Gagal mengambil budget" }
    }
}

// Ambil budget dengan realisasi pengeluaran
export async function getBudgetWithRealization(bulan: number, tahun: number) {
    try {
        // Ambil semua budget untuk bulan ini
        const budgets = await prisma.budget.findMany({
            where: { bulan, tahun },
            orderBy: { kategori: "asc" }
        })

        // Ambil pengeluaran per kategori untuk bulan ini
        const startDate = new Date(tahun, bulan - 1, 1)
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

        const [transaksi, recurringList] = await Promise.all([
            prisma.transaksi.findMany({
                where: {
                    tanggal: { gte: startDate, lte: endDate },
                    debitAkun: { tipe: "EXPENSE" }
                }
            }),
            prisma.recurringTransaction.findMany({
                where: {
                    aktif: true,
                    tipeTransaksi: "KELUAR",
                    OR: [
                        { tanggalSelesai: null },
                        { tanggalSelesai: { gte: startDate } }
                    ]
                }
            })
        ])

        // Group by kategori (Realisasi)
        const realisasiMap = new Map<string, number>()
        for (const tx of transaksi) {
            const current = realisasiMap.get(tx.kategori) || 0
            const nominal = Money.toFloat(Number(tx.nominal))
            realisasiMap.set(tx.kategori, current + nominal)
        }

        // Group by kategori (Proyeksi Recurring)
        const proyeksiMap = new Map<string, number>()
        for (const r of recurringList) {
            // Cek apakah sudah dieksekusi bulan ini
            const isExecuted = r.terakhirDieksekusi && 
                new Date(r.terakhirDieksekusi) >= startDate && 
                new Date(r.terakhirDieksekusi) <= endDate

            if (!isExecuted) {
                const current = proyeksiMap.get(r.kategori) || 0
                proyeksiMap.set(r.kategori, current + r.nominal)
            }
        }

        // Hitung sisa hari
        const now = new Date()
        const isCurrentMonth = now.getMonth() + 1 === bulan && now.getFullYear() === tahun
        let sisaHari = 0
        if (isCurrentMonth) {
            const lastDay = new Date(tahun, bulan, 0).getDate()
            sisaHari = lastDay - now.getDate() + 1
        } else {
            const targetMonth = new Date(tahun, bulan - 1, 1)
            if (targetMonth > now) {
                sisaHari = new Date(tahun, bulan, 0).getDate()
            }
        }

        // Gabungkan budget dengan realisasi dan proyeksi
        const result = budgets.map(b => {
            const realisasi = realisasiMap.get(b.kategori) || 0
            const proyeksi = proyeksiMap.get(b.kategori) || 0
            const totalPrediksi = realisasi + proyeksi
            const sisa = b.nominal - totalPrediksi
            return {
                ...b,
                realisasi,
                proyeksi,
                persentase: Math.round((realisasi / b.nominal) * 100),
                persentaseProyeksi: Math.round((totalPrediksi / b.nominal) * 100),
                sisa,
                saranHarian: sisa > 0 && sisaHari > 0 ? Math.floor(sisa / sisaHari) : 0,
            }
        })

        // Tambahkan kategori yang ada pengeluaran tapi tidak ada budget
        const budgetKategori = new Set(budgets.map(b => b.kategori))
        const unbudgetedCategories: any[] = []
        
        // Merge realisasi and proyeksi categories
        const allCategories = new Set([...realisasiMap.keys(), ...proyeksiMap.keys()])
        
        allCategories.forEach(kategori => {
            if (!budgetKategori.has(kategori)) {
                const realisasi = realisasiMap.get(kategori) || 0
                const proyeksi = proyeksiMap.get(kategori) || 0
                const total = realisasi + proyeksi
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
                })
            }
        })

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
        }
    } catch (error) {
        await logSistem("ERROR", "BUDGET", "Gagal mengambil budget dengan realisasi", (error as Error).stack)
        return {
            success: false,
            data: { budgets: [], unbudgeted: [], totalBudget: 0, totalRealisasi: 0 }
        }
    }
}

// Hapus budget
export async function deleteBudget(id: string) {
    try {
        const budget = await prisma.budget.delete({
            where: { id }
        })

        await logSistem("INFO", "BUDGET", `Budget dihapus: ${budget.kategori}`)
        revalidatePath("/anggaran")

        return { success: true }
    } catch (error) {
        await logSistem("ERROR", "BUDGET", "Gagal menghapus budget", (error as Error).stack)
        return { success: false, error: "Gagal menghapus budget" }
    }
}

// Salin budget dari bulan sebelumnya
export async function copyBudgetFromPreviousMonth(bulan: number, tahun: number) {
    try {
        // Hitung bulan sebelumnya
        let prevBulan = bulan - 1
        let prevTahun = tahun
        if (prevBulan < 1) {
            prevBulan = 12
            prevTahun = tahun - 1
        }

        // Ambil budget bulan sebelumnya
        const prevBudgets = await prisma.budget.findMany({
            where: { bulan: prevBulan, tahun: prevTahun }
        })

        if (prevBudgets.length === 0) {
            return { success: false, error: "Tidak ada budget di bulan sebelumnya" }
        }

        // Salin ke bulan ini
        let created = 0
        for (const pb of prevBudgets) {
            // Cek apakah sudah ada
            const existing = await prisma.budget.findFirst({
                where: { kategori: pb.kategori, bulan, tahun }
            })

            if (!existing) {
                await prisma.budget.create({
                    data: {
                        kategori: pb.kategori,
                        bulan,
                        tahun,
                        nominal: pb.nominal,
                    }
                })
                created++
            }
        }

        await logSistem("INFO", "BUDGET", `Budget disalin dari ${prevBulan}/${prevTahun}: ${created} kategori`)
        revalidatePath("/anggaran")

        return { success: true, copied: created }
    } catch (error) {
        await logSistem("ERROR", "BUDGET", "Gagal menyalin budget", (error as Error).stack)
        return { success: false, error: "Gagal menyalin budget" }
    }
}

// Dapatkan kategori yang sudah pernah digunakan
export async function getAvailableCategories() {
    try {
        // Ambil dari akun expense
        const expenseAccounts = await prisma.akun.findMany({
            where: { tipe: "EXPENSE" },
            select: { nama: true }
        })

        // Extract kategori dari nama akun "[EXPENSE] Kategori"
        const categories = expenseAccounts
            .map(a => a.nama.replace("[EXPENSE] ", ""))
            .filter(k => k.length > 0)
            .sort()

        return { success: true, data: categories }
    } catch (error) {
        return { success: false, data: [] }
    }
}

// Dapatkan bulan yang tersedia
export async function getAvailableBudgetMonths() {
    try {
        const budgets = await prisma.budget.findMany({
            select: { bulan: true, tahun: true },
            distinct: ["bulan", "tahun"],
            orderBy: [{ tahun: "desc" }, { bulan: "desc" }]
        })

        return { success: true, data: budgets }
    } catch (error) {
        return { success: false, data: [] }
    }
}
