"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"

export async function seedInitialData() {
    try {
        const accountCount = await prisma.akun.count()
        if (accountCount > 0) return { success: true, message: "Data sudah ada" }

        await prisma.$transaction([
            // Akun Aset / Sumber Dana
            prisma.akun.create({ data: { nama: "BCA Tahapan", tipe: "BANK", saldoAwal: 0, saldoSekarang: 0, warna: "#005696" } }),
            prisma.akun.create({ data: { nama: "Gopay", tipe: "E_WALLET", saldoAwal: 0, saldoSekarang: 0, warna: "#00AA13" } }),
            prisma.akun.create({ data: { nama: "Tunai", tipe: "CASH", saldoAwal: 0, saldoSekarang: 0, warna: "#4CAF50" } }),

            // Akun PENGELUARAN (Kategori)
            prisma.akun.create({ data: { nama: "Beban Makan & Minum", tipe: "PENGELUARAN", saldoAwal: 0, saldoSekarang: 0 } }),
            prisma.akun.create({ data: { nama: "Beban Transportasi", tipe: "PENGELUARAN", saldoAwal: 0, saldoSekarang: 0 } }),
            prisma.akun.create({ data: { nama: "Beban Listrik & Air", tipe: "PENGELUARAN", saldoAwal: 0, saldoSekarang: 0 } }),
            prisma.akun.create({ data: { nama: "Beban Cicilan", tipe: "PENGELUARAN", saldoAwal: 0, saldoSekarang: 0 } }),

            // Akun PENDAPATAN
            prisma.akun.create({ data: { nama: "Pendapatan Gaji", tipe: "PENDAPATAN", saldoAwal: 0, saldoSekarang: 0 } }),
            prisma.akun.create({ data: { nama: "Pendapatan Bonus", tipe: "PENDAPATAN", saldoAwal: 0, saldoSekarang: 0 } }),
        ])

        await logSistem("INFO", "SYSTEM", "Data inisial (PSAK) berhasil di-seed")
        return { success: true, message: "Data berhasil di-seed" }
    } catch (error) {
        await logSistem("ERROR", "SYSTEM", "Gagal melakukan seeding data", (error as Error).stack)
        return { success: false, error: "Gagal seeding" }
    }
}
