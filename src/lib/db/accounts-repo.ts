import { db } from "./app-db";
import { Money } from "@/lib/money";
import { CreditCardSettingsSchema } from "@/lib/validations/credit-card";
import type { AccountDTO } from "@/lib/account-dto";

const PAGE_SIZE = 8;
const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"] as const;

export async function getAkunUser(page: number = 1) {
    const akuns = await db.akun.where("tipe").anyOf([...USER_ACCOUNT_TYPES]).toArray();
    const sorted = akuns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = sorted.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const startIndex = (page - 1) * PAGE_SIZE;
    const data = sorted.slice(startIndex, startIndex + PAGE_SIZE).map(mapAkunRecordToDTO);

    return {
        data,
        pagination: {
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages,
        },
    };
}

export async function getAkun() {
    const akuns = await db.akun.where("tipe").anyOf([...USER_ACCOUNT_TYPES]).toArray();
    const sorted = akuns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sorted.map(mapAkunRecordToDTO);
}

export async function getAkunById(id: string) {
    const akun = await db.akun.get(id);
    if (!akun) return null;
    return mapAkunRecordToDTO(akun);
}

export async function createAkun(data: {
    nama: string;
    tipe: string;
    saldoAwal: number;
    limitKredit?: number;
    templateId?: string | null;
    templateSource?: string | null;
    biayaAdminAktif?: boolean;
    biayaAdminNominal?: number | null;
    biayaAdminPola?: string | null;
    biayaAdminTanggal?: number | null;
    bungaAktif?: boolean;
    bungaTiers?: string | null;
    setoranAwal?: number | null;
    icon?: string;
    warna?: string;
    isSyariah?: boolean | null;
    billingDate?: number | null;
    dueDate?: number | null;
    minPaymentFixed?: number | null;
    minPaymentPercent?: number | null;
    minInstallmentAmount?: number | null;
    useDecimalFormat?: boolean;
}) {
    const existing = await db.akun.where("nama").equals(data.nama).first();
    if (existing) return { success: false, error: `Akun dengan nama "${data.nama}" sudah ada` };

    if (data.tipe === "CREDIT_CARD") {
        const ccValidation = CreditCardSettingsSchema.partial().safeParse({
            billingDate: data.billingDate,
            dueDate: data.dueDate,
            minPaymentPercent: data.minPaymentPercent,
            minPaymentFixed: data.minPaymentFixed,
            minInstallmentAmount: data.minInstallmentAmount,
            limitKredit: data.limitKredit,
            useDecimalFormat: data.useDecimalFormat,
            isSyariah: data.isSyariah,
        });

        if (!ccValidation.success) {
            const errorMessages = ccValidation.error.flatten().fieldErrors;
            return {
                success: false,
                error: Object.values(errorMessages).flat()[0] || "Data Kartu Kredit tidak valid",
            };
        }
    }

    const saldoAwalInt = Money.fromFloat(data.saldoAwal);
    const limitKreditInt = data.limitKredit ? Money.fromFloat(data.limitKredit) : null;
    const setoranAwalInt = data.setoranAwal ? Money.fromFloat(data.setoranAwal) : null;
    const minPaymentFixedInt = data.minPaymentFixed ? Money.fromFloat(data.minPaymentFixed) : null;
    const minInstallmentAmountInt = data.minInstallmentAmount
        ? Money.fromFloat(data.minInstallmentAmount)
        : null;
    const biayaAdminNominalInt = data.biayaAdminNominal ? Money.fromFloat(data.biayaAdminNominal) : null;

    const now = new Date();
    const akun = {
        id: createId(),
        nama: data.nama,
        tipe: data.tipe,
        saldoAwalInt,
        saldoSekarangInt: saldoAwalInt,
        limitKreditInt,
        setoranAwalInt,
        minPaymentFixedInt,
        minInstallmentAmountInt,
        templateId: data.templateId ?? null,
        templateSource: data.templateSource ?? null,
        biayaAdminAktif: data.biayaAdminAktif ?? false,
        biayaAdminNominalInt,
        biayaAdminPola: data.biayaAdminPola ?? null,
        biayaAdminTanggal: data.biayaAdminTanggal ?? null,
        bungaAktif: data.bungaAktif ?? false,
        bungaTiers: data.bungaTiers ?? null,
        icon: data.icon ?? null,
        warna: data.warna ?? null,
        isSyariah: data.isSyariah ?? null,
        billingDate: data.billingDate ?? null,
        dueDate: data.dueDate ?? null,
        minPaymentPercent: data.minPaymentPercent ?? null,
        useDecimalFormat: data.useDecimalFormat ?? false,
        settingsLastModified: new Date(),
        createdAt: now,
        updatedAt: now,
    };

    await db.akun.add(akun);

    // --- SIDE EFFECT: Create Admin Fee & Recurring if active ---
    if (data.biayaAdminAktif && data.biayaAdminNominal) {
        const recurringId = createId();
        const feeId = createId();
        const currentDate = new Date();
        const nominalInt = Money.fromFloat(data.biayaAdminNominal);
        // Default to day 1 if not specified
        const hariTagihan = data.biayaAdminTanggal ?? 1;

        await db.recurringTransaction.add({
            id: recurringId,
            nama: `[Auto] Biaya Admin ${data.nama}`,
            nominalInt: nominalInt,
            kategori: "Biaya Admin Bank",
            tipeTransaksi: "KELUAR",
            akunId: akun.id,
            frekuensi: "BULANAN",
            hariDalamBulan: hariTagihan,
            aktif: true,
            isAutoGenerated: true,
            createdAt: currentDate,
            updatedAt: currentDate,
            tanggalMulai: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            terakhirDieksekusi: null
        });

        await db.adminFee.add({
            id: feeId,
            akunId: akun.id,
            deskripsi: `Biaya Admin ${data.nama}`,
            nominal: data.biayaAdminNominal,
            isActive: true,
            recurringTxId: recurringId,
            createdAt: currentDate,
            updatedAt: currentDate
        });
    }

    return { success: true, data: mapAkunRecordToDTO(akun) };
}

