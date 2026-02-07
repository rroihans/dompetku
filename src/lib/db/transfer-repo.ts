import Dexie from "dexie";
import { db } from "./app-db";
import { Money } from "@/lib/money";
import { applyTransactionSummaryDelta } from "./summary";

interface TransferData {
    dariAkunId: string;
    keAkunId: string;
    nominal: number;
    catatan?: string;
    tanggal?: Date;
    idempotencyKey?: string;
}

import type { ServerActionResult } from "@/types";
import type { TransaksiRecord } from "./app-db";

export async function createTransfer(data: TransferData): Promise<ServerActionResult<TransaksiRecord>> {
    if (!data.dariAkunId || !data.keAkunId) {
        return { success: false, error: "Akun asal dan tujuan wajib diisi" };
    }
    if (data.dariAkunId === data.keAkunId) {
        return { success: false, error: "Akun asal dan tujuan tidak boleh sama" };
    }
    if (data.nominal <= 0) {
        return { success: false, error: "Nominal harus lebih dari 0" };
    }

    if (data.idempotencyKey) {
        const existing = await db.transaksi.where("idempotencyKey").equals(data.idempotencyKey).first();
        if (existing) return { success: true, data: existing, duplicated: true };
    }

    const dariAkun = await db.akun.get(data.dariAkunId);
    const keAkun = await db.akun.get(data.keAkunId);
    if (!dariAkun || !keAkun) return { success: false, error: "Akun tidak ditemukan" };

    const nominalInt = Money.fromFloat(data.nominal);
    const deskripsi = data.catatan || `Transfer ke ${keAkun.nama}`;
    const transaksi = {
        id: createId(),
        deskripsi,
        nominalInt,
        kategori: "Transfer",
        debitAkunId: data.keAkunId,
        kreditAkunId: data.dariAkunId,
        tanggal: data.tanggal || new Date(),
        catatan: `Transfer dari ${dariAkun.nama} ke ${keAkun.nama}`,
        idempotencyKey: data.idempotencyKey,
        createdAt: new Date(),
    };

    await db.transaction(
        "rw",
        [db.transaksi, db.akun, db.summaryMonth, db.summaryCategoryMonth, db.summaryHeatmapDay, db.summaryAccountMonth],
        async () => {
            await db.transaksi.add(transaksi);
            await db.akun.update(data.keAkunId, { saldoSekarangInt: (keAkun.saldoSekarangInt ?? 0) + nominalInt });
            await db.akun.update(data.dariAkunId, { saldoSekarangInt: (dariAkun.saldoSekarangInt ?? 0) - nominalInt });

            await applyTransactionSummaryDelta(
                {
                    tanggal: transaksi.tanggal,
                    nominalInt: transaksi.nominalInt,
                    kategori: transaksi.kategori,
                    debitAkunId: transaksi.debitAkunId,
                    kreditAkunId: transaksi.kreditAkunId,
                    debitAkunTipe: keAkun.tipe,
                    kreditAkunTipe: dariAkun.tipe,
                },
                "add",
                Dexie.currentTransaction ?? undefined
            );
        }
    );

    return { success: true, data: transaksi };
}

function createId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

