import { cn } from "@/lib/utils"

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted",
                className
            )}
        />
    )
}

// Card Skeleton untuk dashboard stats
export function CardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
        </div>
    )
}

// Row Skeleton untuk table/list
export function RowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20" />
        </div>
    )
}

// Chart Skeleton
export function ChartSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
    )
}

// Account Card Skeleton
export function AccountCardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-4 border-l-4 border-l-primary">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <Skeleton className="h-8 w-28" />
            <div className="flex gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </div>
        </div>
    )
}

// Transaction Row Skeleton
export function TransactionRowSkeleton() {
    return (
        <tr className="border-b">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <Skeleton className="h-6 w-24" />
            </td>
            <td className="px-6 py-4">
                <Skeleton className="h-4 w-28 mx-auto" />
            </td>
            <td className="px-6 py-4 text-right">
                <Skeleton className="h-5 w-24 ml-auto" />
            </td>
            <td className="px-6 py-4 text-center">
                <Skeleton className="h-8 w-8 mx-auto rounded" />
            </td>
        </tr>
    )
}

// Cicilan Card Skeleton
export function CicilanCardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-4 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
        </div>
    )
}

// Budget Item Skeleton
export function BudgetItemSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3 border-l-4 border-l-primary">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <div className="text-right space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
        </div>
    )
}

// Page Loading Skeleton - Full page skeleton
export function PageLoadingSkeleton({ title }: { title?: string }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>
        </div>
    )
}
