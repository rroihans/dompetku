"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { SUPPORTED_CURRENCIES, DEFAULT_RATES, getCurrencyInfo } from "@/lib/currency"

// ============================================
// MULTI-CURRENCY SUPPORT
// ============================================

// Helper untuk format currency (internal use only)
function formatCurrencyHelper(nominal: number, kode: string = "IDR"): string {
    const currency = getCurrencyInfo(kode)
    if (kode === "IDR") {
        return `Rp ${nominal.toLocaleString("id-ID")}`
    }
    const formatted = nominal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
    return `${currency?.simbol || kode} ${formatted}`
}

// Ambil semua currency rates
export async function getCurrencyRates() {
    try {
        const rates = await prisma.currencyRate.findMany({
            where: { kodeTujuan: "IDR" },
            orderBy: { kodeAsal: "asc" }
        })

        // Jika tidak ada rates, buat default rates
        if (rates.length === 0) {
            await initializeDefaultRates()
            return getCurrencyRates()
        }

        return { success: true, data: rates }
    } catch (error) {
        return { success: false, data: [] }
    }
}

// Initialize default rates
async function initializeDefaultRates() {
    try {
        for (const [kode, rate] of Object.entries(DEFAULT_RATES)) {
            await prisma.currencyRate.upsert({
                where: {
                    kodeAsal_kodeTujuan: {
                        kodeAsal: kode,
                        kodeTujuan: "IDR"
                    }
                },
                update: { rate },
                create: {
                    kodeAsal: kode,
                    kodeTujuan: "IDR",
                    rate,
                    sumber: "default"
                }
            })
        }
        await logSistem("INFO", "CURRENCY", "Default rates initialized")
    } catch (error) {
        console.error("Error initializing default rates:", error)
    }
}

// Fetch rates dari CurrencyApi.net
export async function fetchLiveRates(apiKey: string) {
    try {
        const response = await fetch(
            `https://currencyapi.net/api/v1/rates?key=${apiKey}&base=USD&output=JSON`,
            { next: { revalidate: 3600 } } // Cache 1 jam
        )

        if (!response.ok) {
            throw new Error("API request failed")
        }

        const data = await response.json()

        if (!data.valid) {
            throw new Error("Invalid API response")
        }

        // Konversi rates ke IDR base
        // API memberikan rate berdasarkan USD, kita perlu convert ke IDR
        const usdToIdr = data.rates.IDR || 15800

        // Update semua rates ke database
        for (const currency of SUPPORTED_CURRENCIES) {
            if (currency.kode === "IDR") continue

            let rateToIDR: number
            if (currency.kode === "USD") {
                rateToIDR = usdToIdr
            } else {
                // 1 [CURRENCY] = x USD, jadi 1 [CURRENCY] = x * usdToIdr IDR
                const currencyToUsd = 1 / (data.rates[currency.kode] || 1)
                rateToIDR = currencyToUsd * usdToIdr
            }

            await prisma.currencyRate.upsert({
                where: {
                    kodeAsal_kodeTujuan: {
                        kodeAsal: currency.kode,
                        kodeTujuan: "IDR"
                    }
                },
                update: {
                    rate: Math.round(rateToIDR * 100) / 100,
                    tanggalUpdate: new Date(),
                    sumber: "api"
                },
                create: {
                    kodeAsal: currency.kode,
                    kodeTujuan: "IDR",
                    rate: Math.round(rateToIDR * 100) / 100,
                    sumber: "api"
                }
            })
        }

        await logSistem("INFO", "CURRENCY", `Live rates updated from API (${Object.keys(data.rates).length} currencies)`)
        revalidatePath("/pengaturan")

        return { success: true, message: "Rates berhasil diperbarui dari API" }
    } catch (error) {
        await logSistem("ERROR", "CURRENCY", "Gagal fetch live rates", (error as Error).message)
        return { success: false, error: "Gagal mengambil rates dari API: " + (error as Error).message }
    }
}

// Update rate manual
export async function updateCurrencyRate(kodeAsal: string, rate: number) {
    try {
        const updated = await prisma.currencyRate.upsert({
            where: {
                kodeAsal_kodeTujuan: {
                    kodeAsal,
                    kodeTujuan: "IDR"
                }
            },
            update: {
                rate,
                tanggalUpdate: new Date(),
                sumber: "manual"
            },
            create: {
                kodeAsal,
                kodeTujuan: "IDR",
                rate,
                sumber: "manual"
            }
        })

        await logSistem("INFO", "CURRENCY", `Rate updated: 1 ${kodeAsal} = Rp ${rate}`)
        revalidatePath("/pengaturan")

        return { success: true, data: updated }
    } catch (error) {
        return { success: false, error: "Gagal update rate" }
    }
}

