import {
    CardSkeleton,
    ChartSkeleton,
    RowSkeleton
} from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-9 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-72 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-muted rounded animate-pulse" />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>

            {/* Bottom Grid */}
            <div className="grid gap-4 md:grid-cols-7">
                <div className="md:col-span-4 rounded-lg border bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                    </div>
                </div>
                <div className="md:col-span-3 rounded-lg border bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-36 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                    </div>
                </div>
            </div>
        </div>
    )
}
