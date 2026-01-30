import Dexie, { type Transaction, type Table } from "dexie";
import { db } from "./app-db";
import type {
    SummaryAccountMonthRecord,
    SummaryCategoryMonthRecord,
    SummaryHeatmapDayRecord,
    SummaryMonthRecord,
    TransaksiRecord,
} from "./app-db";

type SummaryDirection = "add" | "remove";

export interface TransactionSummaryInput {
    tanggal: Date | string;
    nominalInt: number;
    kategori: string;
    debitAkunId: string;
    kreditAkunId: string;
    debitAkunTipe?: string | null;
    kreditAkunTipe?: string | null;
}

/**
 * Applies delta changes to summary tables when a transaction is added or removed.
 * 
 * NOTE: For summaryAccountMonth, txCount is incremented for BOTH debit and kredit accounts.
 * This is INTENDED behavior - it tracks how many times each account was involved in transactions,
 * not the total unique transaction count. For global transaction count, use summaryMonth.txCount.
 */
export async function applyTransactionSummaryDelta(
    input: TransactionSummaryInput,
    direction: SummaryDirection,
    tx?: Transaction
) {
    const sign = direction === "add" ? 1 : -1;
    const tanggal = normalizeDate(input.tanggal);
    const monthKey = toMonthKey(tanggal);
    const dayKey = toDayKey(tanggal);
    const nominalInt = input.nominalInt * sign;

    const debitTipe = input.debitAkunTipe ?? (await db.akun.get(input.debitAkunId))?.tipe;
    const kreditTipe = input.kreditAkunTipe ?? (await db.akun.get(input.kreditAkunId))?.tipe;

    const isExpense = debitTipe === "EXPENSE";
    const isIncome = kreditTipe === "INCOME";

    const summaryMonth = getTable<SummaryMonthRecord>("summaryMonth", tx);
    const summaryCategoryMonth = getTable<SummaryCategoryMonthRecord>("summaryCategoryMonth", tx);
    const summaryHeatmapDay = getTable<SummaryHeatmapDayRecord>("summaryHeatmapDay", tx);
    const summaryAccountMonth = getTable<SummaryAccountMonthRecord>("summaryAccountMonth", tx);

    const promises = [
        updateSummaryMonth(summaryMonth, monthKey, {
            totalInDelta: isIncome ? nominalInt : 0,
            totalOutDelta: isExpense ? nominalInt : 0,
            txCountDelta: sign,
        }),
        updateSummaryAccountMonth(summaryAccountMonth, monthKey, input.debitAkunId, {
            deltaDelta: nominalInt,
            txCountDelta: sign,
        }),
        updateSummaryAccountMonth(summaryAccountMonth, monthKey, input.kreditAkunId, {
            deltaDelta: -nominalInt,
            txCountDelta: sign,
        }),
    ];

    if (isExpense) {
        promises.push(
            updateSummaryCategoryMonth(summaryCategoryMonth, monthKey, input.kategori, {
                totalOutDelta: nominalInt,
                txCountDelta: sign,
            })
        );

        promises.push(
            updateSummaryHeatmapDay(summaryHeatmapDay, dayKey, {
                totalOutDelta: nominalInt,
                txCountDelta: sign,
            })
        );
    }

    await Promise.all(promises);
}

