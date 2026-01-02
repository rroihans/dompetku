"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"

export interface CicilanData {
    namaProduk: string
    totalPokok: number
    tenor: number
    nominalPerBulan: number
    biayaAdmin?: number
    bungaPersen?: number
    tanggalJatuhTempo: number  // 1-31
    akunKreditId: string  // Akun kartu kredit
}

// Buat cicilan baru
export async function createCicilan(data: CicilanData) {
    try {
        // Validasi
        if (data.totalPokok <= 0 || data.tenor <= 0 || data.nominalPerBulan <= 0) {
            return { success: false, error: "Nominal dan tenor harus lebih dari 0" }
        }

        if (data.tanggalJatuhTempo < 1 || data.tanggalJatuhTempo > 31) {
            return { success: false, error: "Tanggal jatuh tempo harus antara 1-31" }
        }

        // Cari atau buat akun pengeluaran cicilan
        const namaAkunDebit = "[EXPENSE] Cicilan"
        let akunDebit = await prisma.akun.findFirst({
            where: { nama: namaAkunDebit }
        })

        if (!akunDebit) {
            akunDebit = await prisma.akun.create({
                data: {
                    nama: namaAkunDebit,
                    tipe: "EXPENSE",
                    saldoAwal: 0,
                    saldoSekarang: 0,
                }
            })
        }

        const cicilan = await prisma.rencanaCicilan.create({
            data: {
                namaProduk: data.namaProduk,
                totalPokok: data.totalPokok,
                tenor: data.tenor,
                cicilanKe: 1,
                nominalPerBulan: data.nominalPerBulan,
                biayaAdmin: data.biayaAdmin || 0,
                bungaPersen: data.bungaPersen || 0,
                tanggalJatuhTempo: data.tanggalJatuhTempo,
                status: "AKTIF",
                akunKreditId: data.akunKreditId,
                akunDebitId: akunDebit.id,
            },
        })

        await logSistem("INFO", "CICILAN", `Rencana cicilan dibuat: ${cicilan.namaProduk}`)
        revalidatePath("/cicilan")
        revalidatePath("/")

        return { success: true, data: cicilan }
    } catch (error) {
        await logSistem("ERROR", "CICILAN", "Gagal membuat rencana cicilan", (error as Error).stack)
        return { success: false, error: "Gagal membuat rencana cicilan" }
    }
}

// Ambil semua cicilan
export async function getCicilan() {
    try {
        const cicilan = await prisma.rencanaCicilan.findMany({
            orderBy: [
                { status: "asc" },  // AKTIF dulu
                { createdAt: "desc" }
            ],
        })
        return { success: true, data: cicilan }
    } catch (error) {
        await logSistem("ERROR", "CICILAN", "Gagal mengambil data cicilan", (error as Error).stack)
        return { success: false, data: [], error: "Gagal mengambil data cicilan" }
    }
}

// Ambil cicilan by ID
export async function getCicilanById(id: string) {
    try {
        return await prisma.rencanaCicilan.findUnique({
            where: { id },
            include: {
                transaksi: {
                    orderBy: { tanggal: "desc" }
                }
            }
        })
    } catch (error) {
        await logSistem("ERROR", "CICILAN", "Gagal mengambil detail cicilan", (error as Error).stack)
        return null
    }
}

// Bayar cicilan (eksekusi pembayaran bulanan)
export async function bayarCicilan(id: string) {
    try {
        const cicilan = await prisma.rencanaCicilan.findUnique({
            where: { id }
        })

        if (!cicilan) {
            return { success: false, error: "Cicilan tidak ditemukan" }
        }

        if (cicilan.status !== "AKTIF") {
            return { success: false, error: "Cicilan sudah lunas atau dibalikkan" }
        }

        if (cicilan.cicilanKe > cicilan.tenor) {
            return { success: false, error: "Cicilan sudah melebihi tenor" }
        }

        await prisma.$transaction(async (tx: any) => {
            // Buat transaksi pembayaran
            const now = new Date()
            await tx.transaksi.create({
                data: {
                    deskripsi: `Cicilan ${cicilan.namaProduk} (${cicilan.cicilanKe}/${cicilan.tenor})`,
                    nominal: cicilan.nominalPerBulan,
                    kategori: "Cicilan",
                    debitAkunId: cicilan.akunDebitId,
                    kreditAkunId: cicilan.akunKreditId,
                    tanggal: now,
                    rencanaCicilanId: cicilan.id,
                    catatan: `Pembayaran cicilan ke-${cicilan.cicilanKe} dari ${cicilan.tenor}`,
                }
            })

            // Update saldo akun
            await tx.akun.update({
                where: { id: cicilan.akunDebitId },
                data: { saldoSekarang: { increment: cicilan.nominalPerBulan } }
            })
            await tx.akun.update({
                where: { id: cicilan.akunKreditId },
                data: { saldoSekarang: { decrement: cicilan.nominalPerBulan } }
            })

            // Update progress cicilan
            const newCicilanKe = cicilan.cicilanKe + 1
            const isLunas = newCicilanKe > cicilan.tenor

            await tx.rencanaCicilan.update({
                where: { id },
                data: {
                    cicilanKe: newCicilanKe,
                    status: isLunas ? "LUNAS" : "AKTIF"
                }
            })
        })

        await logSistem("INFO", "CICILAN", `Pembayaran cicilan: ${cicilan.namaProduk} (${cicilan.cicilanKe}/${cicilan.tenor})`)
        revalidatePath("/cicilan")
        revalidatePath("/transaksi")
        revalidatePath("/akun")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        await logSistem("ERROR", "CICILAN", "Gagal membayar cicilan", (error as Error).stack)
        return { success: false, error: "Gagal membayar cicilan" }
    }
}

