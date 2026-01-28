import { Money } from "./money"

export type AccountDTO = {
    id: string
    nama: string
    tipe: string
    saldoSekarang: number
    saldoAwal: number
    limitKredit: number | null
    setoranAwal: number | null
    minPaymentFixed: number | null
    minInstallmentAmount: number | null
    templateId?: string | null
    templateSource?: string | null
    templateOverrides?: string | null
    icon?: string | null
    warna?: string | null
    isSyariah?: boolean | null
    billingDate?: number | null
    dueDate?: number | null
    minPaymentPercent?: number | null
    useDecimalFormat?: boolean
    biayaAdminAktif?: boolean
    biayaAdminNominal?: number | null
    biayaAdminPola?: string | null
    biayaAdminTanggal?: number | null
    bungaAktif?: boolean
    bungaTiers?: string | null
}

/**
 * Maps account BigInt fields to Float for UI consumption
 */
export function mapAccountToDTO<T extends Record<string, any>>(account: T): T {
    return Object.assign({}, account, {
        saldoSekarang: Money.toFloat(Number(account.saldoSekarang)),
        saldoAwal: Money.toFloat(Number(account.saldoAwal)),
        limitKredit: account.limitKredit ? Money.toFloat(Number(account.limitKredit)) : null,
        setoranAwal: account.setoranAwal ? Money.toFloat(Number(account.setoranAwal)) : null,
        minPaymentFixed: account.minPaymentFixed ? Money.toFloat(Number(account.minPaymentFixed)) : null,
        minInstallmentAmount: account.minInstallmentAmount ? Money.toFloat(Number(account.minInstallmentAmount)) : null,
    }) as T
}

export function mapAccountsToDTO<T extends Record<string, any>>(accounts: T[]): T[] {
    return accounts.map(mapAccountToDTO)
}
