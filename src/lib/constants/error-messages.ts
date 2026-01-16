import { formatRupiah } from "@/lib/format"

export const ErrorMessages = {
    INSUFFICIENT_BALANCE: (available: number, needed: number) => 
        `Saldo tidak cukup. Tersedia: ${formatRupiah(available)}, butuh: ${formatRupiah(needed)}`,
    
    ACCOUNT_NOT_FOUND: (id: string) => 
        `Akun tidak ditemukan (ID: ${id.slice(0, 8)}...)`,
    
    DUPLICATE_TRANSACTION: (date: Date) => 
        `Transaksi dengan tanggal ${date.toLocaleDateString('id-ID')} sudah ada`,
    
    INVALID_AMOUNT: (amount: number) => 
        `Nominal tidak valid: ${formatRupiah(amount)}. Minimal Rp 100`,
    
    CREDIT_CARD_LIMIT_EXCEEDED: (limit: number, current: number, attempt: number) =>
        `Limit kartu kredit terlampaui!\n` +
        `Limit: ${formatRupiah(limit)}\n` +
        `Terpakai: ${formatRupiah(Math.abs(current))}\n` +
        `Transaksi: ${formatRupiah(attempt)}\n` +
        `Tersisa: ${formatRupiah(limit + current - attempt)}`,
    
    GENERAL_ERROR: "Terjadi kesalahan sistem. Silakan coba lagi.",
    UNAUTHORIZED: "Anda tidak memiliki akses untuk melakukan tindakan ini.",
}
