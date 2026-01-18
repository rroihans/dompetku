"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatRupiah } from "@/lib/format"
import { CategoryData } from "@/lib/analytics/insights"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface Props {
    year1: number
    year2: number
    categories1: CategoryData[]
    categories2: CategoryData[]
}

export function CategoryComparisonTable({ year1, year2, categories1, categories2 }: Props) {
    // Merge categories
    const allCats = new Set([...categories1.map(c => c.name), ...categories2.map(c => c.name)]);
    const data = Array.from(allCats).map(name => {
        const c1 = categories1.find(c => c.name === name);
        const c2 = categories2.find(c => c.name === name);
        const amount1 = c1 ? c1.amount : 0;
        const amount2 = c2 ? c2.amount : 0;
        const change = amount2 - amount1;
        const percent = amount1 !== 0 ? (change / amount1) * 100 : (amount2 !== 0 ? 100 : 0);
        
        return { name, amount1, amount2, change, percent };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)); // Sort by absolute change impact

    return (
        <div className="border rounded-md overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap">Kategori</TableHead>
                        <TableHead className="whitespace-nowrap">{year1}</TableHead>
                        <TableHead className="whitespace-nowrap">{year2}</TableHead>
                        <TableHead className="whitespace-nowrap">Perubahan (Rp)</TableHead>
                        <TableHead className="whitespace-nowrap">Perubahan (%)</TableHead>
                        <TableHead className="whitespace-nowrap">Trend</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.name}>
                            <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatRupiah(row.amount1)}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatRupiah(row.amount2)}</TableCell>
                            <TableCell className={`whitespace-nowrap ${row.change > 0 ? "text-red-500" : "text-emerald-500"}`}>
                                {row.change > 0 ? '+' : ''}{formatRupiah(row.change)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{row.percent.toFixed(1)}%</TableCell>
                            <TableCell className="whitespace-nowrap">
                                {row.change > 0 ? <TrendingUp className="w-4 h-4 text-red-500" /> : 
                                 row.change < 0 ? <TrendingDown className="w-4 h-4 text-emerald-500" /> : 
                                 <Minus className="w-4 h-4 text-gray-400" />}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}