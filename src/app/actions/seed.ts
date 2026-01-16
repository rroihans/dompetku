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

// Seed Installment Templates (v0.5.0)
export async function seedInstallmentTemplates() {
    try {
        const templateCount = await prisma.installmentTemplate.count()
        if (templateCount > 0) return { success: true, message: "Template cicilan sudah ada" }

        const cimbTemplates = [
            {
                nama: "CIMB Niaga 0% 3 Bulan (App)",
                bankName: "CIMB Niaga",
                cardType: "KONVENSIONAL",
                tenorOptions: JSON.stringify([3]),
                adminFeeType: "FLAT",
                adminFeeAmount: 25000,
                interestRate: 0,
                notes: "Biaya admin Rp 25.000 untuk konversi via aplikasi OCTO"
            },
            {
                nama: "CIMB Niaga 0% 3 Bulan (Call Center)",
                bankName: "CIMB Niaga",
                cardType: "KONVENSIONAL",
                tenorOptions: JSON.stringify([3]),
                adminFeeType: "FLAT",
                adminFeeAmount: 50000,
                interestRate: 0,
                notes: "Biaya admin Rp 50.000 untuk konversi via call center 14041"
            },
            {
                nama: "CIMB Niaga Syariah 0% 3 Bulan (App)",
                bankName: "CIMB Niaga",
                cardType: "SYARIAH",
                tenorOptions: JSON.stringify([3]),
                adminFeeType: "FLAT",
                adminFeeAmount: 25000,
                interestRate: 0,
                notes: "Biaya admin Rp 25.000 untuk konversi via aplikasi OCTO"
            }
        ]

        for (const template of cimbTemplates) {
            await prisma.installmentTemplate.create({ data: template })
        }

        await logSistem("INFO", "SYSTEM", `${cimbTemplates.length} template cicilan CIMB Niaga berhasil di-seed`)
        return { success: true, message: `${cimbTemplates.length} template berhasil dibuat` }
    } catch (error) {
        await logSistem("ERROR", "SYSTEM", "Gagal seeding template cicilan", (error as Error).stack)
        return { success: false, error: "Gagal seeding template" }
    }
}

// Migrate existing credit cards to have default values (for demo)
export async function migrateCreditCardDefaults() {
    try {
        const creditCards = await prisma.akun.findMany({
            where: {
                tipe: "CREDIT_CARD",
                isSyariah: null // Only update ones without values
            }
        })

        if (creditCards.length === 0) {
            return { success: true, message: "Tidak ada kartu kredit yang perlu dimigrasi" }
        }

        let updated = 0
        for (const card of creditCards) {
            await prisma.akun.update({
                where: { id: card.id },
                data: {
                    isSyariah: false, // Default: Konvensional
                    billingDate: 25,  // Default: tanggal 25
                    dueDate: 15,      // Default: tanggal 15
                    minPaymentFixed: 50000,
                    minPaymentPercent: 5
                }
            })
            updated++
        }

        await logSistem("INFO", "SYSTEM", `${updated} kartu kredit dimigrasi dengan nilai default`)
        return { success: true, message: `${updated} kartu kredit diperbarui dengan nilai default` }
    } catch (error) {
        await logSistem("ERROR", "SYSTEM", "Gagal migrasi kartu kredit", (error as Error).stack)
        return { success: false, error: "Gagal migrasi" }
    }
}