export async function updateAkun(
    id: string,
    data: {
        nama?: string;
        tipe?: string;
        limitKredit?: number;
        templateId?: string | null;
        templateSource?: string | null;
        biayaAdminAktif?: boolean;
        biayaAdminNominal?: number | null;
        biayaAdminPola?: string | null;
        biayaAdminTanggal?: number | null;
        bungaAktif?: boolean;
        bungaTiers?: string | null;
        templateOverrides?: string | null;
        setoranAwal?: number | null;
        icon?: string;
        warna?: string;
        isSyariah?: boolean | null;
        billingDate?: number | null;
        dueDate?: number | null;
        minPaymentFixed?: number | null;
        minPaymentPercent?: number | null;
        minInstallmentAmount?: number | null;
        useDecimalFormat?: boolean;
    }
) {
    const akun = await db.akun.get(id);
    if (!akun) return { success: false, error: "Akun tidak ditemukan" };

    if (data.nama) {
        const existing = await db.akun.where("nama").equals(data.nama).first();
        if (existing && existing.id !== id) {
            return { success: false, error: `Akun dengan nama "${data.nama}" sudah ada` };
        }
    }

    if (data.billingDate || data.dueDate || data.minPaymentPercent || data.minPaymentFixed) {
        const ccValidation = CreditCardSettingsSchema.partial().safeParse({
            billingDate: data.billingDate,
            dueDate: data.dueDate,
            minPaymentPercent: data.minPaymentPercent,
            minPaymentFixed: data.minPaymentFixed,
            minInstallmentAmount: data.minInstallmentAmount,
            limitKredit: data.limitKredit,
            useDecimalFormat: data.useDecimalFormat,
            isSyariah: data.isSyariah,
        });

        if (!ccValidation.success) {
            const errorMessages = ccValidation.error.flatten().fieldErrors;
            return {
                success: false,
                error: Object.values(errorMessages).flat()[0] || "Data Kartu Kredit tidak valid",
            };
        }
    }

    const updateData: Record<string, any> = {
        ...data,
        updatedAt: new Date(),
    };

    if (data.biayaAdminAktif !== undefined || data.bungaAktif !== undefined) {
        updateData.settingsLastModified = new Date();
    }

    if (data.limitKredit !== undefined) updateData.limitKreditInt = data.limitKredit ? Money.fromFloat(data.limitKredit) : null;
    if (data.setoranAwal !== undefined) updateData.setoranAwalInt = data.setoranAwal ? Money.fromFloat(data.setoranAwal) : null;
    if (data.minPaymentFixed !== undefined) updateData.minPaymentFixedInt = data.minPaymentFixed ? Money.fromFloat(data.minPaymentFixed) : null;
    if (data.minInstallmentAmount !== undefined)
        updateData.minInstallmentAmountInt = data.minInstallmentAmount ? Money.fromFloat(data.minInstallmentAmount) : null;
    if (data.biayaAdminNominal !== undefined)
        updateData.biayaAdminNominalInt = data.biayaAdminNominal ? Money.fromFloat(data.biayaAdminNominal) : null;

    await db.akun.update(id, updateData);

    const updated = await db.akun.get(id);
    if (!updated) return { success: false, error: "Akun tidak ditemukan" };

    return { success: true, data: mapAkunRecordToDTO(updated) };
}

