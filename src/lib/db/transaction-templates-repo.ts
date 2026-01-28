import { db, type TemplateTransaksiRecord } from "./app-db";

function generateId() {
    return 'tpl_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export async function getTransactionTemplates() {
    try {
        const templates = await db.templateTransaksi.orderBy("usageCount").reverse().toArray();
        return { success: true, data: templates };
    } catch (error) {
        console.error("getTransactionTemplates error:", error);
        return { success: false, data: [] };
    }
}

export async function createTransactionTemplate(data: {
    nama: string;
    deskripsi: string;
    nominal: number;
    kategori: string;
    tipeTransaksi: string;
    akunId: string;
    icon?: string | null;
    warna?: string | null;
}) {
    try {
        const id = generateId();
        const now = new Date();
        const record: TemplateTransaksiRecord = {
            id,
            ...data,
            usageCount: 0,
            createdAt: now,
            updatedAt: now,
        };
        await db.templateTransaksi.add(record);
        return { success: true, data: record };
    } catch (error) {
        console.error("createTransactionTemplate error:", error);
        return { success: false, error: "Gagal membuat template" };
    }
}

export async function deleteTransactionTemplate(id: string) {
    try {
        await db.templateTransaksi.delete(id);
        return { success: true };
    } catch (error) {
        console.error("deleteTransactionTemplate error:", error);
        return { success: false, error: "Gagal menghapus template" };
    }
}

export async function incrementTemplateUsage(id: string) {
    try {
        await db.templateTransaksi
            .where("id").equals(id)
            .modify(t => { t.usageCount++ });
        return { success: true };
    } catch (error) {
        console.error("incrementTemplateUsage error:", error);
        return { success: false };
    }
}
