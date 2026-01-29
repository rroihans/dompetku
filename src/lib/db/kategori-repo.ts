import { db } from "./app-db";
import type { KategoriRecord } from "./app-db";
import { nanoid } from "nanoid";

export type { KategoriRecord };

// =========================
// Default Categories (PSAK Indonesia inspired)
// =========================

export const DEFAULT_CATEGORIES: Omit<KategoriRecord, "id" | "createdAt" | "updatedAt">[] = [
    // INCOME (Pendapatan)
    { nama: "Gaji", parentId: null, icon: "Banknote", warna: "#10b981", nature: "NEED", show: true, order: 1 },
    { nama: "Bonus", parentId: null, icon: "Gift", warna: "#22c55e", nature: "WANT", show: true, order: 2 },
    { nama: "Investasi", parentId: null, icon: "TrendingUp", warna: "#84cc16", nature: "WANT", show: true, order: 3 },

    // EXPENSE - MUST (Kebutuhan Wajib)
    { nama: "Makanan & Minuman", parentId: null, icon: "Utensils", warna: "#ef4444", nature: "MUST", show: true, order: 10 },
    { nama: "Transportasi", parentId: null, icon: "Car", warna: "#f97316", nature: "MUST", show: true, order: 11 },
    { nama: "Tagihan & Utilitas", parentId: null, icon: "FileText", warna: "#eab308", nature: "MUST", show: true, order: 12 },
    { nama: "Kesehatan", parentId: null, icon: "Heart", warna: "#ec4899", nature: "MUST", show: true, order: 13 },

    // EXPENSE - NEED (Kebutuhan Penting)
    { nama: "Belanja Bulanan", parentId: null, icon: "ShoppingCart", warna: "#3b82f6", nature: "NEED", show: true, order: 20 },
    { nama: "Pendidikan", parentId: null, icon: "GraduationCap", warna: "#6366f1", nature: "NEED", show: true, order: 21 },
    { nama: "Komunikasi", parentId: null, icon: "Smartphone", warna: "#8b5cf6", nature: "NEED", show: true, order: 22 },

    // EXPENSE - WANT (Keinginan)
    { nama: "Hiburan", parentId: null, icon: "Tv", warna: "#a855f7", nature: "WANT", show: true, order: 30 },
    { nama: "Shopping", parentId: null, icon: "ShoppingBag", warna: "#d946ef", nature: "WANT", show: true, order: 31 },
    { nama: "Hobi", parentId: null, icon: "Palette", warna: "#06b6d4", nature: "WANT", show: true, order: 32 },
    { nama: "Travel", parentId: null, icon: "Plane", warna: "#14b8a6", nature: "WANT", show: true, order: 33 },

    // OTHER
    { nama: "Lain-lain", parentId: null, icon: "MoreHorizontal", warna: "#64748b", nature: "NEED", show: true, order: 99 },
];

// =========================
// CRUD Functions
// =========================

export async function getAllKategori(): Promise<KategoriRecord[]> {
    return await db.kategori.orderBy("order").toArray();
}

export async function getKategoriById(id: string): Promise<KategoriRecord | undefined> {
    return await db.kategori.get(id);
}

export async function getKategoriByName(nama: string): Promise<KategoriRecord | undefined> {
    return await db.kategori.where("nama").equals(nama).first();
}

export async function getMainKategori(): Promise<KategoriRecord[]> {
    const all = await db.kategori.orderBy("order").toArray();
    return all.filter(k => k.parentId === null);
}

export async function getSubKategori(parentId: string): Promise<KategoriRecord[]> {
    return await db.kategori.where("parentId").equals(parentId).sortBy("order");
}

