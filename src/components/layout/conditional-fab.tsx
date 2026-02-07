"use client"

import { usePathname } from "next/navigation"
import { FAB } from "@/components/ui/fab"

export function ConditionalFAB() {
    const pathname = usePathname()
    const isOnboardingPage = pathname?.includes('/onboarding')
    
    if (isOnboardingPage) {
        return null
    }
    
    return <FAB />
}
