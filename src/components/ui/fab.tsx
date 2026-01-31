"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRightLeft, FileText, X } from "lucide-react"
import { AddTransactionForm } from "@/components/forms/add-transaction-form"
import { TransferForm } from "@/components/forms/transfer-form"
import { cn } from "@/lib/utils"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
// import Link from "next/link" // Removed as we use buttons now
import { getTransactionTemplates } from "@/lib/db/transaction-templates-repo"
import type { TemplateTransaksiRecord } from "@/lib/db/app-db"

export function FAB() {
    const [isOpen, setIsOpen] = useState(false)
    const [showAddTransaction, setShowAddTransaction] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)
    const [templates, setTemplates] = useState<TemplateTransaksiRecord[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateTransaksiRecord | null>(null)

    useEffect(() => {
        if (isOpen) {
            getTransactionTemplates().then(res => {
                if (res.success && res.data) {
                    setTemplates(res.data.slice(0, 5)) // Limit to 5
                }
            })
        }
    }, [isOpen])

    const handleTemplateClick = (template: TemplateTransaksiRecord) => {
        setSelectedTemplate(template)
        setShowAddTransaction(true)
        setIsOpen(false)
    }

    const handleNewRecord = () => {
        setSelectedTemplate(null)
        setShowAddTransaction(true)
        setIsOpen(false)
    }

    return (
        <>
            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[44] bg-background/80 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className="fixed bottom-6 right-6 z-[45] flex flex-col items-end gap-3">
                {/* Menu Items Container */}
                <div className={cn(
                    "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom-right",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-10 pointer-events-none"
                )}>

                    {/* Templates Dynamic List */}
                    {templates.map((template, idx) => (
                        <div key={template.id} className="flex items-center gap-3">
                            <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                                Template: {template.nama}
                            </span>
                            <Button
                                onClick={() => handleTemplateClick(template)}
                                size="icon"
                                className="rounded-full shadow-lg h-11 w-11 bg-orange-100 text-orange-600 hover:bg-orange-200 border-none transition-transform hover:scale-105"
                            >
                                <DynamicIcon name={template.icon} fallback={FileText} className="h-5 w-5" />
                            </Button>
                        </div>
                    ))}

                    {/* Transfer */}
                    <div className="flex items-center gap-3">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200 delay-100">
                            Transfer
                        </span>
                        <Button
                            onClick={() => {
                                setShowTransfer(true)
                                setIsOpen(false)
                            }}
                            size="icon"
                            className="rounded-full shadow-lg h-11 w-11 bg-blue-100 text-blue-600 hover:bg-blue-200 border-none transition-transform hover:scale-105"
                        >
                            <ArrowRightLeft className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* New Record */}
                    <div className="flex items-center gap-3">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200 delay-150">
                            New record
                        </span>
                        <Button
                            onClick={handleNewRecord}
                            size="icon"
                            className="rounded-full shadow-lg h-11 w-11 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 border-none transition-transform hover:scale-105"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Toggle Button */}
                <Button
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-xl transition-all duration-300 z-[56]",
                        isOpen ? "rotate-45 bg-blue-600" : "bg-blue-500 hover:bg-blue-600"
                    )}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Plus className="h-6 w-6 text-white" />
                </Button>
            </div>

            {/* Controlled Forms */}
            <AddTransactionForm
                open={showAddTransaction}
                onOpenChange={setShowAddTransaction}
                initialValues={selectedTemplate ? {
                    nominal: selectedTemplate.nominal,
                    kategori: selectedTemplate.kategori,
                    akunId: selectedTemplate.akunId,
                    tipeTransaksi: selectedTemplate.tipeTransaksi as "MASUK" | "KELUAR",
                    deskripsi: selectedTemplate.deskripsi,
                } : undefined}
            />

            <TransferForm
                open={showTransfer} // TransferForm might need similar refactor if strictly controlled
                onOpenChange={setShowTransfer} // Assuming TransferForm supports this or I wrap it
            />
        </>
    )
}
