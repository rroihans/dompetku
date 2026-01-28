import { Skeleton } from "@/components/ui/skeleton"

export default function RecurringLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-9 w-52 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-80 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-muted rounded animate-pulse" />
            </div>

            {/* Recurring Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="rounded-lg border bg-card p-6 space-y-4 border-l-4 border-l-primary">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="h-8 w-8" />
                        </div>
                        <Skeleton className="h-8 w-28" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-14 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
