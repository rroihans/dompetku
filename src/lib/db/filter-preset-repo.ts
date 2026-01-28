import { db } from "./app-db";
import { FilterPresetRecord } from "./app-db";

export async function getFilterPresets() {
    try {
        const presets = await db.filterPreset.orderBy("usageCount").reverse().toArray();
        return { success: true, data: presets };
    } catch (error) {
        console.error("getFilterPresets error", error);
        return { success: false, data: [] };
    }
}

export async function saveFilterPreset(name: string, filters: any, icon: string = "📌") {
    try {
        const preset: FilterPresetRecord = {
            id: crypto.randomUUID(),
            name,
            icon,
            filters: JSON.stringify(filters),
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await db.filterPreset.add(preset);
        return { success: true, data: preset };
    } catch (error) {
        console.error("saveFilterPreset error", error);
        return { success: false, error: "Gagal menyimpan preset" };
    }
}

export async function deleteFilterPreset(id: string) {
    try {
        await db.filterPreset.delete(id);
        return { success: true };
    } catch (error) {
        console.error("deleteFilterPreset error", error);
        return { success: false, error: "Gagal menghapus preset" };
    }
}

export async function incrementPresetUsage(id: string) {
    try {
        const preset = await db.filterPreset.get(id);
        if (preset) {
            await db.filterPreset.update(id, { usageCount: preset.usageCount + 1 });
        }
        return { success: true };
    } catch (error) {
        console.error("incrementPresetUsage error", error);
        return { success: false };
    }
}
