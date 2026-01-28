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

    await updateSummaryMonth(summaryMonth, monthKey, {
        totalInDelta: isIncome ? nominalInt : 0,
        totalOutDelta: isExpense ? nominalInt : 0,
        txCountDelta: sign,
    });

    if (isExpense) {
        await updateSummaryCategoryMonth(summaryCategoryMonth, monthKey, input.kategori, {
            totalOutDelta: nominalInt,
            txCountDelta: sign,
        });

        await updateSummaryHeatmapDay(summaryHeatmapDay, dayKey, {
            totalOutDelta: nominalInt,
            txCountDelta: sign,
        });
    }

    await updateSummaryAccountMonth(summaryAccountMonth, monthKey, input.debitAkunId, {
        deltaDelta: nominalInt,
        txCountDelta: sign,
    });

    await updateSummaryAccountMonth(summaryAccountMonth, monthKey, input.kreditAkunId, {
        deltaDelta: -nominalInt,
        txCountDelta: sign,
    });
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
