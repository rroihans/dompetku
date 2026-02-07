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

    const lineData = MONTHS.reduce<Array<{ name: string } & Record<number, number>>>((acc, m, i) => {
        const prevCum1 = i > 0 ? (acc[i - 1][year1] as number) : 0;
        const prevCum2 = i > 0 ? (acc[i - 1][year2] as number) : 0;
        acc.push({
            name: m,
            [year1]: prevCum1 + monthly1[i].expense,
            [year2]: prevCum2 + monthly2[i].expense
        });
        return acc;
    }, []);

    return (
        <Tabs defaultValue="monthly" className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Visualisasi Pengeluaran</h3>
                <TabsList>
                    <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                    <TabsTrigger value="cumulative">Kumulatif</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="monthly" className="w-full">
                <Card className="w-full">
                    <CardContent className="p-0 sm:p-6 pt-6 overflow-hidden">
                        <div className="w-full h-[350px] sm:h-[450px] min-h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis
                                        tickFormatter={(val) => `${val / 1000000}M`}
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        width={40}
                                    />
                                    <Tooltip formatter={(val: number | undefined) => formatRupiah(val ?? 0)} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey={year1} name={`Tahun ${year1}`} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey={year2} name={`Tahun ${year2}`} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="cumulative" className="w-full">
                <Card className="w-full">
                    <CardContent className="p-0 sm:p-6 pt-6 overflow-hidden">
                        <div className="w-full h-[350px] sm:h-[450px] min-h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis
                                        tickFormatter={(val) => `${val / 1000000}M`}
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        width={40}
                                    />
                                    <Tooltip formatter={(val: number | undefined) => formatRupiah(val ?? 0)} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Line type="monotone" dataKey={year1} name={`Kumulatif ${year1}`} stroke="#94a3b8" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey={year2} name={`Kumulatif ${year2}`} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
