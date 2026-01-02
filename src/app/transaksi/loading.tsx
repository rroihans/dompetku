import { TransactionRowSkeleton, Skeleton } from "@/components/ui/skeleton"

export default function TransaksiLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-9 w-52 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-80 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-muted rounded animate-pulse" />
            </div>

            {/* Filter */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-10 w-20 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <Skeleton key={i} className="h-8 w-24" />
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-card">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-6 py-4 text-left">
                                <Skeleton className="h-4 w-32" />
                            </th>
                            <th className="px-6 py-4 text-left">
                                <Skeleton className="h-4 w-20" />
                            </th>
                            <th className="px-6 py-4 text-center">
                                <Skeleton className="h-4 w-16 mx-auto" />
                            </th>
                            <th className="px-6 py-4 text-right">
                                <Skeleton className="h-4 w-20 ml-auto" />
                            </th>
                            <th className="px-6 py-4 text-center">
                                <Skeleton className="h-4 w-12 mx-auto" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <TransactionRowSkeleton key={i} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
            </div>
        </div>
    )
}
