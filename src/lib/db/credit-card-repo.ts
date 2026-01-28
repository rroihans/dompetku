
import { db } from "./app-db";
import { getBillingPeriod, getDueDateInfo, calculateMinimumPayment, calculateLateFee } from "@/lib/decimal-utils";
import { Money } from "@/lib/money";
import { mapAccountToDTO } from "@/lib/account-dto"; // Ensure this is client-safe

// Helper for local logging (duplicating to avoid import issues or circular deps)
async function logSistem(level: string, context: string, message: string, detail?: string) {
    try {
        await db.logSistem.add({
            id: crypto.randomUUID(),
            level,
            modul: context,
            pesan: message,
            stackTrace: detail,
            createdAt: new Date()
        });
    } catch (e) { console.error(e); }
}

// Re-export interface
export interface PaymentCalculation {
    fullPayment: number
    minimumPayment: number
    lateFee: number
    breakdown: {
        purchases: number
        installments: number
        fees: number
        previousBalance: number
    }
    billingPeriod: { start: Date; end: Date }
    dueDate: Date
    daysUntilDue: number
    isPastDue: boolean
    isValid: boolean
    validationError?: string
}

const FEE_CATEGORIES = ["Biaya", "Denda", "Admin", "Bunga", "Late Fee"];

export async function calculateCreditCardPayment(akunId: string): Promise<PaymentCalculation> {
    try {
        const akun = await db.akun.get(akunId);

        if (!akun) {
            return createEmptyCalculation("Akun tidak ditemukan");
        }

        // Basic DTO needed? Not really, we just need fields.

        // Validations
        if (akun.tipe !== "CREDIT_CARD") return createEmptyCalculation("Akun bukan kartu kredit");
        // Check mandatory fields
        const missing = [];
        if (akun.isSyariah === undefined) missing.push("Type");
        if (!akun.billingDate) missing.push("billingDate");
        if (!akun.dueDate) missing.push("dueDate");
        if (!akun.minPaymentFixedInt && akun.minPaymentFixedInt !== 0) missing.push("minPayment"); // Check Int field

        // Dexie returns undefined for missing optional fields? 
        // We should check closely.
        if (!akun.billingDate || !akun.dueDate) {
            return createEmptyCalculation("Konfigurasi tanggal billing/jatuh tempo belum lengkap");
        }

        const saldoSekarangFloat = Money.toFloat(akun.saldoSekarangInt);

        const billingPeriod = getBillingPeriod(akun.billingDate);
        const dueDateInfo = getDueDateInfo(akun.dueDate, akun.billingDate);

        // Fetch Transactions
        const transactions = await db.transaksi
            .where("kreditAkunId").equals(akunId)
            .filter(tx => tx.tanggal >= billingPeriod.start && tx.tanggal <= billingPeriod.end)
            .toArray();

        // Categorize
        let purchases = 0;
        let installments = 0;
        let fees = 0;

        for (const tx of transactions) {
            const nominal = Money.toFloat(tx.nominalInt);

            if (tx.rencanaCicilanId) {
                installments += nominal;
                continue;
            }

            const isFee = FEE_CATEGORIES.some(cat => tx.kategori.toLowerCase().includes(cat.toLowerCase()));
            if (isFee) {
                fees += nominal;
                continue;
            }

            purchases += nominal;
        }

        // Logic matches server action
        const currentDebt = saldoSekarangFloat < 0 ? Math.abs(saldoSekarangFloat) : 0;
        const thisMonthTotal = purchases + installments + fees;
        const previousBalance = Math.max(0, currentDebt - thisMonthTotal);

        const fullPayment = currentDebt;

        const minPaymentFixedFloat = akun.minPaymentFixedInt ? Money.toFloat(akun.minPaymentFixedInt) : 50000;
        const minimumPayment = calculateMinimumPayment(
            fullPayment,
            akun.minPaymentPercent || 5,
            minPaymentFixedFloat
        );

        const daysPastDue = dueDateInfo.isPastDue ? Math.abs(dueDateInfo.daysUntilDue) : 0;
        const lateFee = calculateLateFee(fullPayment, akun.isSyariah || false, daysPastDue);

        return {
            fullPayment,
            minimumPayment,
            lateFee,
            breakdown: {
                purchases,
                installments,
                fees,
                previousBalance
            },
            billingPeriod,
            dueDate: dueDateInfo.dueDateTime,
            daysUntilDue: dueDateInfo.daysUntilDue,
            isPastDue: dueDateInfo.isPastDue,
            isValid: true
        };

    } catch (error) {
        console.error("calculateCreditCardPayment error", error);
        return createEmptyCalculation("Gagal menghitung tagihan");
    }
}

