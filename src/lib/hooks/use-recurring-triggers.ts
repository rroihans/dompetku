"use client";

import { useEffect } from "react";
import {
    executeRecurringTransactions,
    processMonthlyAdminFees,
    processMonthlyInterest
} from "@/lib/db/recurring-repo";
import { saveNetWorthSnapshot } from "@/lib/db/networth-repo";

export function useRecurringTriggers() {
    useEffect(() => {
        async function checkRecurring() {
            if (typeof window === "undefined") return;

            const lastRun = localStorage.getItem("lastRecurringCheck");
            const now = new Date();
            const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

            // Run max once per day
            if (lastRun === today) {
                return;
            }

            console.log("[Recurring] Checking for due transactions...");

            try {
                // 1. Recurring Transactions (Generic)
                const recurResult = await executeRecurringTransactions();
                if (recurResult.success && recurResult.executed && recurResult.executed > 0) {
                    console.log(`[Recurring] Executed ${recurResult.executed} recurring transactions`);
                }

                // 2. Monthly Admin Fees & Interest
                await processMonthlyAdminFees();
                await processMonthlyInterest();

                // 3. Save daily net worth snapshot for tracking
                await saveNetWorthSnapshot();

                // 4. Mark as run
                localStorage.setItem("lastRecurringCheck", today);
                console.log("[Recurring] Checks completed.");

            } catch (error) {
                console.error("[Recurring] Failed to process:", error);
            }
        }

        // Call immediately on mount
        checkRecurring();
    }, []);
}

