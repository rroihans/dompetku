import Dexie from "dexie";
import { db } from "./app-db";
import { Money } from "@/lib/money";
import { TransaksiSchema } from "@/lib/validations/transaksi";
import type { ServerActionResult } from "@/types";
import type { TransaksiFilter } from "@/lib/transaksi-utils";
import type { AkunRecord, TransaksiRecord } from "./app-db";
import { applyTransactionSummaryDelta, applyTransactionUpdateSummaryDelta } from "./summary";
import { MappedTransaksi } from "@/types/transaksi";

const PAGE_SIZE = 25;
const LARGE_TX_THRESHOLD = 10_000_000;

interface SimpleTransaksiData {
    nominal: number;
    kategori: string;
    akunId: string;
    tipeTransaksi: "KELUAR" | "MASUK";
    deskripsi?: string;
    tanggal?: Date;
    idempotencyKey?: string;
    rencanaCicilanId?: string;
}

export async function getTransaksi(filters: TransaksiFilter = {}) {
    const {
        page = 1,
        sort = "tanggal",
        sortDir = "desc",
        akunId,
        search,
        kategori,
        tipe,
        dateFrom,
        dateTo,
        minNominal,
        maxNominal,
    } = filters;

    const parsedStart = dateFrom ? new Date(dateFrom) : null;
    const parsedEnd = dateTo ? new Date(dateTo) : null;
    const startDate = parsedStart && !isNaN(parsedStart.getTime()) ? parsedStart : null;
    const endDate = parsedEnd && !isNaN(parsedEnd.getTime()) ? parsedEnd : null;
    if ((dateFrom && !startDate) || (dateTo && !endDate)) {
        console.warn("getTransaksi invalid date filter", {
            dateFrom,
            dateTo,
            parsedStart,
            parsedEnd,
        });
    }
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const minNominalInt = minNominal ? Money.fromFloat(minNominal) : null;
    const maxNominalInt = maxNominal ? Money.fromFloat(maxNominal) : null;

    console.debug("getTransaksi filters", {
        page,
        sort,
        sortDir,
        akunId,
        search,
        kategori,
        tipe,
        dateFrom,
        dateTo,
        startDate,
        endDate,
        minNominal,
        maxNominal,
        minNominalInt,
        maxNominalInt,
    });

    const akunMap = await getAccountMap();

    let collection: Dexie.Collection<TransaksiRecord, string>;

    // 1. Base Collection & Sorting
    let sortIndex = sort;
    if (sort === "nominal") sortIndex = "nominalInt";

    // Optimized date range filtering when sorting by date
    if (sort === "tanggal") {
        if (startDate || endDate) {
            const start = startDate ?? new Date(0);
            const end = endDate ?? new Date(8640000000000000);
            // Use index range scan
            collection = db.transaksi.where("tanggal").between(start, end, true, true);
        } else {
            collection = db.transaksi.orderBy("tanggal");
        }
    } else {
        // Fallback to simple orderBy
        if (sortIndex === "nominalInt") {
            collection = db.transaksi.orderBy("nominalInt");
        } else if (sortIndex === "kategori") {
            collection = db.transaksi.orderBy("kategori");
        } else {
            collection = db.transaksi.orderBy("id");
        }
    }

    if (sortDir === "desc") {
        collection = collection.reverse();
    }

    // 2. Apply Filters (Chained on Collection)

    // Manual date filter if we couldn't use index range (e.g. sorting by other field)
    if (sort !== "tanggal" && (startDate || endDate)) {
        const start = startDate ?? new Date(0);
        const end = endDate ?? new Date(8640000000000000);
        collection = collection.filter(tx => tx.tanggal >= start && tx.tanggal <= end);
    }

    if (akunId) {
        const akunIds = Array.isArray(akunId) ? akunId : [akunId];
        collection = collection.filter(
            (tx) => akunIds.includes(tx.debitAkunId) || akunIds.includes(tx.kreditAkunId)
        );
    }

    if (search) {
        const lower = search.toLowerCase();
        collection = collection.filter((tx) => {
            return (
                tx.deskripsi.toLowerCase().includes(lower) ||
                tx.kategori.toLowerCase().includes(lower) ||
                (tx.catatan ?? "").toLowerCase().includes(lower) ||
                (akunMap.get(tx.debitAkunId)?.nama.toLowerCase().includes(lower) ?? false) ||
                (akunMap.get(tx.kreditAkunId)?.nama.toLowerCase().includes(lower) ?? false)
            );
        });
    }

    if (kategori) {
        const kategoriList = Array.isArray(kategori) ? kategori : [kategori];
        collection = collection.filter((tx) => kategoriList.includes(tx.kategori));
    }

    if (tipe === "expense") {
        collection = collection.filter((tx) => akunMap.get(tx.debitAkunId)?.tipe === "EXPENSE");
    }

    if (tipe === "income") {
        collection = collection.filter((tx) => akunMap.get(tx.kreditAkunId)?.tipe === "INCOME");
    }

    if (minNominalInt !== null || maxNominalInt !== null) {
        collection = collection.filter((tx) => {
            if (minNominalInt !== null && tx.nominalInt < minNominalInt) return false;
            if (maxNominalInt !== null && tx.nominalInt > maxNominalInt) return false;
            return true;
        });
    }

    // 3. Pagination & Data Fetching
    // Note: Reverting to offset/limit because primaryKeys() was slow in benchmark (fake-indexeddb).
    // In real DB, offset/limit on index is efficient.
    // However, count() with filter is slow.
    // Let's assume we use offset/limit but optimize count if possible.

    const total = await collection.count();
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const startIndex = (page - 1) * PAGE_SIZE;

    // Use clone() to avoid mutating collection used for count/runningBalance if implemented that way,
    // although count() is safe. But offset/limit modify the collection.
    const pageItems = await collection.clone().offset(startIndex).limit(PAGE_SIZE).toArray();

    const result = pageItems.map((tx) => ({
        ...mapTransaksi(tx, akunMap),
        saldoSetelah: undefined as number | undefined,
    }));

    if (akunId && !Array.isArray(akunId) && sort === "tanggal") {
        const akun = akunMap.get(akunId);
        if (akun) {
            let runningBalanceInt = akun.saldoSekarangInt;
            if (startIndex > 0) {
                // Optimization: If deep pagination in descending order, calculate forward from initial balance
                // instead of backward from current balance.
                if (sortDir === "desc" && startIndex > total / 2) {
                    runningBalanceInt = akun.saldoAwalInt;
                    const limitCount = Math.max(0, total - startIndex);

                    // collection is Desc. Reverse to get Asc (Oldest First).
                    await collection.clone().reverse().limit(limitCount).each((item) => {
                        if (item.debitAkunId === akunId) runningBalanceInt += item.nominalInt;
                        else if (item.kreditAkunId === akunId) runningBalanceInt -= item.nominalInt;
                    });
                } else {
                    // Efficiently iterate skipped items to calculate running balance (Backward from Current)
                    await collection.clone().limit(startIndex).each((skipped) => {
                        if (skipped.debitAkunId === akunId) runningBalanceInt -= skipped.nominalInt;
                        else if (skipped.kreditAkunId === akunId) runningBalanceInt += skipped.nominalInt;
                    });
                }
            }

            for (const item of result) {
                item.saldoSetelah = Money.toFloat(runningBalanceInt);
                if (item.debitAkun?.id === akunId) runningBalanceInt -= Money.fromFloat(item.nominal);
                else if (item.kreditAkun?.id === akunId) runningBalanceInt += Money.fromFloat(item.nominal);
            }
        }
    }

    return {
        data: result,
        pagination: {
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages,
        },
    };
}

