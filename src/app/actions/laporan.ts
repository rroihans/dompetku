"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"

const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

interface RingkasanBulanan {
    bulan: number
    tahun: number
    bulanNama: string
    totalPemasukan: number
    totalPengeluaran: number
    selisih: number
    pengeluaranPerKategori: { kategori: string; total: number; persentase: number }[]
    pemasukanPerKategori: { kategori: string; total: number; persentase: number }[]
    transaksiTerbesar: { deskripsi: string; nominal: number; kategori: string; tanggal: Date }[]
    rataRataHarian: number
    jumlahTransaksi: number
}

export async function getRingkasanBulanan(bulan: number, tahun: number): Promise<RingkasanBulanan> {
    try {
        const namaBulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ]

        const startOfMonth = new Date(tahun, bulan - 1, 1)
        const endOfMonth = new Date(tahun, bulan, 0, 23, 59, 59)
        const daysInMonth = new Date(tahun, bulan, 0).getDate()

        // Ambil semua transaksi bulan ini
        const transaksi = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: startOfMonth, lte: endOfMonth }
            },
            include: {
                debitAkun: true,
                kreditAkun: true,
            },
            orderBy: { nominal: 'desc' }
        })

        // Hitung pemasukan dan pengeluaran
        let totalPemasukan = 0
        let totalPengeluaran = 0
        const pengeluaranMap = new Map<string, number>()
        const pemasukanMap = new Map<string, number>()

        for (const tx of transaksi) {
            const isExpense = tx.debitAkun?.tipe === "EXPENSE"
            const isIncome = tx.kreditAkun?.tipe === "INCOME"

            if (isExpense) {
                totalPengeluaran += tx.nominal
                const existing = pengeluaranMap.get(tx.kategori) || 0
                pengeluaranMap.set(tx.kategori, existing + tx.nominal)
            } else if (isIncome) {
                totalPemasukan += tx.nominal
                const existing = pemasukanMap.get(tx.kategori) || 0
                pemasukanMap.set(tx.kategori, existing + tx.nominal)
            }
        }

        // Convert to array with percentage
        const pengeluaranPerKategori = Array.from(pengeluaranMap.entries())
            .map(([kategori, total]) => ({
                kategori,
                total,
                persentase: totalPengeluaran > 0 ? (total / totalPengeluaran) * 100 : 0
            }))
            .sort((a, b) => b.total - a.total)

        const pemasukanPerKategori = Array.from(pemasukanMap.entries())
            .map(([kategori, total]) => ({
                kategori,
                total,
                persentase: totalPemasukan > 0 ? (total / totalPemasukan) * 100 : 0
            }))
            .sort((a, b) => b.total - a.total)

        // Transaksi terbesar (pengeluaran)
        const transaksiTerbesar = transaksi
            .filter(tx => tx.debitAkun?.tipe === "EXPENSE")
            .slice(0, 5)
            .map(tx => ({
                deskripsi: tx.deskripsi,
                nominal: tx.nominal,
                kategori: tx.kategori,
                tanggal: tx.tanggal
            }))

        return {
            bulan,
            tahun,
            bulanNama: namaBulan[bulan - 1],
            totalPemasukan,
            totalPengeluaran,
            selisih: totalPemasukan - totalPengeluaran,
            pengeluaranPerKategori,
            pemasukanPerKategori,
            transaksiTerbesar,
            rataRataHarian: totalPengeluaran / daysInMonth,
            jumlahTransaksi: transaksi.length
        }
    } catch (error) {
        await logSistem("ERROR", "LAPORAN", "Gagal mengambil ringkasan bulanan", (error as Error).stack)
        throw new Error("Gagal mengambil ringkasan bulanan")
    }
}

export async function getAvailableMonths(): Promise<{ bulan: number; tahun: number }[]> {
    try {
        const transaksi = await prisma.transaksi.findMany({
            select: { tanggal: true },
            orderBy: { tanggal: 'desc' }
        })

        const monthSet = new Set<string>()
        const result: { bulan: number; tahun: number }[] = []

        for (const tx of transaksi) {
            const key = `${tx.tanggal.getFullYear()}-${tx.tanggal.getMonth() + 1}`
            if (!monthSet.has(key)) {
                monthSet.add(key)
                result.push({
                    bulan: tx.tanggal.getMonth() + 1,
                    tahun: tx.tanggal.getFullYear()
                })
            }
        }

        // Tambahkan bulan ini jika belum ada
        const now = new Date()
        const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`
        if (!monthSet.has(currentKey)) {
            result.unshift({
                bulan: now.getMonth() + 1,
                tahun: now.getFullYear()
            })
        }

        return result
    } catch (error) {
        return [{ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() }]
    }
}
