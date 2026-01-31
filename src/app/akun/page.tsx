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
            case 'CREDIT_CARD': return { label: 'Kredit', bg: '#fee2e2', text: '#dc2626' }
            case 'CASH': return { label: 'Tunai', bg: '#dcfce7', text: '#16a34a' }
            default: return { label: type, bg: '#f3f4f6', text: '#4b5563' }
        }
    }

    return (
        <div className="space-y-6 max-w-full overflow-hidden pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Akun & Aset</h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Kelola rekening, e-wallet, dan kartu kredit.
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
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {accounts.map((account) => {
                            const Icon = getIcon(account.tipe)
                            const isNegative = account.saldoSekarang < 0
                            const accentColor = account.warna || getDefaultColor(account.tipe)
                            const typeBadge = getTypeBadge(account.tipe)

                            const template = account.templateId ? templates.find(t => t.id === account.templateId) : null;

                            return (
                                <Card
                                    key={account.id}
                                    className="overflow-hidden hover:shadow-md transition-shadow"
                                    style={{ borderLeftWidth: '4px', borderLeftColor: accentColor }}
                                >
                                    <div className="flex flex-row items-center justify-between pr-2 pt-2">
                                        <Link href={`/akun/detail?id=${account.id}`} className="flex-1 min-w-0">
                                            <div className="flex flex-row items-center gap-3 p-3">
                                                <div
                                                    className="p-2 rounded-lg shrink-0"
                                                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-bold truncate">{account.nama}</h3>
                                                        <span
                                                            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                                                            style={{
                                                                backgroundColor: typeBadge.bg,
                                                                color: typeBadge.text
                                                            }}
                                                        >
                                                            {typeBadge.label}
                                                        </span>
                                                    </div>
                                                    {template && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <span>Next bill: {calculateNextBillingDate(
                                                                template.polaTagihan,
                                                                template.tanggalTagihan || 1,
                                                                new Date()
                                                            ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="shrink-0">
                                            <AkunActions akun={account} templates={templates} />
                                        </div>
                                    </div>

                                    <Link href={`/akun/detail?id=${account.id}`}>
                                        <CardContent className="p-3 pt-0">
                                            <div className="flex items-baseline justify-between mt-1">
                                                <div className={`text-xl font-bold ${isNegative ? 'text-destructive' : ''}`} data-private="true">
                                                    {formatRupiah(account.saldoSekarang)}
                                                    {isNegative && <span className="text-xs ml-1 font-normal text-muted-foreground">(Hutang)</span>}
                                                </div>
                                            </div>

                                            {account.limitKredit && (
                                                <div className="mt-3 space-y-1.5">
                                                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                                                        <span>Terpakai {Math.round((Math.abs(account.saldoSekarang) / account.limitKredit) * 100)}%</span>
                                                        <span className="truncate">Sisa: <span data-private="true">{formatRupiah(account.limitKredit + account.saldoSekarang)}</span></span>
                                                    </div>
                                                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full transition-all"
                                                            style={{
                                                                width: `${Math.round((Math.abs(account.saldoSekarang) / account.limitKredit) * 100)}%`,
                                                                backgroundColor: accentColor
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Link>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <Link href={`/akun?page=${Math.max(1, currentPage - 1)}`} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
                                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                            <span className="text-xs text-muted-foreground">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <Link href={`/akun?page=${Math.min(pagination.totalPages, currentPage + 1)}`} className={currentPage >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}>
                                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= pagination.totalPages}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Empty State */}
                    {accounts.length === 0 && (
                        <Card className="border-2 border-dashed bg-muted/10">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <Wallet className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                                <h3 className="text-lg font-semibold mb-1">Belum Ada Akun</h3>
                                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                                    Tambahkan rekening atau e-wallet untuk mulai mencatat.
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
