import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    FileText,
    Plus,
    Zap,
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    Trash2
} from "lucide-react"
import Link from "next/link"
import { getTemplates } from "@/app/actions/template"
import { formatRupiah } from "@/lib/format"
import { AddTemplateForm } from "@/components/forms/add-template-form"
import { UseTemplateButton } from "@/components/template/use-template-button"
import { DeleteTemplateButton } from "@/components/template/delete-template-button"
import prisma from "@/lib/prisma"

const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

export default async function TemplatePage() {
    const [templatesResult, akuns] = await Promise.all([
        getTemplates(),
        prisma.akun.findMany({
            where: { tipe: { in: USER_ACCOUNT_TYPES } },
            orderBy: { nama: "asc" }
        })
    ])

    const templates = templatesResult.data || []

    // Get kategori from expense accounts
    const expenseAkuns = await prisma.akun.findMany({
        where: { tipe: "EXPENSE" },
        select: { nama: true }
    })
    const kategoris = expenseAkuns.map(a => a.nama.replace("[EXPENSE] ", ""))

    // Get kategori income
    const incomeAkuns = await prisma.akun.findMany({
        where: { tipe: "INCOME" },
        select: { nama: true }
    })
    const kategoriIncome = incomeAkuns.map(a => a.nama.replace("[INCOME] ", ""))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            Template Transaksi
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Buat transaksi cepat dengan template tersimpan
                        </p>
                    </div>
                </div>
                <AddTemplateForm
                    akuns={akuns}
                    kategoriExpense={kategoris}
                    kategoriIncome={kategoriIncome}
                />
            </div>

            {/* Quick Use Templates */}
            {templates.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="w-5 h-5 text-amber-500" />
                            Quick Add
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {templates.slice(0, 6).map(template => (
                                <UseTemplateButton
                                    key={template.id}
                                    template={template}
                                    variant="quick"
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Template List */}
            {templates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                        <Card key={template.id} className="hover:shadow-md transition-all">
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`p-2 rounded-full ${template.tipeTransaksi === "KELUAR"
                                                    ? 'bg-red-100 dark:bg-red-900'
                                                    : 'bg-emerald-100 dark:bg-emerald-900'
                                                }`}
                                        >
                                            {template.tipeTransaksi === "KELUAR"
                                                ? <TrendingDown className="w-4 h-4 text-red-500" />
                                                : <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            }
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{template.nama}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {template.kategori}
                                            </p>
                                        </div>
                                    </div>
                                    <DeleteTemplateButton id={template.id} nama={template.nama} />
                                </div>

                                <p className="text-sm text-muted-foreground mb-2">
                                    {template.deskripsi}
                                </p>

                                <div className="flex items-center justify-between">
                                    <p className={`font-bold ${template.tipeTransaksi === "KELUAR" ? 'text-red-500' : 'text-emerald-500'
                                        }`} data-private="true">
                                        {template.tipeTransaksi === "KELUAR" ? '-' : '+'}{formatRupiah(template.nominal)}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {template.usageCount}x digunakan
                                        </span>
                                        <UseTemplateButton template={template} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Belum Ada Template</h3>
                        <p className="text-muted-foreground text-center mb-4 max-w-md">
                            Buat template untuk transaksi yang sering Anda lakukan, seperti beli kopi, bayar parkir, atau terima gaji.
                        </p>
                        <AddTemplateForm
                            akuns={akuns}
                            kategoriExpense={kategoris}
                            kategoriIncome={kategoriIncome}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Tips */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                        💡 Tips
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Template paling sering digunakan muncul di Quick Add</li>
                        <li>• Anda juga bisa simpan transaksi yang sudah ada sebagai template</li>
                        <li>• Nominal bisa diubah saat menggunakan template</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
