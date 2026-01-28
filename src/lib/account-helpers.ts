import { mapAccountToDTO } from "./account-dto"
import { revalidatePath } from "next/cache"
import { Money } from "@/lib/money"
import { saveNetWorthSnapshot } from "@/lib/db/networth-repo"
import prisma from "@/lib/prisma"

/**
 * User account types that should be displayed to users (not internal category accounts)
 */
export const USER_ACCOUNT_TYPES: readonly ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"] = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"] as const

/**
 * Maps account BigInt fields to Float for UI consumption
 */
export function mapAccountToFloat<T extends Record<string, any>>(account: T): T {
    return mapAccountToDTO(account)
}

/**
 * Maps transaction BigInt fields to Float for UI consumption
 */
export function mapTransaksiToFloat<T extends Record<string, any>>(transaksi: T): T {
    return {
        ...transaksi,
        nominal: Money.toFloat(Number(transaksi.nominal))
    }
}

/**
 * Updates both debit and credit account balances within a transaction
 */
export async function updateAccountBalances(
    tx: any,
    debitAkunId: string,
    kreditAkunId: string,
    nominal: bigint
): Promise<void> {
    await Promise.all([
        tx.akun.update({
            where: { id: debitAkunId },
            data: { saldoSekarang: { increment: nominal } }
        }),
        tx.akun.update({
            where: { id: kreditAkunId },
            data: { saldoSekarang: { decrement: nominal } }
        })
    ])
}

/**
 * Revalidates common paths after transaction/account changes
 */
export function revalidateCommonPaths(): void {
    revalidatePath("/transaksi")
    revalidatePath("/akun")
    revalidatePath("/")
}

/**
 * Revalidates paths and triggers background snapshot after data changes
 */
export function revalidateWithSnapshot(): void {
    revalidateCommonPaths()
    // Trigger background snapshot (non-blocking)
    void saveNetWorthSnapshot()
}

/**
 * Checks if a transaction with the given idempotency key already exists
 */
export async function checkIdempotency(idempotencyKey: string): Promise<boolean> {
    const existing = await prisma.transaksi.findUnique({
        where: { idempotencyKey }
    })
    return existing !== null
}

/**
 * Gets or creates a category account for transactions
 */
export async function getOrCreateKategoriAkun(
    tx: any,
    kategori: string,
    tipe: "EXPENSE" | "INCOME"
) {
    const namaAkun = `[${tipe}] ${kategori}`

    let akun = await tx.akun.findFirst({
        where: { nama: namaAkun, tipe }
    })

    if (!akun) {
        akun = await tx.akun.create({
            data: {
                nama: namaAkun,
                tipe,
                saldoAwal: BigInt(0),
                saldoSekarang: BigInt(0),
            }
        })
    }

    return akun
}