export async function applyTransactionSummaryDeltas(
    inputs: TransactionSummaryInput[],
    direction: SummaryDirection,
    tx?: Transaction
) {
    if (inputs.length === 0) return;

    const sign = direction === "add" ? 1 : -1;

    // Aggregation maps
    const monthUpdates = new Map<string, { totalInDelta: number; totalOutDelta: number; txCountDelta: number }>();
    const categoryUpdates = new Map<string, { month: string; kategori: string; totalOutDelta: number; txCountDelta: number }>();
    const heatmapUpdates = new Map<string, { totalOutDelta: number; txCountDelta: number }>();
    const accountUpdates = new Map<string, { month: string; akunId: string; deltaDelta: number; txCountDelta: number }>();

    // Process inputs to aggregate
    for (const input of inputs) {
        const tanggal = normalizeDate(input.tanggal);
        const monthKey = toMonthKey(tanggal);
        const dayKey = toDayKey(tanggal);
        const nominalInt = input.nominalInt * sign;

        // Note: Assume types are provided.
        // If not, we might fall back to individual fetches (slow) or assume caller provides them.
        let debitTipe = input.debitAkunTipe;
        let kreditTipe = input.kreditAkunTipe;

        if (!debitTipe || !kreditTipe) {
            // Fallback for safety, though bulk caller should provide them
            if (!debitTipe) debitTipe = (await db.akun.get(input.debitAkunId))?.tipe;
            if (!kreditTipe) kreditTipe = (await db.akun.get(input.kreditAkunId))?.tipe;
        }

        const isExpense = debitTipe === "EXPENSE";
        const isIncome = kreditTipe === "INCOME";

        // Summary Month
        const m = monthUpdates.get(monthKey) || { totalInDelta: 0, totalOutDelta: 0, txCountDelta: 0 };
        if (isIncome) m.totalInDelta += nominalInt;
        if (isExpense) m.totalOutDelta += nominalInt;
        m.txCountDelta += sign;
        monthUpdates.set(monthKey, m);

        // Summary Category (Only Expense)
        if (isExpense) {
            const catKey = `${monthKey}|${input.kategori}`;
            const c = categoryUpdates.get(catKey) || { month: monthKey, kategori: input.kategori, totalOutDelta: 0, txCountDelta: 0 };
            c.totalOutDelta += nominalInt;
            c.txCountDelta += sign;
            categoryUpdates.set(catKey, c);

            // Heatmap (Only Expense)
            const h = heatmapUpdates.get(dayKey) || { totalOutDelta: 0, txCountDelta: 0 };
            h.totalOutDelta += nominalInt;
            h.txCountDelta += sign;
            heatmapUpdates.set(dayKey, h);
        }

        // Summary Account (Debit)
        const accKeyDebit = `${monthKey}|${input.debitAkunId}`;
        const ad = accountUpdates.get(accKeyDebit) || { month: monthKey, akunId: input.debitAkunId, deltaDelta: 0, txCountDelta: 0 };
        ad.deltaDelta += nominalInt;
        ad.txCountDelta += sign;
        accountUpdates.set(accKeyDebit, ad);

        // Summary Account (Credit)
        const accKeyCredit = `${monthKey}|${input.kreditAkunId}`;
        const ac = accountUpdates.get(accKeyCredit) || { month: monthKey, akunId: input.kreditAkunId, deltaDelta: 0, txCountDelta: 0 };
        ac.deltaDelta -= nominalInt;
        ac.txCountDelta += sign;
        accountUpdates.set(accKeyCredit, ac);
    }

    const summaryMonth = getTable<SummaryMonthRecord>("summaryMonth", tx);
    const summaryCategoryMonth = getTable<SummaryCategoryMonthRecord>("summaryCategoryMonth", tx);
    const summaryHeatmapDay = getTable<SummaryHeatmapDayRecord>("summaryHeatmapDay", tx);
    const summaryAccountMonth = getTable<SummaryAccountMonthRecord>("summaryAccountMonth", tx);

    // Helper to bulk update
    const bulkUpdate = async <T>(
        table: Dexie.Table<T, string>,
        updates: Map<string, any>,
        updater: (existing: T | undefined, upd: any, key: string) => T
    ) => {
        if (updates.size === 0) return;
        const keys = Array.from(updates.keys());
        const existingItems = await table.bulkGet(keys);
        const toPut: T[] = [];

        keys.forEach((key, i) => {
            const existing = existingItems[i];
            const upd = updates.get(key);
            if (upd) {
                toPut.push(updater(existing, upd, key));
            }
        });

        if (toPut.length > 0) {
            await table.bulkPut(toPut);
        }
    };

    // Batch Process Month
    await bulkUpdate(summaryMonth, monthUpdates, (rec, upd, key) => ({
        id: key,
        month: key,
        totalIn: (rec?.totalIn ?? 0) + upd.totalInDelta,
        totalOut: (rec?.totalOut ?? 0) + upd.totalOutDelta,
        net: ((rec?.totalIn ?? 0) + upd.totalInDelta) - ((rec?.totalOut ?? 0) + upd.totalOutDelta),
        txCount: Math.max(0, (rec?.txCount ?? 0) + upd.txCountDelta)
    }));

    // Batch Process Category
    await bulkUpdate(summaryCategoryMonth, categoryUpdates, (rec, upd, key) => ({
        id: key,
        month: upd.month,
        kategori: upd.kategori,
        totalOut: (rec?.totalOut ?? 0) + upd.totalOutDelta,
        txCount: Math.max(0, (rec?.txCount ?? 0) + upd.txCountDelta)
    }));

    // Batch Process Heatmap
    await bulkUpdate(summaryHeatmapDay, heatmapUpdates, (rec, upd, key) => ({
        id: key,
        tanggal: key,
        totalOut: (rec?.totalOut ?? 0) + upd.totalOutDelta,
        txCount: Math.max(0, (rec?.txCount ?? 0) + upd.txCountDelta)
    }));

    // Batch Process Account
    await bulkUpdate(summaryAccountMonth, accountUpdates, (rec, upd, key) => ({
        id: key,
        month: upd.month,
        akunId: upd.akunId,
        delta: (rec?.delta ?? 0) + upd.deltaDelta,
        txCount: Math.max(0, (rec?.txCount ?? 0) + upd.txCountDelta)
    }));
}

