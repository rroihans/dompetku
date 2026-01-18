"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"

export async function getFilterPresets() {
    try {
        const presets = await prisma.filterPreset.findMany({
            orderBy: { usageCount: 'desc' }
        });
        return { success: true, data: presets };
    } catch (error) {
        return { success: false, error: "Gagal mengambil preset filter" };
    }
}

export async function saveFilterPreset(name: string, filters: any, icon?: string) {
    try {
        const preset = await prisma.filterPreset.create({
            data: {
                name,
                filters: JSON.stringify(filters),
                icon
            }
        });
        
        await logSistem("INFO", "FILTER", `Preset filter disimpan: ${name}`);
        revalidatePath("/transaksi");
        return { success: true, data: preset };
    } catch (error) {
        await logSistem("ERROR", "FILTER", "Gagal menyimpan preset", (error as Error).stack);
        return { success: false, error: "Gagal menyimpan preset" };
    }
}

export async function deleteFilterPreset(id: string) {
    try {
        await prisma.filterPreset.delete({
            where: { id }
        });
        revalidatePath("/transaksi");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menghapus preset" };
    }
}

export async function incrementPresetUsage(id: string) {
    try {
        await prisma.filterPreset.update({
            where: { id },
            data: { usageCount: { increment: 1 } }
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
