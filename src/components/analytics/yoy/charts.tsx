"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatRupiah } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MonthlyData {
    month: number
    expense: number
    income: number
}

interface Props {
    year1: number
    year2: number
    monthly1: MonthlyData[]
    monthly2: MonthlyData[]
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function YoYCharts({ year1, year2, monthly1, monthly2 }: Props) {
    const data = MONTHS.map((m, i) => ({
        name: m,
        [year1]: monthly1[i].expense,
        [year2]: monthly2[i].expense,
        [`${year1}_inc`]: monthly1[i].income,
        [`${year2}_inc`]: monthly2[i].income,
    }));

    // Cumulative data for Line Chart
    let cum1 = 0;
    let cum2 = 0;
    const lineData = MONTHS.map((m, i) => {
        cum1 += monthly1[i].expense;
        cum2 += monthly2[i].expense;
        return {
            name: m,
            [year1]: cum1,
            [year2]: cum2
        };
    });

    return (
        <Tabs defaultValue="monthly" className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Visualisasi Pengeluaran</h3>
                <TabsList>
                    <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                    <TabsTrigger value="cumulative">Kumulatif</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="monthly">
                <Card>
                    <CardContent className="pt-6 h-[300px] sm:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis 
                                    tickFormatter={(val) => `Rp ${val/1000000}M`} 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={50}
                                />
                                <Tooltip formatter={(val: any) => formatRupiah(Number(val))} />
                                <Legend />
                                <Bar dataKey={year1} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey={year2} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="cumulative">
                <Card>
                    <CardContent className="pt-6 h-[300px] sm:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis 
                                    tickFormatter={(val) => `Rp ${val/1000000}M`} 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    width={50} 
                                />
                                <Tooltip formatter={(val: any) => formatRupiah(Number(val))} />
                                <Legend />
                                <Line type="monotone" dataKey={year1} stroke="#94a3b8" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey={year2} stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