export async function createTransaksiSimple(
    data: SimpleTransaksiData
): Promise<ServerActionResult<MappedTransaksi>> {
    const validation = TransaksiSchema.safeParse({
        ...data,
        tanggal: data.tanggal || new Date(),
    });

    if (!validation.success) {
        return {
            success: false,
            error: "Data transaksi tidak valid",
            errors: validation.error.flatten().fieldErrors,
        };
    }

    if (data.idempotencyKey) {
        const existing = await db.transaksi
            .where("idempotencyKey")
            .equals(data.idempotencyKey)
            .first();
        if (existing) {
            const akunMap = await getAccountMap();
            return { success: true, data: mapTransaksi(existing, akunMap), duplicated: true };
        }
    }

    const kategoriTipe = data.tipeTransaksi === "KELUAR" ? "EXPENSE" : "INCOME";
    const kategoriAkun = await getOrCreateKategoriAkun(data.kategori, kategoriTipe);

    const debitAkunId = data.tipeTransaksi === "KELUAR" ? kategoriAkun.id : data.akunId;
    const kreditAkunId = data.tipeTransaksi === "KELUAR" ? data.akunId : kategoriAkun.id;

    const nominalInt = Money.fromFloat(data.nominal);
    const transaksiId = createId();
    const transaksi: TransaksiRecord = {
        id: transaksiId,
        deskripsi: data.deskripsi || data.kategori,
        nominalInt,
        kategori: data.kategori,
        debitAkunId,
        kreditAkunId,
        tanggal: data.tanggal || new Date(),
        idempotencyKey: data.idempotencyKey,
        rencanaCicilanId: data.rencanaCicilanId,
        createdAt: new Date(),
    };

    const akunMap = await getAccountMap();
    const debitType = akunMap.get(debitAkunId)?.tipe ?? kategoriAkun.tipe;
    const kreditType = akunMap.get(kreditAkunId)?.tipe ?? kategoriAkun.tipe;

    await db.transaction(
        "rw",
        [
            db.transaksi,
            db.akun,
            db.summaryMonth,
            db.summaryCategoryMonth,
            db.summaryHeatmapDay,
            db.summaryAccountMonth,
            db.notification,
        ],
        async () => {
            await db.transaksi.add(transaksi);
            await updateAccountBalancesLocal(debitAkunId, kreditAkunId, nominalInt);
            await applyTransactionSummaryDelta(
                {
                    tanggal: transaksi.tanggal,
                    nominalInt: transaksi.nominalInt,
                    kategori: transaksi.kategori,
                    debitAkunId: transaksi.debitAkunId,
                    kreditAkunId: transaksi.kreditAkunId,
                    debitAkunTipe: debitType,
                    kreditAkunTipe: kreditType,
                },
                "add",
                Dexie.currentTransaction ?? undefined
            );

            if (data.nominal >= LARGE_TX_THRESHOLD) {
                await createNotification({
                    type: "LARGE_TX",
                    title: "💰 Transaksi Besar Terdeteksi",
                    message: `Transaksi "${data.deskripsi || data.kategori}" sebesar Rp ${data.nominal.toLocaleString(
                        "id-ID"
                    )} telah dicatat.`,
                    severity: "INFO",
                    actionUrl: "/transaksi",
                });
            }
        }
    );

    const updatedAkunMap = await getAccountMap();
    return { success: true, data: mapTransaksi(transaksi, updatedAkunMap) };
}

