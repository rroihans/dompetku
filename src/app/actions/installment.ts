"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { Money } from "@/lib/money"

/**
 * Get all active installment templates
 */
export async function getInstallmentTemplates() {
    try {
        const templates = await prisma.installmentTemplate.findMany({
            where: { isActive: true },
            orderBy: [
                { bankName: "asc" },
                { nama: "asc" }
            ]
        })

        return { success: true, data: templates }
    } catch (error) {
        await logSistem("ERROR", "INSTALLMENT", "Gagal mengambil template cicilan", (error as Error).stack)
        return { success: false, data: [], error: "Gagal mengambil template cicilan" }
    }
}

/**
 * Get templates by bank name
 */
export async function getTemplatesByBank(bankName: string) {
    try {
        const templates = await prisma.installmentTemplate.findMany({
            where: {
                isActive: true,
                bankName: {
                    contains: bankName
                }
            }
        })

        return { success: true, data: templates }
    } catch (error) {
        await logSistem("ERROR", "INSTALLMENT", "Gagal mengambil template bank", (error as Error).stack)
        return { success: false, data: [], error: "Gagal mengambil template" }
    }
}

interface ConvertToInstallmentParams {
    transaksiId: string
    tenor: number
    templateId?: string
    adminFeeAmount?: number
    adminFeeType?: "FLAT" | "PERCENTAGE"
}

/**
 * Convert transaction to installment plan
 * Logic (CIMB Niaga style):
 * 1. Cicilan per bulan = Nominal Transaksi / Tenor (TANPA admin fee)
 * 2. Admin fee = Transaksi terpisah (one-time)
 * 3. Original transaction tetap (sudah mengurangi limit), hanya tandai sebagai converted
 * 4. Buat RencanaCicilan untuk tracking pembayaran
 */
