import { Money } from "./money"

export function formatRupiah(amount: number) {
    // Gunakan Money utility untuk format yang konsisten (2 desimal)
    // Money.format menerima Integer (Sen), jadi konversi dulu
    return Money.format(Money.fromFloat(amount))
}

// Simbol mata uang
const CURRENCY_SYMBOLS: Record<string, string> = {
    IDR: "Rp",
    USD: "$",
    EUR: "€",
    SGD: "S$",
    MYR: "RM",
    JPY: "¥",
    GBP: "£",
    AUD: "A$",
    CNY: "¥",
    KRW: "₩",
}

// Format currency berdasarkan kode mata uang
export function formatCurrency(amount: number, currencyCode: string = "IDR"): string {
    const isNegative = amount < 0
    const absAmount = Math.abs(amount)
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode

    if (currencyCode === "IDR") {
        return `${isNegative ? '-' : ''}${symbol} ${absAmount.toLocaleString('id-ID')}`
    }

    // Format untuk mata uang asing dengan 2 desimal
    const formatted = absAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })

    return `${isNegative ? '-' : ''}${symbol} ${formatted}`
}
