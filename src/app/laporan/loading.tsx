import { CardSkeleton, ChartSkeleton, RowSkeleton, Skeleton } from "@/components/ui/skeleton"

export default function LaporanLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-9 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-72 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            {/* Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>

            {/* Top Transactions */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
                <Skeleton className="h-5 w-52" />
                <div className="space-y-3">
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                </div>
            </div>
        </div>
    )
}
