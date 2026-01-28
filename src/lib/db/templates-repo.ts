import { db } from "./app-db";
import { type AccountTemplateRecord, type TemplateTransaksiRecord } from "./app-db";
import { Money } from "@/lib/money";

// ============================================
// ACCOUNT TEMPLATE (PERBANKAN)
// ============================================

export interface AccountTemplateDTO {
    id: string;
    nama: string;
    tipeAkun: string;
    biayaAdmin: number | null;
    bungaTier: string | null;
    polaTagihan: string;
    tanggalTagihan: number | null;
    deskripsi: string | null;
    isActive: boolean;
}

export async function createAccountTemplate(data: Omit<AccountTemplateDTO, "id"> & { id?: string }) {
    try {
        const template: AccountTemplateRecord = {
            id: data.id || crypto.randomUUID(),
            nama: data.nama,
            tipeAkun: data.tipeAkun,
            biayaAdmin: data.biayaAdmin,
            bungaTier: data.bungaTier || null,
            polaTagihan: data.polaTagihan,
            tanggalTagihan: data.tanggalTagihan || null,
            deskripsi: data.deskripsi || null,
            isActive: data.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.accountTemplate.add(template);
        return { success: true, data: mapAccountTemplateToDTO(template) };
    } catch (error) {
        console.error("createAccountTemplate error", error);
        return { success: false, error: "Gagal membuat account template" };
    }
}

export async function updateAccountTemplate(id: string, data: Partial<AccountTemplateDTO>) {
    try {
        const template = await db.accountTemplate.get(id);
        if (!template) return { success: false, error: "Template tidak ditemukan" };

        const updated: AccountTemplateRecord = {
            ...template,
            ...data,
            updatedAt: new Date(),
        };

        await db.accountTemplate.put(updated);
        return { success: true, data: mapAccountTemplateToDTO(updated) };
    } catch (error) {
        console.error("updateAccountTemplate error", error);
        return { success: false, error: "Gagal update account template" };
    }
}

export async function getAccountTemplates() {
    try {
        const templates = await db.accountTemplate
            .orderBy("nama")
            .toArray();
        return { success: true, data: templates.map(mapAccountTemplateToDTO) };
    } catch (error) {
        console.error("getAccountTemplates error", error);
        return { success: false, data: [] };
    }
}

export async function getActiveAccountTemplates(): Promise<AccountTemplateDTO[]> {
    try {
        const templates = await db.accountTemplate
            .where("isActive")
            .equals(1 as any) // Dexie boolean mapping
            .toArray();

        // Sort manually if needed or use composite index
        return templates
            .sort((a, b) => a.nama.localeCompare(b.nama))
            .map(mapAccountTemplateToDTO);
    } catch (error) {
        console.error("getActiveAccountTemplates error", error);
        return [];
    }
}


export async function deleteAccountTemplate(id: string) {
    try {
        // Soft delete: set isActive to false if there are accounts using it
        const accountsCount = await db.akun.filter(a => a.templateId === id).count();

        if (accountsCount > 0) {
            await db.accountTemplate.update(id, { isActive: false });
        } else {
            await db.accountTemplate.delete(id);
        }

        return { success: true };
    } catch (error) {
        console.error("deleteAccountTemplate error", error);
        return { success: false, error: "Gagal menghapus account template" };
    }
}

export async function toggleAccountTemplateStatus(id: string) {
    try {
        const template = await db.accountTemplate.get(id);
        if (!template) return { success: false, error: "Template tidak ditemukan" };

        await db.accountTemplate.update(id, { isActive: !template.isActive });
        const updated = await db.accountTemplate.get(id);

        return { success: true, data: updated ? mapAccountTemplateToDTO(updated) : null };
    } catch (error) {
        console.error("toggleAccountTemplateStatus error", error);
        return { success: false, error: "Gagal mengubah status template" };
    }
}

function mapAccountTemplateToDTO(t: AccountTemplateRecord): AccountTemplateDTO {
    return {
        id: t.id,
        nama: t.nama,
        tipeAkun: t.tipeAkun,
        biayaAdmin: t.biayaAdmin ?? null,
        bungaTier: t.bungaTier ?? null,
        polaTagihan: t.polaTagihan,
        tanggalTagihan: t.tanggalTagihan ?? null,
        deskripsi: t.deskripsi ?? null,
        isActive: t.isActive,
    };
}


// ============================================
// TEMPLATE TRANSAKSI
// ============================================

export interface TemplateTransaksiDTO {
    id: string;
    nama: string;
    deskripsi: string;
    nominal: number;
    kategori: string;
    tipeTransaksi: string;
    akunId: string;
    icon?: string;
    warna?: string;
    usageCount: number;
}

export async function createTemplate(data: Omit<TemplateTransaksiDTO, "id" | "usageCount">) {
    try {
        const template: TemplateTransaksiRecord = {
            id: crypto.randomUUID(),
            nama: data.nama,
            deskripsi: data.deskripsi,
            nominal: data.nominal,
            kategori: data.kategori,
            tipeTransaksi: data.tipeTransaksi,
            akunId: data.akunId,
            icon: data.icon || null,
            warna: data.warna || null,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.templateTransaksi.add(template);

        return { success: true, data: mapTemplateTransaksiToDTO(template) };
    } catch (error) {
        console.error("createTemplate error", error);
        return { success: false, error: "Gagal membuat template" };
    }
}

export async function getTemplates() {
    try {
        const templates = await db.templateTransaksi
            .orderBy("usageCount")
            .reverse() // desc
            .toArray();

        // Dexie doesn't allow multiple sort fields easily without composite index.
        // We sort by usageCount desc. Secondary sort by nama needs manual.
        templates.sort((a, b) => {
            if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
            return a.nama.localeCompare(b.nama);
        });

        return { success: true, data: templates.map(mapTemplateTransaksiToDTO) };
    } catch (error) {
        console.error("getTemplates error", error);
        return { success: false, data: [] };
    }
}

export async function useTemplate(templateId: string, tanggal?: Date) {
    try {
        return await db.transaction('rw', [db.templateTransaksi, db.akun, db.transaksi], async () => {
            const template = await db.templateTransaksi.get(templateId);
            if (!template) {
                return { success: false, error: "Template tidak ditemukan" };
            }

            // Cari akun expense/income sesuai kategori
            const kategoriNama = template.tipeTransaksi === "KELUAR"
                ? `[EXPENSE] ${template.kategori}`
                : `[INCOME] ${template.kategori}`;

            let kategoriAkun = await db.akun.where("nama").equals(kategoriNama).first();

            if (!kategoriAkun) {
                // Should we create it if not exists? Server action failed if not found.
                // But normally these should exist.
                return { success: false, error: "Kategori tidak ditemukan" };
            }

            const nominalInt = Money.fromFloat(template.nominal);

            const transData = {
                id: crypto.randomUUID(),
                tanggal: tanggal || new Date(),
                deskripsi: template.deskripsi,
                nominalInt: nominalInt,
                kategori: template.kategori,
                debitAkunId: template.tipeTransaksi === "KELUAR" ? kategoriAkun.id : template.akunId,
                kreditAkunId: template.tipeTransaksi === "KELUAR" ? template.akunId : kategoriAkun.id,
                idempotencyKey: `template-${templateId}-${Date.now()}`,
                createdAt: new Date(),
            };

            await db.transaksi.add(transData);

            // Update saldo akun
            const akun = await db.akun.get(template.akunId);
            if (akun) {
                if (template.tipeTransaksi === "KELUAR") {
                    await db.akun.update(template.akunId, { saldoSekarangInt: akun.saldoSekarangInt - nominalInt });
                } else {
                    await db.akun.update(template.akunId, { saldoSekarangInt: akun.saldoSekarangInt + nominalInt });
                }
            }

            // Increment usage count
            await db.templateTransaksi.update(templateId, { usageCount: (template.usageCount || 0) + 1 });

            return {
                success: true,
                data: {
                    ...transData,
                    nominal: template.nominal // Return float
                }
            };
        });
    } catch (error) {
        console.error("useTemplate error", error);
        return { success: false, error: "Gagal menggunakan template" };
    }
}

export async function deleteTemplate(id: string) {
    try {
        await db.templateTransaksi.delete(id);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menghapus template" };
    }
}

export async function saveAsTemplate(transaksiId: string, nama: string) {
    try {
        const transaksi = await db.transaksi.get(transaksiId);
        if (!transaksi) return { success: false, error: "Transaksi tidak ditemukan" };

        const debitAkun = await db.akun.get(transaksi.debitAkunId);
        if (!debitAkun) return { success: false, error: "Akun debit tidak ditemukan" };

        // Tentukan tipe dan akun
        const isKeluar = debitAkun.tipe === "EXPENSE"; // Actually internal logic: EXPENSE type means Money goes here (Expense Category).
        // Wait, if debitAkun is EXPENSE (e.g. "[EXPENSE] Makanan"), then creditAkun is user account.
        // So Credit -> Debit. User Account -> Expense Category. This is EXPENSE transaction.
        // If debitAkun is User Account, then Credit is Income Category. This is INCOME transaction.

        // Wait, let's verify `tipe` in `app-db.ts`.
        // `tipe: string; // BANK | E_WALLET | CASH | CREDIT_CARD | EXPENSE | INCOME`

        // If debitAkun.tipe is EXPENSE, then it IS an expense transaction (money flows INTO expense category).
        // Wait, server logic:
        // const isKeluar = transaksi.debitAkun.tipe === "EXPENSE" // No this seems wrong in server logic? 
        // Logic: if Debit Account is "Biaya Makan" (EXPENSE type), then we are debiting expense (increasing expense), crediting Wallet.
        // So `isKeluar` = true.

        // But `app-db.ts` only has `tipe` on `AkunRecord`.
        // We need to fetch `debitAkun` to check its type.

        const akunId = isKeluar ? transaksi.kreditAkunId : transaksi.debitAkunId;

        const templateData: TemplateTransaksiRecord = {
            id: crypto.randomUUID(),
            nama,
            deskripsi: transaksi.deskripsi,
            nominal: Money.toFloat(transaksi.nominalInt),
            kategori: transaksi.kategori,
            tipeTransaksi: isKeluar ? "KELUAR" : "MASUK",
            akunId,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.templateTransaksi.add(templateData);

        return { success: true, data: mapTemplateTransaksiToDTO(templateData) };
    } catch (error) {
        console.error("saveAsTemplate error", error);
        return { success: false, error: "Gagal menyimpan sebagai template" };
    }
}

function mapTemplateTransaksiToDTO(t: TemplateTransaksiRecord): TemplateTransaksiDTO {
    return {
        id: t.id,
        nama: t.nama,
        deskripsi: t.deskripsi,
        nominal: t.nominal,
        kategori: t.kategori,
        tipeTransaksi: t.tipeTransaksi,
        akunId: t.akunId,
        icon: t.icon || undefined,
        warna: t.warna || undefined,
        usageCount: t.usageCount
    };
}