export async function convertTransactionToInstallment(params: ConvertToInstallmentParams) {
    const { transaksiId, tenor, templateId, adminFeeAmount, adminFeeType } = params

    try {
        // Validate inputs
        if (!transaksiId || !tenor || tenor < 1) {
            return { success: false, error: "Data tidak valid" }
        }

        // Get transaction details
        const transaksi = await prisma.transaksi.findUnique({
            where: { id: transaksiId },
            include: {
                kreditAkun: true,
                debitAkun: true
            }
        })

        if (!transaksi) {
            return { success: false, error: "Transaksi tidak ditemukan" }
        }

        // Validate transaction not already converted
        if (transaksi.convertedToInstallment) {
            return { success: false, error: "Transaksi sudah dikonversi ke cicilan" }
        }

        // Validate transaction is from credit card
        if (transaksi.kreditAkun.tipe !== "CREDIT_CARD") {
            return { success: false, error: "Transaksi harus dari kartu kredit" }
        }

        const nominalFloat = Money.toFloat(Number(transaksi.nominal))

        // Check minimum installment amount if set
        const minAmount = transaksi.kreditAkun.minInstallmentAmount ? Money.toFloat(Number(transaksi.kreditAkun.minInstallmentAmount)) : null
        if (minAmount && nominalFloat < minAmount) {
            return {
                success: false,
                error: `Nominal minimal untuk konversi cicilan adalah Rp ${minAmount.toLocaleString('id-ID')}`
            }
        }

        // Load template if provided
        let template = null
        let finalAdminFee = adminFeeAmount || 0
        let finalAdminFeeType = adminFeeType || "FLAT"
        let installmentType = "REGULAR"

        if (templateId) {
            template = await prisma.installmentTemplate.findUnique({
                where: { id: templateId }
            })

            if (template) {
                finalAdminFeeType = template.adminFeeType as "FLAT" | "PERCENTAGE"
                finalAdminFee = template.adminFeeAmount || 0
                installmentType = template.interestRate === 0 ? "ZERO_PERCENT" : "REGULAR"
            }
        }

        // Calculate admin fee
        let adminFeeNominal = 0
        if (finalAdminFeeType === "PERCENTAGE") {
            adminFeeNominal = nominalFloat * (finalAdminFee / 100)
        } else {
            adminFeeNominal = finalAdminFee
        }

        // ** KEY DIFFERENCE ** 
        // Cicilan per bulan = Nominal transaksi / Tenor (TANPA admin fee)
        // Admin fee adalah transaksi terpisah, tidak termasuk dalam cicilan bulanan
        const nominalPerBulan = Math.ceil(nominalFloat / tenor)

        // Get or create expense account for cicilan
        const namaAkunDebit = "[EXPENSE] Cicilan"
        let akunDebit = await prisma.akun.findFirst({
            where: { nama: namaAkunDebit }
        })

        if (!akunDebit) {
            akunDebit = await prisma.akun.create({
                data: {
                    nama: namaAkunDebit,
                    tipe: "EXPENSE",
                    saldoAwal: BigInt(0),
                    saldoSekarang: BigInt(0),
                }
            })
        }

        // Prepare BigInt values
        const nominalPerBulanInt = BigInt(Money.fromFloat(nominalPerBulan))
        const adminFeeNominalInt = BigInt(Money.fromFloat(adminFeeNominal))

        // Atomic transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create RencanaCicilan
            const cicilan = await tx.rencanaCicilan.create({
                data: {
                    namaProduk: transaksi.deskripsi,
                    totalPokok: transaksi.nominal, // BigInt
                    tenor: tenor,
                    cicilanKe: 1,
                    nominalPerBulan: nominalPerBulanInt,
                    biayaAdmin: adminFeeNominalInt,
                    bungaPersen: template?.interestRate || 0,
                    tanggalJatuhTempo: transaksi.kreditAkun.dueDate || 15,
                    status: "AKTIF",
                    akunKreditId: transaksi.kreditAkunId,
                    akunDebitId: akunDebit!.id,
                    isConvertedFromTx: true,
                    originalTxId: transaksi.id,
                    templateId: templateId || null,
                    adminFeeType: finalAdminFeeType,
                    adminFeeAmount: adminFeeNominal, // Float stored in RencanaCicilan (schema might need update if I missed this?)
                    installmentType: installmentType
                }
            })
            
            // Note: `adminFeeAmount` in RencanaCicilan schema is `Float?`. I did not migrate it to Int because it's metadata/config?
            // "adminFeeAmount Float?" in schema.
            // "biayaAdmin BigInt" in schema.
            // So storing `adminFeeNominal` (float) in `adminFeeAmount` is correct.

            // 2. Mark original transaction as converted (SALDO TIDAK DIUBAH)
            // Transaksi asli tetap valid dan sudah mengurangi limit kartu kredit
            await tx.transaksi.update({
                where: { id: transaksiId },
                data: {
                    convertedToInstallment: true,
                    rencanaCicilanId: cicilan.id
                }
            })

            // 3. TIDAK ada reversal saldo - transaksi asli sudah menghitung utang dengan benar

            // 4. Create admin fee transaction if applicable (transaksi terpisah)
            if (adminFeeNominal > 0) {
                // Get or create biaya admin expense account
                const namaAkunAdmin = "[EXPENSE] Biaya Admin Cicilan"
                let akunAdmin = await tx.akun.findFirst({
                    where: { nama: namaAkunAdmin }
                })

                if (!akunAdmin) {
                    akunAdmin = await tx.akun.create({
                        data: {
                            nama: namaAkunAdmin,
                            tipe: "EXPENSE",
                            saldoAwal: BigInt(0),
                            saldoSekarang: BigInt(0)
                        }
                    })
                }

                // Create admin fee as separate transaction (menambah utang kartu kredit)
                await tx.transaksi.create({
                    data: {
                        deskripsi: `Biaya Admin Cicilan: ${transaksi.deskripsi}`,
                        nominal: adminFeeNominalInt,
                        kategori: "Biaya Admin",
                        debitAkunId: akunAdmin.id,
                        kreditAkunId: transaksi.kreditAkunId,
                        tanggal: new Date(),
                        catatan: `Biaya admin konversi ${tenor} bulan (Template: ${template?.nama || 'Manual'})`,
                        rencanaCicilanId: cicilan.id
                    }
                })

                // Update saldo for admin fee (menambah pengeluaran dan utang)
                await tx.akun.update({
                    where: { id: akunAdmin.id },
                    data: { saldoSekarang: { increment: adminFeeNominalInt } }
                })
                await tx.akun.update({
                    where: { id: transaksi.kreditAkunId },
                    data: { saldoSekarang: { decrement: adminFeeNominalInt } }
                })
            }

            return cicilan
        })

        await logSistem("INFO", "INSTALLMENT",
            `Transaksi dikonversi ke cicilan: ${transaksi.deskripsi} (${tenor} bulan × Rp ${nominalPerBulan.toLocaleString('id-ID')}, admin Rp ${adminFeeNominal.toLocaleString('id-ID')})`)

        revalidatePath("/transaksi")
        revalidatePath("/cicilan")
        revalidatePath("/akun")
        revalidatePath(`/akun/${transaksi.kreditAkunId}`)
        revalidatePath("/")

        const mappedResult = {
            ...result,
            totalPokok: Money.toFloat(Number(result.totalPokok)),
            nominalPerBulan: Money.toFloat(Number(result.nominalPerBulan)),
            biayaAdmin: Money.toFloat(Number(result.biayaAdmin)),
        }

        return {
            success: true,
            data: mappedResult,
            message: `Berhasil dikonversi ke cicilan ${tenor} bulan (Rp ${nominalPerBulan.toLocaleString('id-ID')}/bulan)`
        }
    } catch (error) {
        await logSistem("ERROR", "INSTALLMENT", "Gagal konversi ke cicilan", (error as Error).stack)
        return { success: false, error: "Gagal mengkonversi transaksi ke cicilan" }
    }
}