export async function deleteAkun(id: string) {
    const transaksiCount = await db.transaksi
        .filter((tx) => tx.debitAkunId === id || tx.kreditAkunId === id)
        .count();

    if (transaksiCount > 0) {
        return {
            success: false,
            error: `Tidak dapat menghapus akun. Masih ada ${transaksiCount} transaksi terkait.`
        };
    }

    await db.akun.delete(id);
    return { success: true };
}

function mapAkunRecordToDTO(akun: any): AccountDTO {
    return {
        id: akun.id,
        nama: akun.nama,
        tipe: akun.tipe,
        saldoSekarang: Money.toFloat(akun.saldoSekarangInt ?? 0),
        saldoAwal: Money.toFloat(akun.saldoAwalInt ?? 0),
        limitKredit: akun.limitKreditInt ? Money.toFloat(akun.limitKreditInt) : null,
        setoranAwal: akun.setoranAwalInt ? Money.toFloat(akun.setoranAwalInt) : null,
        minPaymentFixed: akun.minPaymentFixedInt ? Money.toFloat(akun.minPaymentFixedInt) : null,
        minInstallmentAmount: akun.minInstallmentAmountInt ? Money.toFloat(akun.minInstallmentAmountInt) : null,
        templateId: akun.templateId ?? null,
        templateSource: akun.templateSource ?? null,
        templateOverrides: akun.templateOverrides ?? null,
        icon: akun.icon ?? null,
        warna: akun.warna ?? null,
        isSyariah: akun.isSyariah ?? null,
        billingDate: akun.billingDate ?? null,
        dueDate: akun.dueDate ?? null,
        minPaymentPercent: akun.minPaymentPercent ?? null,
        useDecimalFormat: akun.useDecimalFormat ?? false,
        biayaAdminAktif: akun.biayaAdminAktif ?? false,
        biayaAdminNominal: akun.biayaAdminNominalInt ? Money.toFloat(akun.biayaAdminNominalInt) : null,
        biayaAdminPola: akun.biayaAdminPola ?? null,
        biayaAdminTanggal: akun.biayaAdminTanggal ?? null,
        bungaAktif: akun.bungaAktif ?? false,
        bungaTiers: akun.bungaTiers ?? null,
    };
}

function createId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}


export async function getCategoryAccounts(tipe: 'EXPENSE' | 'INCOME') {
    const akuns = await db.akun.where("tipe").equals(tipe).toArray();
    return akuns.map(mapAkunRecordToDTO);
}

