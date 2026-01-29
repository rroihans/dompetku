"use client";

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Wallet,
    CreditCard,
    Smartphone,
    Banknote,
    ArrowUpRight,
    History,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react"
import { AddAccountForm } from "@/components/forms/add-account-form"
import { TransferForm } from "@/components/forms/transfer-form"
import { AkunActions } from "@/components/akun/akun-actions"
import { getAkunUser } from "@/lib/db/accounts-repo"
import { getActiveAccountTemplates, type AccountTemplateDTO } from "@/lib/db/templates-repo"
import { formatRupiah } from "@/lib/format"
import { calculateNextBillingDate } from "@/lib/template-utils"
import Link from "next/link"
import type { AccountDTO } from "@/lib/account-dto"

export default function AkunPage() {
    const searchParams = useSearchParams()
    const currentPage = Number(searchParams.get("page")) || 1

    const [accounts, setAccounts] = useState<AccountDTO[]>([])
    const [templates, setTemplates] = useState<AccountTemplateDTO[]>([])
    const [pagination, setPagination] = useState({ page: 1, pageSize: 8, total: 0, totalPages: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const [accResult, tmplResult] = await Promise.all([
                    getAkunUser(currentPage),
                    getActiveAccountTemplates()
                ])
                setAccounts(accResult.data)
                setPagination(accResult.pagination)
                setTemplates(tmplResult)
            } catch (error) {
                console.error("Failed to fetch accounts", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        const handleAccountUpdate = () => {
            fetchData()
        }

        window.addEventListener('account-updated', handleAccountUpdate)
        return () => window.removeEventListener('account-updated', handleAccountUpdate)
    }, [currentPage])

    const getIcon = (type: string) => {
        switch (type) {
            case 'BANK': return Wallet
            case 'E_WALLET': return Smartphone
            case 'CREDIT_CARD': return CreditCard
            case 'CASH': return Banknote
            default: return Wallet
        }
    }

    const getDefaultColor = (type: string) => {
        switch (type) {
            case 'BANK': return '#3b82f6' // blue
            case 'E_WALLET': return '#8b5cf6' // purple
            case 'CREDIT_CARD': return '#ef4444' // red
            case 'CASH': return '#22c55e' // green
            default: return '#6b7280' // gray
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'BANK': return { label: 'Bank', bg: '#dbeafe', text: '#1d4ed8' }
            case 'E_WALLET': return { label: 'E-Wallet', bg: '#ede9fe', text: '#7c3aed' }
            case 'CREDIT_CARD': return { label: 'Kartu Kredit', bg: '#fee2e2', text: '#dc2626' }
            case 'CASH': return { label: 'Tunai', bg: '#dcfce7', text: '#16a34a' }
            default: return { label: type, bg: '#f3f4f6', text: '#4b5563' }
        }
    }

    return (
        <div className="space-y-6 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Manajemen Akun</h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Kelola semua rekening bank, e-wallet, dan kartu kredit Anda.
                    </p>
                </div>
                <div className="flex gap-2">
                    <TransferForm />
                    <AddAccountForm templates={templates} />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2">
                        {accounts.map((account) => {
                            const Icon = getIcon(account.tipe)
                            const isNegative = account.saldoSekarang < 0
                            // Use custom color or default based on type
                            const accentColor = account.warna || getDefaultColor(account.tipe)
                            const typeBadge = getTypeBadge(account.tipe)

                            // Find template name if exists
                            const templateName = account.templateId
                                ? templates.find(t => t.id === account.templateId)?.nama
                                : null

                            // Calculate next billing derived from template info stored in account or template lookup
                            // Logic: AccountDTO has billing/admin fields usually copied from template.
                            // The original code accessed `account.template` which likely came from a relation.
                            // In Dexie, we might not have the relation populated unless we do it manually.
                            // account-dto has: templateId, templateSource, override fields.
                            // But `account.template` object is not standard in DTO unless we join.
                            // Let's use the `templates` list to find the template if needed for display.
                            const template = account.templateId ? templates.find(t => t.id === account.templateId) : null;

                            return (
                                <Card
                                    key={account.id}
                                    className="overflow-hidden hover:shadow-md transition-shadow"
                                    style={{ borderLeftWidth: '4px', borderLeftColor: accentColor }}
                                >
                                    <div className="flex flex-row items-center justify-between pr-4">
                                        <Link href={`/akun/detail?id=${account.id}`} className="flex-1">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="p-2 rounded-lg"
                                                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                                    >
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <CardTitle className="text-lg">{account.nama}</CardTitle>
                                                            <span
                                                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                                style={{
                                                                    backgroundColor: typeBadge.bg,
                                                                    color: typeBadge.text
                                                                }}
                                                            >
                                                                {typeBadge.label}
                                                            </span>
                                                        </div>
                                                        {template && (
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Wallet className="w-3 h-3 text-primary" />
                                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                                    {template.nama} • Next: {calculateNextBillingDate(
                                                                        template.polaTagihan,
                                                                        template.tanggalTagihan || 1, // Fallback
                                                                        new Date()
                                                                    ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Link>
                                        <AkunActions akun={account} templates={templates} />
                                    </div>
                                    <Link href={`/akun/detail?id=${account.id}`}>
                                        <CardContent>
                                            <div className="mt-2 flex items-baseline justify-between">
                                                <div className={`text-2xl font-bold ${isNegative ? 'text-destructive' : ''}`} data-private="true">
                                                    {formatRupiah(account.saldoSekarang)}
                                                    {isNegative && <span className="text-sm ml-1 font-normal">(Hutang)</span>}
                                                </div>
                                            </div>

                                            {account.limitKredit && (
                                                <div className="mt-4 space-y-1">
                                                    <div className="flex justify-between text-xs font-medium">
                                                        <span>Penggunaan Limit</span>
                                                        <span>{Math.round((Math.abs(account.saldoSekarang) / account.limitKredit) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full transition-all"
                                                            style={{
                                                                width: `${Math.round((Math.abs(account.saldoSekarang) / account.limitKredit) * 100)}%`,
                                                                backgroundColor: accentColor
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-muted-foreground overflow-hidden">
                                                        <span className="truncate">Limit: <span data-private="true">{formatRupiah(account.limitKredit)}</span></span>
                                                        <span className="truncate text-right">Tersedia: <span data-private="true">{formatRupiah(account.limitKredit + account.saldoSekarang)}</span></span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Link>
                                    <CardContent className="pb-4">
                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                            <span className="truncate">Klik untuk detail</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Menampilkan {accounts.length} dari {pagination.total} akun
                            </span>
                            <div className="flex items-center gap-2">
                                <Link href={`/akun?page=${Math.max(1, currentPage - 1)}`} className={currentPage <= 1 ? "pointer-events-none" : ""}>
                                    <Button variant="outline" size="sm" className="gap-1" disabled={currentPage <= 1}>
                                        <ChevronLeft className="w-4 h-4" /> Sebelumnya
                                    </Button>
                                </Link>
                                <span className="text-sm px-2">
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                                <Link href={`/akun?page=${Math.min(pagination.totalPages, currentPage + 1)}`} className={currentPage >= pagination.totalPages ? "pointer-events-none" : ""}>
                                    <Button variant="outline" size="sm" className="gap-1" disabled={currentPage >= pagination.totalPages}>
                                        Berikutnya <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {accounts.length === 0 && (
                        <Card className="border-2 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Wallet className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Belum Ada Akun</h3>
                                <p className="text-muted-foreground text-center mb-4 max-w-md">
                                    Mulai dengan menambahkan rekening bank, e-wallet, atau kartu kredit Anda.
                                </p>
                                <AddAccountForm templates={templates} />
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}
