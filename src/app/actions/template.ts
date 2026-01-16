"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { Money } from "@/lib/money"

// ============================================
// ACCOUNT TEMPLATE (PERBANKAN)
// ============================================

export interface AccountTemplateData {
    id?: string
    nama: string
    tipeAkun: string
    biayaAdmin?: number | null
    bungaTier?: string | null
    polaTagihan: string
    tanggalTagihan?: number | null
    deskripsi?: string
    isActive?: boolean
}

export async function createAccountTemplate(data: AccountTemplateData) {
    try {
        const template = await prisma.accountTemplate.create({
            data: {
                nama: data.nama,
                tipeAkun: data.tipeAkun,
                biayaAdmin: data.biayaAdmin,
                bungaTier: data.bungaTier,
                polaTagihan: data.polaTagihan,
                tanggalTagihan: data.tanggalTagihan,
                deskripsi: data.deskripsi,
                isActive: data.isActive ?? true,
            }
        })

        await logSistem("INFO", "TEMPLATE", `Account Template dibuat: ${data.nama}`)
        revalidatePath("/template-akun")
        return { success: true, data: template }
    } catch (error) {
        await logSistem("ERROR", "TEMPLATE", "Gagal membuat account template", (error as Error).stack)
        return { success: false, error: "Gagal membuat account template" }
    }
}

export async function updateAccountTemplate(id: string, data: Partial<AccountTemplateData>) {
    try {
        const template = await prisma.accountTemplate.update({
            where: { id },
            data: {
                nama: data.nama,
                tipeAkun: data.tipeAkun,
                biayaAdmin: data.biayaAdmin,
                bungaTier: data.bungaTier,
                polaTagihan: data.polaTagihan,
                tanggalTagihan: data.tanggalTagihan,
                deskripsi: data.deskripsi,
                isActive: data.isActive,
            }
        })

        await logSistem("INFO", "TEMPLATE", `Account Template diupdate: ${template.nama}`)
        revalidatePath("/template-akun")
        revalidatePath("/akun")
        return { success: true, data: template }
    } catch (error) {
        await logSistem("ERROR", "TEMPLATE", "Gagal update account template", (error as Error).stack)
        return { success: false, error: "Gagal update account template" }
    }
}

export async function getAccountTemplates() {
    try {
        const templates = await prisma.accountTemplate.findMany({
            orderBy: { nama: "asc" }
        })
        return { success: true, data: templates }
    } catch (error) {
        return { success: false, data: [] }
    }
}

export async function getActiveAccountTemplates() {
    try {
        const templates = await prisma.accountTemplate.findMany({
            where: { isActive: true },
            orderBy: { nama: "asc" }
        })
        return { success: true, data: templates }
    } catch (error) {
        return { success: false, data: [] }
    }
}

export async function deleteAccountTemplate(id: string) {
    try {
        // Soft delete: set isActive to false if there are accounts using it
        const accountsCount = await prisma.akun.count({ where: { templateId: id } })
        
        if (accountsCount > 0) {
            await prisma.accountTemplate.update({
                where: { id },
                data: { isActive: false }
            })
            await logSistem("INFO", "TEMPLATE", `Account Template dinonaktifkan (digunakan oleh ${accountsCount} akun)`)
        } else {
            await prisma.accountTemplate.delete({ where: { id } })
            await logSistem("INFO", "TEMPLATE", "Account Template dihapus permanen")
        }

        revalidatePath("/template-akun")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Gagal menghapus account template" }
    }
}

export async function toggleAccountTemplateStatus(id: string) {
    try {
        const template = await prisma.accountTemplate.findUnique({ where: { id } })
        if (!template) return { success: false, error: "Template tidak ditemukan" }

        const updated = await prisma.accountTemplate.update({
            where: { id },
            data: { isActive: !template.isActive }
        })

        await logSistem("INFO", "TEMPLATE", `Status template ${updated.nama} diubah menjadi ${updated.isActive ? 'Aktif' : 'Non-Aktif'}`)
        revalidatePath("/template-akun")
        return { success: true, data: updated }
    } catch (error) {
        return { success: false, error: "Gagal mengubah status template" }
    }
}

// ============================================
// TEMPLATE TRANSAKSI
// ============================================

export interface TemplateData {
    nama: string
    deskripsi: string
    nominal: number
    kategori: string
    tipeTransaksi: "KELUAR" | "MASUK"
    akunId: string
    icon?: string
    warna?: string
}