export async function updateAkunSettings(id: string, settings: {
    biayaAdminAktif: boolean;
    biayaAdminNominal: number | null;
    biayaAdminPola: string | null;
    biayaAdminTanggal: number | null;
    bungaAktif: boolean;
    bungaTiers: string | null;
}) {
    const currentAkun = await db.akun.get(id);
    if (!currentAkun) return { success: false, error: "Akun tidak ditemukan" };

    // Track overrides
    const overrides = currentAkun.templateOverrides ? JSON.parse(currentAkun.templateOverrides) : {};
    const timestamp = new Date().toISOString();
    overrides.history = overrides.history || [];
    overrides.history.push({
        timestamp,
        changes: settings,
    });

    if (overrides.history.length > 10) {
        overrides.history = overrides.history.slice(-10);
    }

    const updateData: Record<string, any> = {
        ...settings,
        templateOverrides: JSON.stringify(overrides),
        settingsLastModified: new Date(),
    };

    if (settings.biayaAdminNominal) {
        updateData.biayaAdminNominalInt = Money.fromFloat(settings.biayaAdminNominal);
    } else if (settings.biayaAdminNominal === null) {
        updateData.biayaAdminNominalInt = null;
    }

    // Wrapped in transaction for consistency
    await db.transaction('rw', [db.akun, db.adminFee, db.recurringTransaction], async () => {
        // 1. Update Akun Record
        await db.akun.update(id, updateData);

        // 2. Sync Admin Fee Automation (Bridge Legacy & New System)
        if (settings.biayaAdminAktif) {
            // Find existing admin fee for this account
            // We prioritize the one linked to a recurring transaction or one specifically named for this account
            const existingFees = await db.adminFee.where("akunId").equals(id).toArray();
            let targetFee = existingFees.find(f => f.recurringTxId) || existingFees[0];

            const nominal = settings.biayaAdminNominal || 0;
            const tanggal = settings.biayaAdminTanggal || 1;

            if (!targetFee) {
                // Create NEW Admin Fee & Recurring
                const recurringId = createId();
                const feeId = createId();
                const now = new Date();

                await db.recurringTransaction.add({
                    id: recurringId,
                    nama: `[Auto] Biaya Admin ${currentAkun.nama}`,
                    nominalInt: Money.fromFloat(nominal),
                    kategori: "Biaya Admin Bank",
                    tipeTransaksi: "KELUAR",
                    akunId: id,
                    frekuensi: "BULANAN",
                    hariDalamBulan: tanggal,
                    aktif: true,
                    isAutoGenerated: true,
                    createdAt: now,
                    updatedAt: now,
                    tanggalMulai: new Date(now.getFullYear(), now.getMonth(), 1),
                    terakhirDieksekusi: null
                });

                await db.adminFee.add({
                    id: feeId,
                    akunId: id,
                    deskripsi: `Biaya Admin ${currentAkun.nama}`,
                    nominal: nominal,
                    isActive: true,
                    recurringTxId: recurringId,
                    createdAt: now,
                    updatedAt: now
                });
            } else {
                // Update EXISTING
                await db.adminFee.update(targetFee.id, {
                    nominal: nominal,
                    isActive: true,
                    updatedAt: new Date()
                });

                if (targetFee.recurringTxId) {
                    await db.recurringTransaction.update(targetFee.recurringTxId, {
                        nominalInt: Money.fromFloat(nominal),
                        hariDalamBulan: tanggal,
                        aktif: true,
                        isAutoGenerated: true, // Ensure marked as auto
                        updatedAt: new Date()
                    });
                } else {
                    // If AdminFee exists but no Recurring, create valid Recurring
                    const recurringId = createId();
                    const now = new Date();

                    await db.recurringTransaction.add({
                        id: recurringId,
                        nama: `[Auto] ${targetFee.deskripsi}`,
                        nominalInt: Money.fromFloat(nominal),
                        kategori: "Biaya Admin Bank",
                        tipeTransaksi: "KELUAR",
                        akunId: id,
                        frekuensi: "BULANAN",
                        hariDalamBulan: tanggal,
                        aktif: true,
                        isAutoGenerated: true,
                        createdAt: now,
                        updatedAt: now,
                        tanggalMulai: new Date(now.getFullYear(), now.getMonth(), 1),
                        terakhirDieksekusi: null
                    });

                    await db.adminFee.update(targetFee.id, {
                        recurringTxId: recurringId
                    });
                }
            }
        } else if (settings.biayaAdminAktif === false) {
            // Deactivate all related Admin Fees
            const existingFees = await db.adminFee.where("akunId").equals(id).toArray();
            for (const fee of existingFees) {
                await db.adminFee.update(fee.id, { isActive: false });
                if (fee.recurringTxId) {
                    await db.recurringTransaction.update(fee.recurringTxId, { aktif: false });
                }
            }
        }
    });

    const updated = await db.akun.get(id);
    if (!updated) return { success: false, error: "Akun tidak ditemukan" };

    return { success: true, data: mapAkunRecordToDTO(updated) };
}

export async function resetAccountToTemplate(akunId: string) {
    const akun = await db.akun.get(akunId);
    if (!akun || !akun.templateId) return { success: false, error: "Akun atau Template tidak ditemukan" };

    const template = await db.accountTemplate.get(akun.templateId);
    if (!template) return { success: false, error: "Template tidak ditemukan" };

    await db.akun.update(akunId, {
        biayaAdminAktif: true,
        biayaAdminNominalInt: template.biayaAdmin ? Money.fromFloat(template.biayaAdmin) : null,
        biayaAdminPola: template.polaTagihan,
        biayaAdminTanggal: template.tanggalTagihan,
        bungaAktif: true,
        bungaTiers: template.bungaTier,
        settingsLastModified: new Date(),
    });

    return { success: true };
}
