import { db } from "./app-db";
import { Money } from "@/lib/money";
import { CicilanSchema } from "@/lib/validations/cicilan";
import { createTransaksi } from "./transactions-repo";

export interface CicilanData {
    namaProduk: string;
    totalPokok: number;
    tenor: number;
    nominalPerBulan: number;
    biayaAdmin?: number;
    bungaPersen?: number;
    tanggalJatuhTempo: number;
    akunKreditId: string;
}

export async function createCicilan(data: CicilanData) {
    const partialSchema = CicilanSchema.omit({ akunDebitId: true, adminFeeType: true, adminFeeAmount: true });
    const validation = partialSchema.safeParse(data);

    if (!validation.success) {
        const errorMessages = validation.error.flatten().fieldErrors;
        const firstError = Object.values(errorMessages).flat()[0] || "Data tidak valid";
        return { success: false, error: firstError, errors: errorMessages };
    }

    const now = new Date();
    const namaAkunDebit = "[EXPENSE] Cicilan";

    let akunDebit = await db.akun.where("nama").equals(namaAkunDebit).first();
    if (!akunDebit) {
        akunDebit = {
            id: createId(),
            nama: namaAkunDebit,
            tipe: "EXPENSE",
            saldoAwalInt: 0,
            saldoSekarangInt: 0,
            createdAt: now,
            updatedAt: now,
        };

        const debitId = akunDebit.id; // capture for use inside transaction if needed, but we pass object
        await db.transaction("rw", db.akun, async () => {
            // double check inside tx but for client single user OK
            if (!await db.akun.get(debitId)) {
                await db.akun.add(akunDebit!);
            }
        });
    }

    const cicilan = {
        id: createId(),
        namaProduk: data.namaProduk,
        totalPokokInt: Money.fromFloat(data.totalPokok),
        tenor: data.tenor,
        cicilanKe: 1,
        nominalPerBulanInt: Money.fromFloat(data.nominalPerBulan),
        biayaAdminInt: Money.fromFloat(data.biayaAdmin || 0),
        bungaPersen: data.bungaPersen || 0,
        tanggalJatuhTempo: data.tanggalJatuhTempo,
        status: "AKTIF",
        akunKreditId: data.akunKreditId,
        akunDebitId: akunDebit.id,
        createdAt: now,
        updatedAt: now,
    };

    await db.rencanaCicilan.add(cicilan);

    return {
        success: true,
        data: {
            ...cicilan,
            totalPokok: Money.toFloat(cicilan.totalPokokInt),
            nominalPerBulan: Money.toFloat(cicilan.nominalPerBulanInt),
            biayaAdmin: Money.toFloat(cicilan.biayaAdminInt ?? 0),
        },
    };
}

export async function getCicilan() {
    try {
        const cicilan = await db.rencanaCicilan.toArray();
        // Sort: AKTIF first, then by createdAt desc
        cicilan.sort((a, b) => {
            if (a.status === b.status) {
                return b.createdAt.getTime() - a.createdAt.getTime();
            }
            return a.status === "AKTIF" ? -1 : 1;
        });

        const mapped = cicilan.map(c => ({
            ...c,
            totalPokok: Money.toFloat(c.totalPokokInt),
            nominalPerBulan: Money.toFloat(c.nominalPerBulanInt),
            biayaAdmin: Money.toFloat(c.biayaAdminInt ?? 0),
        }));

        return { success: true, data: mapped };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}

export async function getCicilanById(id: string) {
    try {
        const cicilan = await db.rencanaCicilan.get(id);
        if (!cicilan) return null;

        const transactions = await db.transaksi
            .where("rencanaCicilanId").equals(id)
            .reverse() // Sort by index (likely id or derived) - but we want timestamp descending. 
            // We can sort manually
            .toArray();
        transactions.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());

        return {
            ...cicilan,
            totalPokok: Money.toFloat(cicilan.totalPokokInt),
            nominalPerBulan: Money.toFloat(cicilan.nominalPerBulanInt),
            biayaAdmin: Money.toFloat(cicilan.biayaAdminInt ?? 0),
            transaksi: transactions.map(tx => ({
                ...tx,
                nominal: Money.toFloat(tx.nominalInt)
            }))
        };
    } catch (error) {
        return null;
    }
}