// Konversi mata uang ke IDR dengan opsi biaya bank
export async function convertToIDR(
    nominal: number,
    dariKode: string,
    biayaAdminPersen: number = 0 // Biaya admin bank (0-5%)
): Promise<number> {
    if (dariKode === "IDR") return nominal

    try {
        const rate = await prisma.currencyRate.findUnique({
            where: {
                kodeAsal_kodeTujuan: {
                    kodeAsal: dariKode,
                    kodeTujuan: "IDR"
                }
            }
        })

        let baseAmount: number
        if (rate) {
            baseAmount = nominal * rate.rate
        } else if (DEFAULT_RATES[dariKode]) {
            baseAmount = nominal * DEFAULT_RATES[dariKode]
        } else {
            baseAmount = nominal
        }

        // Terapkan potongan biaya admin bank (biasanya bank ambil 1-3%)
        const potonganAdmin = baseAmount * (biayaAdminPersen / 100)
        return baseAmount - potonganAdmin

    } catch (error) {
        return nominal
    }
}

// Konversi dari IDR ke mata uang lain
export async function convertFromIDR(nominal: number, keKode: string): Promise<number> {
    if (keKode === "IDR") return nominal

    try {
        const rate = await prisma.currencyRate.findUnique({
            where: {
                kodeAsal_kodeTujuan: {
                    kodeAsal: keKode,
                    kodeTujuan: "IDR"
                }
            }
        })

        if (rate) {
            return nominal / rate.rate
        }

        // Fallback ke default rate
        if (DEFAULT_RATES[keKode]) {
            return nominal / DEFAULT_RATES[keKode]
        }

        return nominal
    } catch (error) {
        return nominal
    }
}

// Simpan konversi transaksi dengan biaya bank
export async function createTransactionWithCurrency(
    data: {
        deskripsi: string
        nominalAsli: number
        mataUangAsal: string
        kategori: string
        tipeTransaksi: "KELUAR" | "MASUK"
        akunId: string
        tanggal?: Date
        biayaAdminPersen?: number // Biaya admin bank (optional)
        biayaAdminFlat?: number   // Biaya admin flat (optional, dalam IDR)
    }
) {
    try {
        const biayaAdminPersen = data.biayaAdminPersen || 0
        const biayaAdminFlat = data.biayaAdminFlat || 0

        // Konversi ke IDR dengan potongan biaya admin
        let nominalIDR = await convertToIDR(data.nominalAsli, data.mataUangAsal, biayaAdminPersen)

        // Kurangi biaya admin flat
        nominalIDR = nominalIDR - biayaAdminFlat

        // Cari akun kategori
        const kategoriAkun = await prisma.akun.findFirst({
            where: {
                nama: data.tipeTransaksi === "KELUAR"
                    ? `[EXPENSE] ${data.kategori}`
                    : `[INCOME] ${data.kategori}`
            }
        })

        if (!kategoriAkun) {
            return { success: false, error: "Kategori tidak ditemukan" }
        }

        // Format catatan biaya
        const originalFormatted = formatCurrencyHelper(data.nominalAsli, data.mataUangAsal)
        let catatan = `Original: ${originalFormatted} → Rp ${nominalIDR.toLocaleString("id-ID")}`
        if (biayaAdminPersen > 0 || biayaAdminFlat > 0) {
            catatan += ` (Biaya: ${biayaAdminPersen}% + Rp ${biayaAdminFlat.toLocaleString("id-ID")})`
        }

        // Buat transaksi
        const transaksi = await prisma.transaksi.create({
            data: {
                tanggal: data.tanggal || new Date(),
                deskripsi: `${data.deskripsi} (${originalFormatted})`,
                nominal: nominalIDR,
                kategori: data.kategori,
                debitAkunId: data.tipeTransaksi === "KELUAR" ? kategoriAkun.id : data.akunId,
                kreditAkunId: data.tipeTransaksi === "KELUAR" ? data.akunId : kategoriAkun.id,
                catatan,
                idempotencyKey: `currency-${Date.now()}`
            }
        })

        // Update saldo
        if (data.tipeTransaksi === "KELUAR") {
            await prisma.akun.update({
                where: { id: data.akunId },
                data: { saldoSekarang: { decrement: nominalIDR } }
            })
        } else {
            await prisma.akun.update({
                where: { id: data.akunId },
                data: { saldoSekarang: { increment: nominalIDR } }
            })
        }

        await logSistem("INFO", "CURRENCY", `Transaksi ${data.mataUangAsal}: ${data.nominalAsli} → IDR: ${nominalIDR}`)
        revalidatePath("/")
        revalidatePath("/transaksi")

        return { success: true, data: transaksi }
    } catch (error) {
        await logSistem("ERROR", "CURRENCY", "Gagal membuat transaksi multi-currency", (error as Error).stack)
        return { success: false, error: "Gagal membuat transaksi" }
    }
}

// Simpan API key ke settings
export async function saveCurrencyApiKey(apiKey: string) {
    try {
        await prisma.appSetting.upsert({
            where: { kunci: "currency_api_key" },
            update: { nilai: apiKey },
            create: { kunci: "currency_api_key", nilai: apiKey }
        })
        return { success: true }
    } catch (error) {
        return { success: false, error: "Gagal menyimpan API key" }
    }
}

// Ambil API key dari settings
export async function getCurrencyApiKey() {
    try {
        const setting = await prisma.appSetting.findUnique({
            where: { kunci: "currency_api_key" }
        })
        return { success: true, data: setting?.nilai || "" }
    } catch (error) {
        return { success: false, data: "" }
    }
}
