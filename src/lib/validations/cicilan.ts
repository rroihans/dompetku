import { z } from "zod"

export const CicilanSchema = z.object({
    namaProduk: z.string().min(1, "Nama produk wajib diisi"),
    totalPokok: z.coerce.number().min(1, "Nominal cicilan harus lebih dari Rp 0"),
    tenor: z.coerce.number().min(1, "Tenor minimal 1 bulan").max(60, "Tenor maksimal 60 bulan"),
    nominalPerBulan: z.coerce.number().min(1, "Cicilan bulanan harus lebih dari Rp 0"),
    biayaAdmin: z.coerce.number().min(0, "Biaya admin tidak boleh negatif").default(0),
    bungaPersen: z.coerce.number().min(0, "Bunga persen tidak boleh negatif").default(0),
    tanggalJatuhTempo: z.coerce.number().min(1, "Tanggal jatuh tempo harus 1-31").max(31, "Tanggal jatuh tempo harus 1-31"),
    akunKreditId: z.string().cuid("ID akun kredit tidak valid"),
    akunDebitId: z.string().cuid("ID akun debit tidak valid"),
    adminFeeType: z.enum(["FLAT", "PERCENTAGE"]).optional(),
    adminFeeAmount: z.coerce.number().min(0).optional(),
})

export type CicilanFormData = z.infer<typeof CicilanSchema>

export const ConvertInstallmentSchema = z.object({
    transaksiId: z.string().cuid("ID transaksi tidak valid"),
    tenor: z.coerce.number().min(1, "Tenor minimal 1 bulan").max(60, "Tenor maksimal 60 bulan"),
    templateId: z.string().cuid().optional(),
    adminFeeType: z.enum(["FLAT", "PERCENTAGE"]).default("FLAT"),
    adminFeeAmount: z.coerce.number().min(0, "Biaya admin tidak boleh negatif").default(0),
    interestRate: z.coerce.number().min(0, "Bunga tidak boleh negatif").default(0),
})

export type ConvertInstallmentFormData = z.infer<typeof ConvertInstallmentSchema>