export async function bayarCicilan(id: string) {
    // Alias for existing function logic, but we can just use processCicilanPayment
    // Or copy logic here for consistency
    const cicilan = await db.rencanaCicilan.get(id);
    if (!cicilan) return { success: false, error: "Cicilan tidak ditemukan" };
    if (cicilan.status !== "AKTIF") return { success: false, error: "Cicilan sudah lunas atau dibalikkan" };

    if (cicilan.cicilanKe > cicilan.tenor) {
        return { success: false, error: "Cicilan sudah melebihi tenor" };
    }

    const nominalFloated = Money.toFloat(cicilan.nominalPerBulanInt);
    const description = `Cicilan ${cicilan.namaProduk} (${cicilan.cicilanKe}/${cicilan.tenor})`;

    try {
        await db.transaction("rw", [db.transaksi, db.akun, db.rencanaCicilan, db.summaryMonth, db.summaryCategoryMonth, db.summaryHeatmapDay, db.summaryAccountMonth], async () => {
            // Create Transaction via repo helper which handles summaries
            await createTransaksi({
                deskripsi: description,
                nominal: nominalFloated,
                kategori: "Cicilan",
                debitAkunId: cicilan.akunDebitId,
                kreditAkunId: cicilan.akunKreditId,
                tanggal: new Date(),
                rencanaCicilanId: cicilan.id,
                catatan: `Pembayaran cicilan ke-${cicilan.cicilanKe} dari ${cicilan.tenor}`,
            });

            // Update Cicilan
            const newCicilanKe = cicilan.cicilanKe + 1;
            const isLunas = newCicilanKe > cicilan.tenor;

            await db.rencanaCicilan.update(cicilan.id, {
                cicilanKe: newCicilanKe,
                status: isLunas ? "LUNAS" : "AKTIF",
                updatedAt: new Date(),
            });
        });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function pelunasanDipercepat(id: string) {
    try {
        const cicilan = await db.rencanaCicilan.get(id);
        if (!cicilan) return { success: false, error: "Cicilan tidak ditemukan" };
        if (cicilan.status !== "AKTIF") return { success: false, error: "Cicilan sudah lunas" };

        const sisaTenor = cicilan.tenor - cicilan.cicilanKe + 1;
        // Calculate nominal using integer math
        const sisaNominalInt = BigInt(sisaTenor) * BigInt(Math.round(cicilan.nominalPerBulanInt)); // nominalPerBulanInt is number but should be treated as int
        // Actually JS number is safe integers up to 9 quadrillion.
        const sisaNominalNumber = sisaTenor * cicilan.nominalPerBulanInt;

        await db.transaction("rw", [db.transaksi, db.akun, db.rencanaCicilan, db.summaryMonth, db.summaryCategoryMonth, db.summaryHeatmapDay, db.summaryAccountMonth], async () => {
            await createTransaksi({
                deskripsi: `Pelunasan ${cicilan.namaProduk} (sisa ${sisaTenor} bulan)`,
                nominal: Money.toFloat(sisaNominalNumber),
                kategori: "Cicilan",
                debitAkunId: cicilan.akunDebitId,
                kreditAkunId: cicilan.akunKreditId,
                tanggal: new Date(),
                rencanaCicilanId: cicilan.id,
                catatan: `Pelunasan dipercepat - sisa ${sisaTenor} dari ${cicilan.tenor} bulan`,
            });

            await db.rencanaCicilan.update(id, {
                cicilanKe: cicilan.tenor + 1,
                status: "LUNAS",
                updatedAt: new Date()
            });
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateCicilan(id: string, data: {
    namaProduk?: string
    tanggalJatuhTempo?: number
    biayaAdmin?: number
    bungaPersen?: number
}) {
    try {
        const cicilan = await db.rencanaCicilan.get(id);
        if (!cicilan) return { success: false, error: "Cicilan tidak ditemukan" };

        const updateData: any = { ...data, updatedAt: new Date() };
        if (data.biayaAdmin !== undefined) {
            updateData.biayaAdminInt = Money.fromFloat(data.biayaAdmin);
        }

        await db.rencanaCicilan.update(id, updateData);

        const updated = await db.rencanaCicilan.get(id);

        const mappedCicilan = {
            ...updated!,
            totalPokok: Money.toFloat(updated!.totalPokokInt),
            nominalPerBulan: Money.toFloat(updated!.nominalPerBulanInt),
            biayaAdmin: Money.toFloat(updated!.biayaAdminInt ?? 0),
        }

        return { success: true, data: mappedCicilan };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteCicilan(id: string) {
    try {
        const transaksiCount = await db.transaksi.where("rencanaCicilanId").equals(id).count();
        if (transaksiCount > 0) {
            return {
                success: false,
                error: `Tidak dapat menghapus. Sudah ada ${transaksiCount} pembayaran terkait.`
            };
        }

        await db.rencanaCicilan.delete(id);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCicilanStats() {
    try {
        const cicilanAktif = await db.rencanaCicilan.where("status").equals("AKTIF").toArray();

        let totalHutang = 0;
        let tagihanBulanIni = 0;

        for (const c of cicilanAktif) {
            const sisaTenor = c.tenor - c.cicilanKe + 1;
            totalHutang += sisaTenor * c.nominalPerBulanInt;
            tagihanBulanIni += c.nominalPerBulanInt;
        }

        const kartuKredit = await db.akun.where("tipe").equals("CREDIT_CARD").toArray();
        const totalLimit = kartuKredit.reduce((sum, k) => sum + (k.limitKreditInt || 0), 0);

        const totalHutangFloat = Money.toFloat(totalHutang);
        const totalLimitFloat = Money.toFloat(totalLimit);

        const rasioHutang = totalLimitFloat > 0 ? (totalHutangFloat / totalLimitFloat) * 100 : 0;

        return {
            success: true,
            data: {
                totalHutang: totalHutangFloat,
                tagihanBulanIni: Money.toFloat(tagihanBulanIni),
                jumlahCicilanAktif: cicilanAktif.length,
                rasioHutang: Math.round(rasioHutang)
            }
        };

    } catch (error: any) {
        return {
            success: false,
            data: { totalHutang: 0, tagihanBulanIni: 0, jumlahCicilanAktif: 0, rasioHutang: 0 }
        };
    }
}

function createId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// =====================================================
// Additional exports for convert-to-installment-dialog
// =====================================================

export async function getInstallmentTemplates() {
    try {
        // Use templateCicilan table if available; otherwise return empty
        const templates = await db.installmentTemplate.toArray();
        return { success: true, data: templates };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}

export interface ConversionPreview {
    originalNominal: number;
    adminFee: number;
    adminFeeType: string;
    total: number;
    tenor: number;
    monthlyPayment: number;
    deskripsi: string;
}

export async function getConversionPreview(
    transaksiId: string,
    tenor: number,
    templateId?: string,
    manualAdminFee?: number,
    manualAdminFeeType?: "FLAT" | "PERCENTAGE"
): Promise<{ success: boolean; data?: ConversionPreview }> {
    try {
        const tx = await db.transaksi.get(transaksiId);
        if (!tx) return { success: false };

        const originalNominal = Money.toFloat(tx.nominalInt);

        let adminFee = 0;
        let adminFeeType = "FLAT";

        if (templateId) {
            const template = await db.installmentTemplate.get(templateId);
            if (template) {
                adminFeeType = template.adminFeeType || "FLAT";
                const feeAmount = template.adminFeeAmount ?? 0;
                if (adminFeeType === "PERCENTAGE") {
                    adminFee = (originalNominal * feeAmount) / 100;
                } else {
                    adminFee = feeAmount;
                }
            }
        } else if (manualAdminFee !== undefined) {
            adminFeeType = manualAdminFeeType || "FLAT";
            if (adminFeeType === "PERCENTAGE") {
                adminFee = (originalNominal * manualAdminFee) / 100;
            } else {
                adminFee = manualAdminFee;
            }
        }

        const total = originalNominal + adminFee;
        const monthlyPayment = Math.ceil(total / tenor);

        return {
            success: true,
            data: {
                originalNominal,
                adminFee,
                adminFeeType,
                total,
                tenor,
                monthlyPayment,
                deskripsi: tx.deskripsi
            }
        };
    } catch (error: any) {
        return { success: false };
    }
}

export interface ConvertToInstallmentInput {
    transaksiId: string;
    tenor: number;
    templateId?: string;
    adminFeeAmount?: number;
    adminFeeType?: "FLAT" | "PERCENTAGE";
}

export async function convertTransactionToInstallment(input: ConvertToInstallmentInput): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const tx = await db.transaksi.get(input.transaksiId);
        if (!tx) return { success: false, error: "Transaksi tidak ditemukan" };

        const originalNominal = Money.toFloat(tx.nominalInt);

        let adminFee = 0;
        let adminFeeType: "FLAT" | "PERCENTAGE" = "FLAT";

        if (input.templateId) {
            const template = await db.installmentTemplate.get(input.templateId);
            if (template) {
                adminFeeType = (template.adminFeeType as "FLAT" | "PERCENTAGE") || "FLAT";
                const feeAmount = template.adminFeeAmount ?? 0;
                if (adminFeeType === "PERCENTAGE") {
                    adminFee = (originalNominal * feeAmount) / 100;
                } else {
                    adminFee = feeAmount;
                }
            }
        } else if (input.adminFeeAmount !== undefined) {
            adminFeeType = input.adminFeeType || "FLAT";
            if (adminFeeType === "PERCENTAGE") {
                adminFee = (originalNominal * input.adminFeeAmount) / 100;
            } else {
                adminFee = input.adminFeeAmount;
            }
        }

        const total = originalNominal + adminFee;
        const nominalPerBulan = Math.ceil(total / input.tenor);

        const cicilanResult = await createCicilan({
            namaProduk: tx.deskripsi,
            totalPokok: total,
            tenor: input.tenor,
            nominalPerBulan,
            biayaAdmin: adminFee,
            tanggalJatuhTempo: new Date().getDate(),
            akunKreditId: tx.kreditAkunId,
        });

        if (!cicilanResult.success) {
            return { success: false, error: cicilanResult.error };
        }

        // Mark original transaction with reference
        await db.transaksi.update(input.transaksiId, {
            rencanaCicilanId: cicilanResult.data!.id
        });

        return { success: true, message: `Berhasil dikonversi ke cicilan ${input.tenor} bulan` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