export async function applyTransactionUpdateSummaryDelta(params: {
    before: TransactionSummaryInput;
    after: TransactionSummaryInput;
    tx?: Transaction;
}) {
    await applyTransactionSummaryDelta(params.before, "remove", params.tx);
    await applyTransactionSummaryDelta(params.after, "add", params.tx);
}

export function toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function toDayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
    ).padStart(2, "0")}`;
}

export function normalizeDate(input: Date | string): Date {
    if (input instanceof Date) return input;
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getTable<T>(name: string, tx?: Transaction): Table<T, string> {
    if (tx) return tx.table(name) as Table<T, string>;
    return (db as unknown as Record<string, Table<T, string>>)[name];
}

async function updateSummaryMonth(
    table: Table<SummaryMonthRecord, string>,
    monthKey: string,
    delta: { totalInDelta: number; totalOutDelta: number; txCountDelta: number }
) {
    const existing = await table.get(monthKey);
    const totalIn = (existing?.totalIn ?? 0) + delta.totalInDelta;
    const totalOut = (existing?.totalOut ?? 0) + delta.totalOutDelta;
    const txCount = Math.max(0, (existing?.txCount ?? 0) + delta.txCountDelta);
    await table.put({
        id: monthKey,
        month: monthKey,
        totalIn,
        totalOut,
        net: totalIn - totalOut,
        txCount,
    });
}

async function updateSummaryCategoryMonth(
    table: Dexie.Table<SummaryCategoryMonthRecord, string>,
    monthKey: string,
    kategori: string,
    delta: { totalOutDelta: number; txCountDelta: number }
) {
    const id = `${monthKey}|${kategori}`;
    const existing = await table.get(id);
    const totalOut = (existing?.totalOut ?? 0) + delta.totalOutDelta;
    const txCount = Math.max(0, (existing?.txCount ?? 0) + delta.txCountDelta);
    await table.put({
        id,
        month: monthKey,
        kategori,
        totalOut,
        txCount,
    });
}

async function updateSummaryHeatmapDay(
    table: Dexie.Table<SummaryHeatmapDayRecord, string>,
    dayKey: string,
    delta: { totalOutDelta: number; txCountDelta: number }
) {
    const existing = await table.get(dayKey);
    const totalOut = (existing?.totalOut ?? 0) + delta.totalOutDelta;
    const txCount = Math.max(0, (existing?.txCount ?? 0) + delta.txCountDelta);
    await table.put({
        id: dayKey,
        tanggal: dayKey,
        totalOut,
        txCount,
    });
}

async function updateSummaryAccountMonth(
    table: Dexie.Table<SummaryAccountMonthRecord, string>,
    monthKey: string,
    akunId: string,
    delta: { deltaDelta: number; txCountDelta: number }
) {
    const id = `${monthKey}|${akunId}`;
    const existing = await table.get(id);
    const deltaValue = (existing?.delta ?? 0) + delta.deltaDelta;
    const txCount = Math.max(0, (existing?.txCount ?? 0) + delta.txCountDelta);
    await table.put({
        id,
        month: monthKey,
        akunId,
        delta: deltaValue,
        txCount,
    });
}

export function toSummaryInput(tx: TransaksiRecord, akunTypes: { debit?: string; kredit?: string }) {
    return {
        tanggal: tx.tanggal,
        nominalInt: tx.nominalInt,
        kategori: tx.kategori,
        debitAkunId: tx.debitAkunId,
        kreditAkunId: tx.kreditAkunId,
        debitAkunTipe: akunTypes.debit ?? null,
        kreditAkunTipe: akunTypes.kredit ?? null,
    } satisfies TransactionSummaryInput;
}


export async function getSummaryMonth(monthKey: string) {
    return await db.summaryMonth.get(monthKey);
}

export async function getSummaryCategoryMonth(monthKey: string) {
    return await db.summaryCategoryMonth.where("month").equals(monthKey).toArray();
}

export async function getSummaryHeatmap(dateFrom: Date, dateTo: Date) {
    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
        console.error("Invalid dates in getSummaryHeatmap", { dateFrom, dateTo });
        return [];
    }
    const startKey = toDayKey(dateFrom);
    const endKey = toDayKey(dateTo);
    console.debug("getSummaryHeatmap range", {
        dateFrom,
        dateTo,
        startKey,
        endKey,
    });
    // Ensure keys are valid strings
    if (startKey.includes("NaN") || endKey.includes("NaN")) {
        console.error("Invalid date keys in getSummaryHeatmap", { startKey, endKey });
        return [];
    }
    // Fallback to filter
    return await db.summaryHeatmapDay
        .filter(s => s.tanggal >= startKey && s.tanggal <= endKey)
        .toArray();
}

export async function getSummaryAccountMonth(monthKey: string) {
    return await db.summaryAccountMonth.where("month").equals(monthKey).toArray();
}
