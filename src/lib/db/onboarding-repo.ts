import { db } from "./app-db";
import type { ServerActionResult } from "@/types";

const ONBOARDING_KEY = "onboarding_completed";

/**
 * Check if onboarding has been completed
 * @returns true if onboarding is completed, false otherwise
 */
export async function getOnboardingStatus(): Promise<boolean> {
    try {
        const setting = await db.appSetting.get({ kunci: ONBOARDING_KEY });
        return setting?.nilai === "true";
    } catch (error) {
        console.error("[KEU-LOG] getOnboardingStatus error:", error);
        return false;
    }
}

/**
 * Mark onboarding as completed
 * @returns ServerActionResult with success status
 */
export async function setOnboardingCompleted(): Promise<ServerActionResult<boolean>> {
    try {
        const now = new Date();
        const existingSetting = await db.appSetting.get({ kunci: ONBOARDING_KEY });
        
        if (existingSetting) {
            await db.appSetting.update(existingSetting.id, { 
                nilai: "true", 
                updatedAt: now 
            });
        } else {
            await db.appSetting.add({
                id: 'onboarding_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
                kunci: ONBOARDING_KEY,
                nilai: "true",
                createdAt: now,
                updatedAt: now
            });
        }
        
        return { success: true, data: true };
    } catch (error) {
        console.error("[KEU-LOG] setOnboardingCompleted error:", error);
        return { success: false, error: "Gagal menyimpan status onboarding" };
    }
}

/**
 * Reset onboarding status (for testing/development)
 * @returns ServerActionResult with success status
 */
export async function resetOnboardingStatus(): Promise<ServerActionResult<boolean>> {
    try {
        const now = new Date();
        const existingSetting = await db.appSetting.get({ kunci: ONBOARDING_KEY });
        
        if (existingSetting) {
            await db.appSetting.update(existingSetting.id, { 
                nilai: "false", 
                updatedAt: now 
            });
        }
        
        return { success: true, data: true };
    } catch (error) {
        console.error("[KEU-LOG] resetOnboardingStatus error:", error);
        return { success: false, error: "Gagal reset status onboarding" };
    }
}