/**
 * Get conversion preview (without executing)
 */
export async function getConversionPreview(
    transaksiId: string,
    tenor: number,
    templateId?: string,
    adminFeeAmount?: number,
    adminFeeType?: "FLAT" | "PERCENTAGE"
) {
    try {
        const transaksi = await prisma.transaksi.findUnique({
            where: { id: transaksiId },
            include: { kreditAkun: true }
        })

        if (!transaksi) {
            return { success: false, error: "Transaksi tidak ditemukan" }
        }

        const nominalFloat = Money.toFloat(Number(transaksi.nominal))

        // Load template if provided
        let finalAdminFee = adminFeeAmount || 0
        let finalAdminFeeType = adminFeeType || "FLAT"

        if (templateId) {
            const template = await prisma.installmentTemplate.findUnique({
                where: { id: templateId }
            })

            if (template) {
                finalAdminFeeType = template.adminFeeType as "FLAT" | "PERCENTAGE"
                finalAdminFee = template.adminFeeAmount || 0
            }
        }

        // Calculate admin fee
        let adminFeeNominal = 0
        if (finalAdminFeeType === "PERCENTAGE") {
            adminFeeNominal = nominalFloat * (finalAdminFee / 100)
        } else {
            adminFeeNominal = finalAdminFee
        }

        // Monthly payment = nominal / tenor (TANPA admin fee)
        // Admin fee adalah biaya terpisah one-time
        const nominalPerBulan = Math.ceil(nominalFloat / tenor)

        return {
            success: true,
            data: {
                originalNominal: nominalFloat,
                adminFee: adminFeeNominal,
                adminFeeType: finalAdminFeeType,
                total: nominalFloat + adminFeeNominal, // Total yang akan dibayar (termasuk admin)
                tenor: tenor,
                monthlyPayment: nominalPerBulan, // Cicilan bulanan tanpa admin
                deskripsi: transaksi.deskripsi
            }
        }
    } catch (error) {
        return { success: false, error: "Gagal menghitung preview" }
    }
}