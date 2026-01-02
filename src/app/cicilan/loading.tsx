import { CardSkeleton, CicilanCardSkeleton } from "@/components/ui/skeleton"

export default function CicilanLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-9 w-44 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-72 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-36 bg-muted rounded animate-pulse" />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-2 mt-8">
                <div className="h-6 w-6 bg-muted rounded animate-pulse" />
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            </div>

            {/* Cicilan Cards */}
            <div className="grid gap-6">
                <CicilanCardSkeleton />
                <CicilanCardSkeleton />
                <CicilanCardSkeleton />
            </div>
        </div>
    )
}
