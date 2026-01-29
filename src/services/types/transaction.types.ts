export interface TransaksiInput {
    id?: string
    tanggal?: Date | string
    keterangan: string
    nominalInt: number
    kategori?: string
    idAkunDebit?: string
    idAkunKredit?: string
    tags?: string[]
}
