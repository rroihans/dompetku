import { NextResponse } from "next/server"
import { saveNetWorthSnapshot } from "@/app/actions/networth"
import { executeRecurringTransactions } from "@/app/actions/recurring"
import { processMonthlyAdminFees, processMonthlyInterest } from "@/app/actions/recurring-admin"
import { logSistem } from "@/lib/logger"

/**
 * Daily Cron Job
 * Schedule: 0 0 * * *
 */
export async function GET(request: Request) {
    // Check for authorization (e.g. Vercel Cron Secret)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        console.log("Running Daily Cron Job...")
        await logSistem("INFO", "CRON", "Starting Daily Cron Job")

        // 1. Execute Recurring Transactions
        const recurringRes = await executeRecurringTransactions()
        
        // 2. Process Admin Fees (if date matches)
        const adminRes = await processMonthlyAdminFees()
        
        // 3. Process Interest (if first day of month)
        const today = new Date()
        let interestRes = { success: true }
        if (today.getDate() === 1) {
            interestRes = await processMonthlyInterest()
        }

        // 4. Save Net Worth Snapshot
        const snapshotRes = await saveNetWorthSnapshot()

        await logSistem("INFO", "CRON", "Daily Cron Job completed successfully")

        return NextResponse.json({
            success: true,
            results: {
                recurring: recurringRes,
                adminFees: adminRes,
                interest: interestRes,
                snapshot: snapshotRes
            }
        })
    } catch (error) {
        await logSistem("ERROR", "CRON", "Daily Cron Job failed", (error as Error).stack)
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}