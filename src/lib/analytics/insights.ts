import { formatRupiah } from "@/lib/format"

export interface CategoryData {
    name: string
    amount: number // Float
    type: 'income' | 'essential' | 'discretionary'
}

export interface MonthlyData {
    month: number
    year: number
    categories: CategoryData[]
    totalIncome: number
    totalExpense: number
}

export interface Insight {
    type: 'increase' | 'decrease'
    category: string
    amount: number
    percentage: number
    message: string
}

export function generateInsights(current: MonthlyData, previous: MonthlyData): Insight[] {
    const insights: Insight[] = [];
    const MIN_CHANGE_AMOUNT = 100000;
    const THRESHOLDS: Record<string, number> = { income: 10, essential: 20, discretionary: 30 };

    // Map previous categories for easy lookup
    const prevMap = new Map(previous.categories.map(c => [c.name, c]));

    // Check categories present in current month
    for (const cat of current.categories) {
        const prevCat = prevMap.get(cat.name);
        const prevAmount = prevCat ? prevCat.amount : 0;
        
        // Skip if both 0
        if (cat.amount === 0 && prevAmount === 0) continue;

        const change = cat.amount - prevAmount; // Positive = Increase

        if (Math.abs(change) >= MIN_CHANGE_AMOUNT) {
            // Avoid division by zero
            const percentChange = prevAmount !== 0 ? (change / prevAmount) * 100 : 100;
            
            // Determine type if not provided (fallback)
            const threshold = THRESHOLDS[cat.type] || 25;

            if (Math.abs(percentChange) >= threshold) {
                insights.push({
                    type: change > 0 ? 'increase' : 'decrease',
                    category: cat.name,
                    amount: Math.abs(change),
                    percentage: Math.abs(percentChange),
                    message: generateMessage(cat, change, percentChange)
                });
            }
        }
    }
    
    // Check categories present ONLY in previous month (dropped to 0)
    for (const prevCat of previous.categories) {
        const currCat = current.categories.find(c => c.name === prevCat.name);
        if (!currCat) {
            // Dropped to 0
            const change = -prevCat.amount;
            if (Math.abs(change) >= MIN_CHANGE_AMOUNT) {
                const percentChange = -100;
                const threshold = THRESHOLDS[prevCat.type] || 25;
                if (Math.abs(percentChange) >= threshold) {
                    insights.push({
                        type: 'decrease',
                        category: prevCat.name,
                        amount: Math.abs(change),
                        percentage: 100,
                        message: generateMessage(prevCat, change, percentChange)
                    });
                }
            }
        }
    }
    
    return insights.sort((a, b) => b.amount - a.amount); // Sort by impact
}

function generateMessage(category: CategoryData, change: number, percent: number) {
    const direction = change > 0 ? 'naik' : 'turun';
    const emoji = change > 0 ? '📈' : '📉';

    if (category.name === 'Makan & Minum' && change > 0) {
        return `${emoji} Pengeluaran makan ${direction} ${Math.abs(percent).toFixed(0)}% (${formatRupiah(Math.abs(change))}). Pertimbangkan meal prep untuk hemat!`;
    }
    
    if (category.type === 'income' && change < 0) {
        return `⚠️ Pemasukan ${direction} ${Math.abs(percent).toFixed(0)}% (${formatRupiah(Math.abs(change))}). Periksa sumber pendapatan Anda.`;
    }

    return `${emoji} ${category.name} ${direction} ${Math.abs(percent).toFixed(0)}% (${formatRupiah(Math.abs(change))})`;
}
