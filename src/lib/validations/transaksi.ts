import { z } from "zod"

export const TransaksiSchema = z.object({
    nominal: z.coerce.number()
        .min(100, "Nominal minimal Rp 100")
        .max(1_000_000_000, "Nominal maksimal Rp 1 miliar"),
    
    kategori: z.string()
        .min(1, "Kategori wajib diisi")
        .max(50, "Kategori maksimal 50 karakter"),
    
    deskripsi: z.string()
        .max(200, "Deskripsi maksimal 200 karakter")
        .optional()
        .or(z.literal('')), // Allow empty string
    
    tanggal: z.coerce.date()
        .refine((date) => date <= new Date(new Date().setHours(23, 59, 59, 999)), { 
            message: "Tanggal tidak boleh di masa depan" 
        }),
    
    akunId: z.string().cuid("ID akun tidak valid").optional(),
    debitAkunId: z.string().cuid().optional(),
    kreditAkunId: z.string().cuid().optional(),
    catatan: z.string().optional(),
})

export type TransaksiFormData = z.infer<typeof TransaksiSchema>