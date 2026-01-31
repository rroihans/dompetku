"use client"

import { icons, type LucideIcon, type LucideProps } from "lucide-react"

interface DynamicIconProps extends Omit<LucideProps, "name"> {
    name: string | null | undefined
    fallback?: LucideIcon
}

export function DynamicIcon({ name, fallback: Fallback, ...props }: DynamicIconProps) {
    if (!name) {
        if (Fallback) return <Fallback {...props} />
        return null
    }

    const IconComponent = (icons as unknown as Record<string, LucideIcon>)[name]

    if (!IconComponent) {
        if (Fallback) return <Fallback {...props} />
        return null
    }

    return <IconComponent {...props} />
}