export async function createTransaksi(data: {
    deskripsi: string;
    nominal: number;
    kategori: string;
    debitAkunId: string;
    kreditAkunId: string;
    tanggal?: Date;
    catatan?: string;
    idempotencyKey?: string;
    rencanaCicilanId?: string;
}): Promise<ServerActionResult<MappedTransaksi>> {
    if (data.nominal <= 0) {
        return { success: false, error: "Nominal harus lebih dari 0" };
    }

    if (data.idempotencyKey) {
        const existing = await db.transaksi
            .where("idempotencyKey")
            .equals(data.idempotencyKey)
            .first();
        if (existing) {
            const akunMap = await getAccountMap();
            return { success: true, data: mapTransaksi(existing, akunMap), duplicated: true };
        }
    }

    const nominalInt = Money.fromFloat(data.nominal);
    const transaksiId = createId();
    const transaksi: TransaksiRecord = {
        id: transaksiId,
        deskripsi: data.deskripsi,
        nominalInt,
        kategori: data.kategori,
        debitAkunId: data.debitAkunId,
        kreditAkunId: data.kreditAkunId,
        tanggal: data.tanggal || new Date(),
        catatan: data.catatan,
        idempotencyKey: data.idempotencyKey,
        rencanaCicilanId: data.rencanaCicilanId,
        createdAt: new Date(),
    };

    const akunMap = await getAccountMap();
    const debitType = akunMap.get(data.debitAkunId)?.tipe ?? null;
    const kreditType = akunMap.get(data.kreditAkunId)?.tipe ?? null;

    await db.transaction(
        "rw",
        [
            db.transaksi,
            db.akun,
            db.summaryMonth,
            db.summaryCategoryMonth,
            db.summaryHeatmapDay,
            db.summaryAccountMonth,
        ],
        async () => {
            await db.transaksi.add(transaksi);
            await updateAccountBalancesLocal(data.debitAkunId, data.kreditAkunId, nominalInt);
            await applyTransactionSummaryDelta(
                {
                    tanggal: transaksi.tanggal,
                    nominalInt: transaksi.nominalInt,
                    kategori: transaksi.kategori,
                    debitAkunId: transaksi.debitAkunId,
                    kreditAkunId: transaksi.kreditAkunId,
                    debitAkunTipe: debitType,
                    kreditAkunTipe: kreditType,
                },
                "add",
                Dexie.currentTransaction ?? undefined
            );
        }
    );

    const updatedAkunMap = await getAccountMap();
    return { success: true, data: mapTransaksi(transaksi, updatedAkunMap) };
}

