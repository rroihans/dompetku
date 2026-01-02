import { AccountCardSkeleton } from "@/components/ui/skeleton"

export default function AkunLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-9 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-80 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                </div>
            </div>

            {/* Account Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <AccountCardSkeleton />
                <AccountCardSkeleton />
                <AccountCardSkeleton />
                <AccountCardSkeleton />
            </div>
        </div>
    )
}