export async function createKategori(data: {
    nama: string;
    parentId?: string | null;
    icon: string;
    warna: string;
    nature: string;
    show?: boolean;
    order?: number;
}): Promise<{ success: boolean; data?: KategoriRecord; error?: string }> {
    try {
        // Check duplicate name
        const existing = await getKategoriByName(data.nama);
        if (existing) {
            return { success: false, error: "Kategori dengan nama ini sudah ada" };
        }

        // Validate parent
        if (data.parentId) {
            const parent = await getKategoriById(data.parentId);
            if (!parent) {
                return { success: false, error: "Kategori induk tidak ditemukan" };
            }
            // Prevent nesting beyond 1 level
            if (parent.parentId) {
                return { success: false, error: "Subkategori tidak boleh memiliki sub-subkategori (max depth = 1)" };
            }
        }

        // Auto-generate order if not provided
        let order = data.order;
        if (!order) {
            const maxOrder = await db.kategori.orderBy("order").reverse().first();
            order = (maxOrder?.order ?? 0) + 1;
        }

        const kategori: KategoriRecord = {
            id: nanoid(),
            nama: data.nama,
            parentId: data.parentId ?? null,
            icon: data.icon,
            warna: data.warna,
            nature: data.nature,
            show: data.show ?? true,
            order,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.kategori.add(kategori);
        return { success: true, data: kategori };
    } catch (error: any) {
        console.error("[KATEGORI-REPO] Create error:", error);
        return { success: false, error: error.message || "Gagal membuat kategori" };
    }
}

export async function updateKategori(
    id: string,
    data: Partial<Pick<KategoriRecord, "nama" | "icon" | "warna" | "nature" | "show" | "order">>
): Promise<{ success: boolean; error?: string }> {
    try {
        const existing = await getKategoriById(id);
        if (!existing) {
            return { success: false, error: "Kategori tidak ditemukan" };
        }

        // Check duplicate name if changing name
        if (data.nama && data.nama !== existing.nama) {
            const duplicate = await getKategoriByName(data.nama);
            if (duplicate) {
                return { success: false, error: "Nama kategori sudah digunakan" };
            }
        }

        await db.kategori.update(id, {
            ...data,
            updatedAt: new Date(),
        });

        return { success: true };
    } catch (error: any) {
        console.error("[KATEGORI-REPO] Update error:", error);
        return { success: false, error: error.message || "Gagal update kategori" };
    }
}

export async function deleteKategori(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const kategori = await getKategoriById(id);
        if (!kategori) {
            return { success: false, error: "Kategori tidak ditemukan" };
        }

        // Check if has subcategories
        const subKategori = await getSubKategori(id);
        if (subKategori.length > 0) {
            return { success: false, error: "Tidak dapat menghapus kategori yang memiliki subkategori. Hapus subkategori terlebih dahulu." };
        }

        // Check if used in transactions
        const usedInTx = await db.transaksi.where("kategori").equals(kategori.nama).count();
        if (usedInTx > 0) {
            return { success: false, error: `Kategori digunakan di ${usedInTx} transaksi. Tidak dapat dihapus.` };
        }

        await db.kategori.delete(id);
        return { success: true };
    } catch (error: any) {
        console.error("[KATEGORI-REPO] Delete error:", error);
        return { success: false, error: error.message || "Gagal menghapus kategori" };
    }
}

// =========================
// Migration & Utilities
// =========================

export async function seedDefaultKategori(): Promise<void> {
    const count = await db.kategori.count();
    if (count > 0) {
        console.log("[KATEGORI-REPO] Kategori already seeded, skipping...");
        return;
    }

    console.log("[KATEGORI-REPO] Seeding default categories...");
    const now = new Date();

    for (const cat of DEFAULT_CATEGORIES) {
        await db.kategori.add({
            ...cat,
            id: nanoid(),
            createdAt: now,
            updatedAt: now,
        });
    }

    console.log(`[KATEGORI-REPO] Seeded ${DEFAULT_CATEGORIES.length} categories`);
}

export async function migrateKategoriFromTransactions(): Promise<void> {
    // Get unique kategori from existing transactions
    const uniqueKategori = await db.transaksi
        .orderBy("kategori")
        .uniqueKeys();

    console.log(`[KATEGORI-REPO] Found ${uniqueKategori.length} unique kategori in transactions`);

    for (const kategoriName of uniqueKategori) {
        const nameStr = String(kategoriName);

        // Skip if already exists
        const existing = await getKategoriByName(nameStr);
        if (existing) continue;

        // Auto-create with default settings
        await createKategori({
            nama: nameStr,
            icon: "Tag",
            warna: "#64748b",
            nature: "NEED",
            show: true,
        });
    }

    console.log("[KATEGORI-REPO] Migration complete");
}

export async function autoCreateKategoriIfNotExists(kategoriName: string): Promise<void> {
    const existing = await getKategoriByName(kategoriName);
    if (existing) return;

    await createKategori({
        nama: kategoriName,
        icon: "Tag",
        warna: "#64748b",
        nature: "NEED",
        show: true,
    });

    console.log(`[KATEGORI-REPO] Auto-created kategori: ${kategoriName}`);
}
