import { CardSkeleton, BudgetItemSkeleton, Skeleton } from "@/components/ui/skeleton"

export default function AnggaranLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-9 w-52 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-80 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-36" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            {/* Progress Bar */}
            <div className="rounded-lg border bg-card p-6 space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
            </div>

            {/* Section Title */}
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />

            {/* Budget Items */}
            <div className="grid gap-4">
                <BudgetItemSkeleton />
                <BudgetItemSkeleton />
                <BudgetItemSkeleton />
                <BudgetItemSkeleton />
                <BudgetItemSkeleton />
            </div>
        </div>
    )
}
