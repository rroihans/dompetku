export interface RencanaCicilanInput {
    nama: string
    keterangan?: string
    jumlahPokokInt: number
    tenorBulan: number
    bungaPersenPerTahun: number
    tanggalJatuhTempo: number // 1-31
    idAkunKredit: string // Kartu Kredit
    idAkunDebitPembayaran: string // Sumber dana bayar (opsional/default)
}