export async function updateTransaksi(
    id: string,
    data: {
        deskripsi?: string;
        kategori?: string;
        catatan?: string;
        nominal?: number;
        tanggal?: Date;
    }
): Promise<ServerActionResult<MappedTransaksi>> {
    const existing = await db.transaksi.get(id);
    if (!existing) return { success: false, error: "Transaksi tidak ditemukan" };

    const updated: TransaksiRecord = {
        ...existing,
        deskripsi: data.deskripsi ?? existing.deskripsi,
        kategori: data.kategori ?? existing.kategori,
        catatan: data.catatan ?? existing.catatan,
        nominalInt: data.nominal !== undefined ? Money.fromFloat(data.nominal) : existing.nominalInt,
        tanggal: data.tanggal ?? existing.tanggal,
    };

    const akunMap = await getAccountMap();
    const debitType = akunMap.get(updated.debitAkunId)?.tipe ?? null;
    const kreditType = akunMap.get(updated.kreditAkunId)?.tipe ?? null;

    await db.transaction(
        "rw",
        [
            db.transaksi,
            db.akun,
            db.summaryMonth,
            db.summaryCategoryMonth,
            db.summaryHeatmapDay,
            db.summaryAccountMonth,
        ],
        async () => {
            if (existing.nominalInt !== updated.nominalInt) {
                const diff = updated.nominalInt - existing.nominalInt;
                await updateAccountBalancesLocal(updated.debitAkunId, updated.kreditAkunId, diff);
            }

            await db.transaksi.put(updated);

            await applyTransactionUpdateSummaryDelta({
                before: {
                    tanggal: existing.tanggal,
                    nominalInt: existing.nominalInt,
                    kategori: existing.kategori,
                    debitAkunId: existing.debitAkunId,
                    kreditAkunId: existing.kreditAkunId,
                    debitAkunTipe: debitType,
                    kreditAkunTipe: kreditType,
                },
                after: {
                    tanggal: updated.tanggal,
                    nominalInt: updated.nominalInt,
                    kategori: updated.kategori,
                    debitAkunId: updated.debitAkunId,
                    kreditAkunId: updated.kreditAkunId,
                    debitAkunTipe: debitType,
                    kreditAkunTipe: kreditType,
                },
                tx: Dexie.currentTransaction ?? undefined,
            });
        }
    );

    const updatedAkunMap = await getAccountMap();
    return { success: true, data: mapTransaksi(updated, updatedAkunMap) };
}

