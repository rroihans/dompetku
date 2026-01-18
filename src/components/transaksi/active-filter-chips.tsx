"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function ActiveFilterChips() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Parse filters
    const filters: { key: string, value: string, label: string }[] = [];
    
    searchParams.forEach((value, key) => {
        if (['page', 'sort', 'sortDir'].includes(key)) return; // Skip non-filters
        if (!value) return;

        let label = `${key}: ${value}`;
        
        if (key === 'minNominal') label = `Min: Rp ${parseInt(value).toLocaleString('id-ID')}`;
        else if (key === 'maxNominal') label = `Max: Rp ${parseInt(value).toLocaleString('id-ID')}`;
        else if (key === 'dateFrom') label = `From: ${value}`;
        else if (key === 'dateTo') label = `To: ${value}`;
        else if (key === 'search') label = `Search: "${value}"`;
        else if (key === 'kategori') label = `Kategori: ${value}`;
        else if (key === 'akunId') label = `Akun: ${value}`; // ideally map ID to Name

        filters.push({ key, value, label });
    });

    const removeFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        // Handle array param removal logic if multiple same keys? 
        // URLSearchParams handles multiple keys. Next.js usually merges or repeats.
        // If I use getAll(key) and remove one value.
        
        const values = params.getAll(key);
        if (values.length > 1) {
            params.delete(key);
            values.forEach(v => {
                if (v !== value) params.append(key, v);
            });
        } else {
            params.delete(key);
        }
        
        // Reset page
        params.delete('page');
        
        router.push(`?${params.toString()}`);
    }

    const clearAll = () => {
        router.push('/transaksi');
    }

    if (filters.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 items-center mb-4">
            <span className="text-sm text-muted-foreground">Active Filters:</span>
            {filters.map((f, i) => (
                <Badge key={`${f.key}-${f.value}-${i}`} variant="secondary" className="flex gap-1 items-center px-2 py-1">
                    {f.label}
                    <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeFilter(f.key, f.value)}
                    />
                </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearAll}>
                Clear All
            </Button>
        </div>
    )
}