// Pelunasan dipercepat (bayar sisa sekaligus)
export async function pelunasanDipercepat(id: string) {
    try {
        const cicilan = await prisma.rencanaCicilan.findUnique({
            where: { id }
        })

        if (!cicilan) {
            return { success: false, error: "Cicilan tidak ditemukan" }
        }

        if (cicilan.status !== "AKTIF") {
            return { success: false, error: "Cicilan sudah lunas atau dibalikkan" }
        }

        // Hitung sisa yang harus dibayar
        const sisaTenor = cicilan.tenor - cicilan.cicilanKe + 1
        const sisaNominal = sisaTenor * cicilan.nominalPerBulan

        await prisma.$transaction(async (tx: any) => {
            // Buat transaksi pelunasan
            const now = new Date()
            await tx.transaksi.create({
                data: {
                    deskripsi: `Pelunasan ${cicilan.namaProduk} (sisa ${sisaTenor} bulan)`,
                    nominal: sisaNominal,
                    kategori: "Cicilan",
                    debitAkunId: cicilan.akunDebitId,
                    kreditAkunId: cicilan.akunKreditId,
                    tanggal: now,
                    rencanaCicilanId: cicilan.id,
                    catatan: `Pelunasan dipercepat - sisa ${sisaTenor} dari ${cicilan.tenor} bulan`,
                }
            })

            // Update saldo akun
            await tx.akun.update({
                where: { id: cicilan.akunDebitId },
                data: { saldoSekarang: { increment: sisaNominal } }
            })
            await tx.akun.update({
                where: { id: cicilan.akunKreditId },
                data: { saldoSekarang: { decrement: sisaNominal } }
            })

            // Update status cicilan
            await tx.rencanaCicilan.update({
                where: { id },
                data: {
                    cicilanKe: cicilan.tenor + 1,
                    status: "LUNAS"
                }
            })
        })

        await logSistem("INFO", "CICILAN", `Pelunasan dipercepat: ${cicilan.namaProduk}`)
        revalidatePath("/cicilan")
        revalidatePath("/transaksi")
        revalidatePath("/akun")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        await logSistem("ERROR", "CICILAN", "Gagal pelunasan dipercepat", (error as Error).stack)
        return { success: false, error: "Gagal pelunasan dipercepat" }
    }
}

// Update cicilan (hanya untuk field tertentu)
export async function updateCicilan(id: string, data: {
    namaProduk?: string
    tanggalJatuhTempo?: number
    biayaAdmin?: number
    bungaPersen?: number
}) {
    try {
        const cicilan = await prisma.rencanaCicilan.update({
            where: { id },
            data,
        })

        await logSistem("INFO", "CICILAN", `Cicilan diperbarui: ${cicilan.namaProduk}`)
        revalidatePath("/cicilan")

        return { success: true, data: cicilan }
    } catch (error) {
        await logSistem("ERROR", "CICILAN", "Gagal memperbarui cicilan", (error as Error).stack)
        return { success: false, error: "Gagal memperbarui cicilan" }
    }
}

// Hapus cicilan (hanya jika belum ada transaksi)
export async function deleteCicilan(id: string) {
    try {
        // Cek apakah ada transaksi terkait
        const transaksiCount = await prisma.transaksi.count({
            where: { rencanaCicilanId: id }
        })

        if (transaksiCount > 0) {
            return {
                success: false,
                error: `Tidak dapat menghapus. Sudah ada ${transaksiCount} pembayaran terkait.`
            }
        }

        const cicilan = await prisma.rencanaCicilan.delete({
            where: { id },
        })

        await logSistem("INFO", "CICILAN", `Cicilan dihapus: ${cicilan.namaProduk}`)
        revalidatePath("/cicilan")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        await logSistem("ERROR", "CICILAN", "Gagal menghapus cicilan", (error as Error).stack)
        return { success: false, error: "Gagal menghapus cicilan" }
    }
}

// Dapatkan statistik cicilan untuk dashboard
export async function getCicilanStats() {
    try {
        const cicilanAktif = await prisma.rencanaCicilan.findMany({
            where: { status: "AKTIF" }
        })

        // Total hutang = sisa cicilan yang belum dibayar
        let totalHutang = 0
        let tagihanBulanIni = 0

        for (const c of cicilanAktif) {
            const sisaTenor = c.tenor - c.cicilanKe + 1
            totalHutang += sisaTenor * c.nominalPerBulan
            tagihanBulanIni += c.nominalPerBulan
        }

        // Ambil total limit kartu kredit
        const kartuKredit = await prisma.akun.findMany({
            where: { tipe: "CREDIT_CARD" }
        })
        const totalLimit = kartuKredit.reduce((sum, k) => sum + (k.limitKredit || 0), 0)
        const rasioHutang = totalLimit > 0 ? (totalHutang / totalLimit) * 100 : 0

        return {
            success: true,
            data: {
                totalHutang,
                tagihanBulanIni,
                jumlahCicilanAktif: cicilanAktif.length,
                rasioHutang: Math.round(rasioHutang)
            }
        }
    } catch (error) {
        await logSistem("ERROR", "CICILAN", "Gagal mengambil statistik cicilan", (error as Error).stack)
        return {
            success: false,
            data: { totalHutang: 0, tagihanBulanIni: 0, jumlahCicilanAktif: 0, rasioHutang: 0 }
        }
    }
}