function createEmptyCalculation(error: string): PaymentCalculation {
    return {
        fullPayment: 0,
        minimumPayment: 0,
        lateFee: 0,
        breakdown: { purchases: 0, installments: 0, fees: 0, previousBalance: 0 },
        billingPeriod: { start: new Date(), end: new Date() },
        dueDate: new Date(),
        daysUntilDue: 0,
        isPastDue: false,
        isValid: false,
        validationError: error
    };
}

export async function payCreditCardBill(
    akunId: string,
    amount: number,
    sourceId: string,
    type: "FULL" | "MINIMUM" | "CUSTOM" = "CUSTOM"
) {
    try {
        if (amount <= 0) return { success: false, error: "Nominal tidak valid" };

        const ccAccount = await db.akun.get(akunId);
        if (!ccAccount || ccAccount.tipe !== "CREDIT_CARD") return { success: false, error: "Bukan akun kartu kredit" };

        const sourceAccount = await db.akun.get(sourceId);
        if (!sourceAccount) return { success: false, error: "Akun sumber tidak ditemukan" };

        const amountVal = Number(Money.fromFloat(amount));

        // Transaction
        await db.transaction('rw', db.transaksi, db.akun, async () => {
            await db.transaksi.add({
                id: crypto.randomUUID(),
                deskripsi: `Pembayaran Kartu Kredit (${type})`,
                nominalInt: amountVal,
                kategori: "Pembayaran Tagihan",
                debitAkunId: akunId,
                kreditAkunId: sourceId,
                tanggal: new Date(),
                catatan: `Payment Type: ${type}`,
                createdAt: new Date()
            });

            // Debit CC (Increases balance, reduces debt)
            // CC Balance is usually Negative for Debt.
            // Payment (Debit) -> Increases Balance (towards 0 or positive).
            const ccNew = ccAccount.saldoSekarangInt + amountVal;
            await db.akun.update(akunId, { saldoSekarangInt: ccNew, updatedAt: new Date() });

            // Credit Source (Decreases balance)
            const sourceNew = sourceAccount.saldoSekarangInt - amountVal;
            await db.akun.update(sourceId, { saldoSekarangInt: sourceNew, updatedAt: new Date() });
        });

        await logSistem("INFO", "CREDIT_CARD", `Pembayaran CC: Rp ${amount.toLocaleString('id-ID')}`);

        return { success: true, message: "Pembayaran berhasil dicatat" };

    } catch (error) {
        console.error("payCreditCardBill error", error);
        return { success: false, error: "Gagal memproses pembayaran" };
    }
}

export async function getCreditCardDetail(akunId: string) {
    try {
        const akun = await db.akun.get(akunId);
        if (!akun || akun.tipe !== "CREDIT_CARD") {
            return { success: false, error: "Akun kartu kredit tidak ditemukan" };
        }

        // Map to DTO if needed using shared mapper
        // const mapped = ...
        // Simplified return for now as mapAccountToDTO expects Prisma object with specific relations
        // We might need to construct a similar object or update mapper.

        // Assuming client components handle the Dexie record structure fine or we adapt.
        // But `mapAccountToDTO` is imported? Let's check if it works with Dexie objects.
        // Often DTO mappers expect dates as Date objects, which Dexie provides.
        // It might expect BigInts as BigInts.

        const mapped = mapAccountToDTO(akun as any); // Type assertion if needed
        return { success: true, data: mapped };
    } catch (err) {
        return { success: false, error: "Gagal mengambil detail" };
    }
}
