
import { db, CurrencyRateRecord } from "./app-db";
import { DEFAULT_RATES, SUPPORTED_CURRENCIES } from "../currency";

// Helpers
// Note: We use a local helper or import from a shared location if available. 
// Ideally should be in a shared lib/db/utils.ts or similar.
async function logSistem(level: string, context: string, message: string, detail?: string) {
    try {
        await db.logSistem.add({
            id: crypto.randomUUID(),
            level,
            modul: context, // Schema uses 'modul' not 'context'
            pesan: message, // Schema uses 'pesan' not 'message'
            stackTrace: detail, // Schema uses 'stackTrace' not 'detail'
            createdAt: new Date()
        });
    } catch (e) {
        console.error("Failed to log system:", e);
    }
}

// Get all currency rates
export async function getCurrencyRates() {
    try {
        // Fetch from Dexie
        const rates = await db.currencyRate.toArray();

        // Initialize defaults if empty
        if (rates.length === 0) {
            await initializeDefaultRates();
            return await getCurrencyRates();
        }

        return { success: true, data: rates };
    } catch (error) {
        console.error("getCurrencyRates error", error);
        return { success: false, data: [] };
    }
}

// Initialize default rates
async function initializeDefaultRates() {
    try {
        const rates: CurrencyRateRecord[] = [];
        const now = new Date();

        for (const [kode, rate] of Object.entries(DEFAULT_RATES)) {
            // Check if exists
            const existing = await db.currencyRate.get({ kodeAsal: kode, kodeTujuan: "IDR" });
            if (!existing) {
                rates.push({
                    id: crypto.randomUUID(),
                    kodeAsal: kode,
                    kodeTujuan: "IDR",
                    rate: rate,
                    sumber: "default",
                    tanggalUpdate: now,
                    createdAt: now,
                    updatedAt: now
                });
            }
        }

        if (rates.length > 0) {
            await db.currencyRate.bulkAdd(rates);
            await logSistem("INFO", "CURRENCY", "Default rates initialized");
        }
    } catch (error) {
        console.error("Error initializing default rates:", error);
    }
}

// Update rate manual
export async function updateCurrencyRate(kodeAsal: string, rate: number) {
    try {
        const existing = await db.currencyRate.get({ kodeAsal, kodeTujuan: "IDR" });
        const now = new Date();

        if (existing) {
            await db.currencyRate.update(existing.id, {
                rate,
                tanggalUpdate: now,
                sumber: "manual",
                updatedAt: now
            });
        } else {
            await db.currencyRate.add({
                id: crypto.randomUUID(),
                kodeAsal,
                kodeTujuan: "IDR",
                rate,
                tanggalUpdate: now,
                sumber: "manual",
                createdAt: now,
                updatedAt: now
            });
        }

        await logSistem("INFO", "CURRENCY", `Rate updated: 1 ${kodeAsal} = Rp ${rate}`);
        return { success: true };
    } catch (error) {
        console.error("updateCurrencyRate error", error);
        return { success: false, error: "Gagal update rate" };
    }
}

// Fetch rates from API (Client-side)
// Note: This exposes the API call to the client network tab. 
// Ideally we proxy, but for static export this is acceptable if the key isn't strictly secret server-side secret
// or if the user provides the key.
export async function fetchLiveRates(apiKey: string) {
    try {
        const response = await fetch(
            `https://currencyapi.net/api/v1/rates?key=${apiKey}&base=USD&output=JSON`
        );

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data = await response.json();

        if (!data.valid) {
            throw new Error("Invalid API response");
        }

        // Convert to IDR base
        const usdToIdr = data.rates.IDR || 15800;
        const now = new Date();

        const updates: Promise<any>[] = [];

        for (const currency of SUPPORTED_CURRENCIES) {
            if (currency.kode === "IDR") continue;

            let rateToIDR: number;
            if (currency.kode === "USD") {
                rateToIDR = usdToIdr;
            } else {
                // 1 [CURRENCY] = x USD => 1 [CURRENCY] = x * usdToIdr IDR
                const currencyToUsd = 1 / (data.rates[currency.kode] || 1);
                rateToIDR = currencyToUsd * usdToIdr;
            }

            const existing = await db.currencyRate.get({ kodeAsal: currency.kode, kodeTujuan: "IDR" });

            if (existing) {
                updates.push(db.currencyRate.update(existing.id, {
                    rate: Math.round(rateToIDR * 100) / 100,
                    tanggalUpdate: now,
                    sumber: "api",
                    updatedAt: now
                }));
            } else {
                updates.push(db.currencyRate.add({
                    id: crypto.randomUUID(),
                    kodeAsal: currency.kode,
                    kodeTujuan: "IDR",
                    rate: Math.round(rateToIDR * 100) / 100,
                    tanggalUpdate: now,
                    sumber: "api",
                    createdAt: now,
                    updatedAt: now
                }));
            }
        }

        await Promise.all(updates);
        await logSistem("INFO", "CURRENCY", `Live rates updated from API (${Object.keys(data.rates).length} currencies)`);

        return { success: true, message: "Rates berhasil diperbarui dari API" };
    } catch (error) {
        await logSistem("ERROR", "CURRENCY", "Gagal fetch live rates", (error as Error).message);
        return { success: false, error: "Gagal mengambil rates dari API: " + (error as Error).message };
    }
}

// Save API Key helper (Settings)
export async function saveCurrencyApiKey(apiKey: string) {
    try {
        const existing = await db.appSetting.get("currency_api_key");
        const now = new Date();
        if (existing) {
            await db.appSetting.update("currency_api_key", { nilai: apiKey, updatedAt: now });
        } else {
            await db.appSetting.add({
                id: crypto.randomUUID(),
                kunci: "currency_api_key",
                nilai: apiKey,
                createdAt: now,
                updatedAt: now
            });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menyimpan API key" };
    }
}

export async function getCurrencyApiKey() {
    try {
        const setting = await db.appSetting.get("currency_api_key");
        return { success: true, data: setting?.nilai || "" };
    } catch (error) {
        return { success: false, data: "" };
    }
}

// Convert a foreign currency amount to IDR
export async function convertToIDR(amount: number, fromCurrency: string, fee: number = 0) {
    try {
        if (fromCurrency === "IDR") {
            return { success: true, data: { result: amount, rate: 1, fee: 0 } };
        }

        const rateRecord = await db.currencyRate
            .filter(r => r.kodeAsal === fromCurrency && r.kodeTujuan === "IDR")
            .first();

        if (!rateRecord) {
            return { success: false, error: `Rate untuk ${fromCurrency} tidak ditemukan` };
        }

        const rate = rateRecord.rate;
        const rawResult = amount * rate;
        const feeAmount = rawResult * (fee / 100);
        const result = rawResult - feeAmount;

        return {
            success: true,
            data: {
                result: Math.round(result),
                rate,
                fee: Math.round(feeAmount)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