export async function deleteTransaksi(id: string): Promise<ServerActionResult<void>> {
    const existing = await db.transaksi.get(id);
    if (!existing) return { success: false, error: "Transaksi tidak ditemukan" };

    const akunMap = await getAccountMap();
    const debitType = akunMap.get(existing.debitAkunId)?.tipe ?? null;
    const kreditType = akunMap.get(existing.kreditAkunId)?.tipe ?? null;

    await db.transaction(
        "rw",
        [
            db.transaksi,
            db.akun,
            db.summaryMonth,
            db.summaryCategoryMonth,
            db.summaryHeatmapDay,
            db.summaryAccountMonth,
        ],
        async () => {
            await db.transaksi.delete(id);
            await updateAccountBalancesLocal(existing.debitAkunId, existing.kreditAkunId, -existing.nominalInt);
            await applyTransactionSummaryDelta(
                {
                    tanggal: existing.tanggal,
                    nominalInt: existing.nominalInt,
                    kategori: existing.kategori,
                    debitAkunId: existing.debitAkunId,
                    kreditAkunId: existing.kreditAkunId,
                    debitAkunTipe: debitType,
                    kreditAkunTipe: kreditType,
                },
                "remove",
                Dexie.currentTransaction ?? undefined
            );
        }
    );

    return { success: true };
}

async function updateAccountBalancesLocal(debitAkunId: string, kreditAkunId: string, nominalInt: number) {
    await Promise.all([
        db.akun.where("id").equals(debitAkunId).modify((a) => { a.saldoSekarangInt += nominalInt }),
        db.akun.where("id").equals(kreditAkunId).modify((a) => { a.saldoSekarangInt -= nominalInt }),
    ]);
}

async function getOrCreateKategoriAkun(kategori: string, tipe: "EXPENSE" | "INCOME") {
    const namaAkun = `[${tipe}] ${kategori}`;
    const existing = await db.akun.where("nama").equals(namaAkun).filter((a) => a.tipe === tipe).first();
    if (existing) return existing;

    const now = new Date();
    const akun: AkunRecord = {
        id: createId(),
        nama: namaAkun,
        tipe,
        saldoAwalInt: 0,
        saldoSekarangInt: 0,
        createdAt: now,
        updatedAt: now,
    };
    await db.akun.add(akun);
    return akun;
}

async function createNotification(data: {
    type: string;
    title: string;
    message: string;
    severity: "INFO" | "WARNING" | "ERROR";
    actionUrl?: string;
}) {
    await db.notification.add({
        id: createId(),
        type: data.type,
        title: data.title,
        message: data.message,
        severity: data.severity,
        actionUrl: data.actionUrl,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
}

function mapTransaksi(tx: TransaksiRecord, akunMap: Map<string, AkunRecord>) {
    const debitAkun = akunMap.get(tx.debitAkunId);
    const kreditAkun = akunMap.get(tx.kreditAkunId);
    return {
        ...tx,
        catatan: tx.catatan ?? null,
        nominal: Money.toFloat(tx.nominalInt),
        debitAkun: debitAkun
            ? { id: debitAkun.id, nama: debitAkun.nama, tipe: debitAkun.tipe, isSyariah: debitAkun.isSyariah ?? undefined }
            : null,
        kreditAkun: kreditAkun
            ? { id: kreditAkun.id, nama: kreditAkun.nama, tipe: kreditAkun.tipe, isSyariah: kreditAkun.isSyariah ?? undefined }
            : null,
    };
}

async function getAccountMap() {
    const akunList = await db.akun.toArray();
    return new Map(akunList.map((a) => [a.id, a]));
}

export function createId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