// Buat template baru
export async function createTemplate(data: TemplateData) {
    try {
        const template = await prisma.templateTransaksi.create({
            data: {
                nama: data.nama,
                deskripsi: data.deskripsi,
                nominal: data.nominal,
                kategori: data.kategori,
                tipeTransaksi: data.tipeTransaksi,
                akunId: data.akunId,
                icon: data.icon,
                warna: data.warna,
            }
        })

        await logSistem("INFO", "TEMPLATE", `Template dibuat: ${data.nama}`)
        revalidatePath("/template")
        revalidatePath("/transaksi")

        return { success: true, data: template }
    } catch (error) {
        await logSistem("ERROR", "TEMPLATE", "Gagal membuat template", (error as Error).stack)
        return { success: false, error: "Gagal membuat template" }
    }
}

// Ambil semua template
export async function getTemplates() {
    try {
        const templates = await prisma.templateTransaksi.findMany({
            orderBy: [
                { usageCount: "desc" },
                { nama: "asc" }
            ]
        })
        return { success: true, data: templates }
    } catch (error) {
        return { success: false, data: [] }
    }
}

// Gunakan template untuk membuat transaksi
export async function useTemplate(templateId: string, tanggal?: Date) {
    try {
        const template = await prisma.templateTransaksi.findUnique({
            where: { id: templateId }
        })

        if (!template) {
            return { success: false, error: "Template tidak ditemukan" }
        }

        // Cari akun expense/income sesuai kategori
        const kategoriAkun = await prisma.akun.findFirst({
            where: {
                nama: template.tipeTransaksi === "KELUAR"
                    ? `[EXPENSE] ${template.kategori}`
                    : `[INCOME] ${template.kategori}`
            }
        })

        if (!kategoriAkun) {
            return { success: false, error: "Kategori tidak ditemukan" }
        }

        const nominalInt = BigInt(Money.fromFloat(template.nominal))

        // Buat transaksi berdasarkan template
        const transaksi = await prisma.transaksi.create({
            data: {
                tanggal: tanggal || new Date(),
                deskripsi: template.deskripsi,
                nominal: nominalInt, // BigInt
                kategori: template.kategori,
                debitAkunId: template.tipeTransaksi === "KELUAR" ? kategoriAkun.id : template.akunId,
                kreditAkunId: template.tipeTransaksi === "KELUAR" ? template.akunId : kategoriAkun.id,
                idempotencyKey: `template-${templateId}-${Date.now()}`,
            }
        })

        // Update saldo akun
        if (template.tipeTransaksi === "KELUAR") {
            await prisma.akun.update({
                where: { id: template.akunId },
                data: { saldoSekarang: { decrement: nominalInt } }
            })
        } else {
            await prisma.akun.update({
                where: { id: template.akunId },
                data: { saldoSekarang: { increment: nominalInt } }
            })
        }

        // Increment usage count
        await prisma.templateTransaksi.update({
            where: { id: templateId },
            data: { usageCount: { increment: 1 } }
        })

        await logSistem("INFO", "TEMPLATE", `Template digunakan: ${template.nama}`)
        revalidatePath("/")
        revalidatePath("/transaksi")

        const mappedResult = {
            ...transaksi,
            nominal: Money.toFloat(Number(transaksi.nominal))
        }

        return { success: true, data: mappedResult }
    } catch (error) {
        await logSistem("ERROR", "TEMPLATE", "Gagal menggunakan template", (error as Error).stack)
        return { success: false, error: "Gagal menggunakan template" }
    }
}

// Hapus template
export async function deleteTemplate(id: string) {
    try {
        await prisma.templateTransaksi.delete({
            where: { id }
        })

        await logSistem("INFO", "TEMPLATE", "Template dihapus")
        revalidatePath("/template")

        return { success: true }
    } catch (error) {
        return { success: false, error: "Gagal menghapus template" }
    }
}

// Simpan transaksi sebagai template
export async function saveAsTemplate(transaksiId: string, nama: string) {
    try {
        const transaksi = await prisma.transaksi.findUnique({
            where: { id: transaksiId },
            include: {
                debitAkun: true,
                kreditAkun: true
            }
        })

        if (!transaksi) {
            return { success: false, error: "Transaksi tidak ditemukan" }
        }

        // Tentukan tipe dan akun
        const isKeluar = transaksi.debitAkun.tipe === "EXPENSE"
        const akunId = isKeluar ? transaksi.kreditAkunId : transaksi.debitAkunId

        const template = await prisma.templateTransaksi.create({
            data: {
                nama,
                deskripsi: transaksi.deskripsi,
                nominal: Money.toFloat(Number(transaksi.nominal)), // Convert BigInt to Float
                kategori: transaksi.kategori,
                tipeTransaksi: isKeluar ? "KELUAR" : "MASUK",
                akunId,
            }
        })

        await logSistem("INFO", "TEMPLATE", `Transaksi disimpan sebagai template: ${nama}`)
        revalidatePath("/template")

        return { success: true, data: template }
    } catch (error) {
        return { success: false, error: "Gagal menyimpan sebagai template" }
    }
}