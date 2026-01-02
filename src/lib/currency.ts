// Mata uang yang didukung
export const SUPPORTED_CURRENCIES = [
    { kode: "IDR", nama: "Rupiah Indonesia", simbol: "Rp", flag: "🇮🇩" },
    { kode: "USD", nama: "US Dollar", simbol: "$", flag: "🇺🇸" },
    { kode: "EUR", nama: "Euro", simbol: "€", flag: "🇪🇺" },
    { kode: "SGD", nama: "Singapore Dollar", simbol: "S$", flag: "🇸🇬" },
    { kode: "MYR", nama: "Malaysian Ringgit", simbol: "RM", flag: "🇲🇾" },
    { kode: "JPY", nama: "Japanese Yen", simbol: "¥", flag: "🇯🇵" },
    { kode: "GBP", nama: "British Pound", simbol: "£", flag: "🇬🇧" },
    { kode: "AUD", nama: "Australian Dollar", simbol: "A$", flag: "🇦🇺" },
    { kode: "CNY", nama: "Chinese Yuan", simbol: "¥", flag: "🇨🇳" },
    { kode: "KRW", nama: "Korean Won", simbol: "₩", flag: "🇰🇷" },
]

// Default rates (approximate, as fallback)
export const DEFAULT_RATES: Record<string, number> = {
    USD: 15800,
    EUR: 17200,
    SGD: 11800,
    MYR: 3500,
    JPY: 105,
    GBP: 20000,
    AUD: 10200,
    CNY: 2200,
    KRW: 12,
}

// Get currency info by code
export function getCurrencyInfo(kode: string) {
    return SUPPORTED_CURRENCIES.find(c => c.kode === kode)
}

// Simbol mata uang
export const CURRENCY_SYMBOLS: Record<string, string> = {
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
