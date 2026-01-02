"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"

interface TransferData {
    dariAkunId: string
    keAkunId: string
    nominal: number
    catatan?: string
    tanggal?: Date
    idempotencyKey?: string
}

export async function createTransfer(data: TransferData) {
    try {
        // Validasi
        if (data.dariAkunId === data.keAkunId) {
            return { success: false, error: "Akun asal dan tujuan tidak boleh sama" }
        }

        if (data.nominal <= 0) {
            return { success: false, error: "Nominal harus lebih dari 0" }
        }

        // Cek idempotency key jika ada
        if (data.idempotencyKey) {
            const existing = await prisma.transaksi.findUnique({
                where: { idempotencyKey: data.idempotencyKey }
            })
            if (existing) return { success: true, data: existing, duplicated: true }
        }

        // Jalankan transaksi database (Atomic)
        const result = await prisma.$transaction(async (tx: any) => {
            // Ambil data akun
            const dariAkun = await tx.akun.findUnique({
                where: { id: data.dariAkunId }
            })
            const keAkun = await tx.akun.findUnique({
                where: { id: data.keAkunId }
            })

            if (!dariAkun || !keAkun) {
                throw new Error("Akun tidak ditemukan")
            }

            // Buat deskripsi otomatis
            const deskripsi = data.catatan || `Transfer ke ${keAkun.nama}`

            // Buat record transaksi
            // Transfer: Debit = akun tujuan (bertambah), Kredit = akun asal (berkurang)
            const transaksi = await tx.transaksi.create({
                data: {
                    deskripsi,
                    nominal: data.nominal,
                    kategori: "Transfer",
                    debitAkunId: data.keAkunId,    // Tujuan (bertambah)
                    kreditAkunId: data.dariAkunId, // Asal (berkurang)
                    tanggal: data.tanggal || new Date(),
                    catatan: `Transfer dari ${dariAkun.nama} ke ${keAkun.nama}`,
                    idempotencyKey: data.idempotencyKey,
                },
            })

            // Update saldo akun tujuan (bertambah)
            await tx.akun.update({
                where: { id: data.keAkunId },
                data: { saldoSekarang: { increment: data.nominal } }
            })

            // Update saldo akun asal (berkurang)
            await tx.akun.update({
                where: { id: data.dariAkunId },
                data: { saldoSekarang: { decrement: data.nominal } }
            })

            return { transaksi, dariAkun, keAkun }
        })

        await logSistem(
            "INFO",
            "TRANSFER",
            `Transfer berhasil: ${result.dariAkun.nama} → ${result.keAkun.nama} (${data.nominal})`
        )

        revalidatePath("/")
        revalidatePath("/akun")
        revalidatePath("/transaksi")

        return { success: true, data: result.transaksi }
    } catch (error) {
        await logSistem("ERROR", "TRANSFER", "Gagal melakukan transfer", (error as Error).stack)
        return { success: false, error: (error as Error).message || "Gagal melakukan transfer" }
    }
}
