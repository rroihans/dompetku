"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRightLeft, FileText, X } from "lucide-react"
import { AddTransactionForm } from "@/components/forms/add-transaction-form"
import { TransferForm } from "@/components/forms/transfer-form"
import { cn } from "@/lib/utils"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
import { getTransactionTemplates } from "@/lib/db/transaction-templates-repo"
import type { TemplateTransaksiRecord } from "@/lib/db/app-db"

export function FAB() {
    const [isOpen, setIsOpen] = useState(false)
    const [showAddTransaction, setShowAddTransaction] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)
    const [templates, setTemplates] = useState<TemplateTransaksiRecord[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateTransaksiRecord | null>(null)
    
    // Refs for focus management
    const toggleButtonRef = useRef<HTMLButtonElement>(null)
    const firstMenuItemRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (isOpen) {
            getTransactionTemplates({ limit: 10 }).then(res => {
                if (res.success && res.data) {
                    setTemplates(res.data) 
                }
            })
            // Focus first menu item after animation
            setTimeout(() => {
                firstMenuItemRef.current?.focus()
            }, 300)
        }
    }, [isOpen])

    // Keyboard navigation - Escape key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false)
                toggleButtonRef.current?.focus()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
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

    const handleMenuItemKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            action()
        }
    }

    const closeMenu = useCallback(() => {
        setIsOpen(false)
        toggleButtonRef.current?.focus()
    }, [])

    return (
        <>
            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[44] bg-background/80 backdrop-blur-sm transition-opacity"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}

            <div className="fixed bottom-6 right-6 z-[45] flex flex-col items-end gap-3">
                {/* Menu Items Container */}
                <div 
                    id="fab-menu"
                    role="menu"
                    aria-label="Menu aksi cepat"
                    className={cn(
                        "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom-right",
                        isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-10 pointer-events-none"
                    )}
                >

                    {/* Templates Scrollable List */}
                    <div className="max-h-[50vh] overflow-y-auto flex flex-col items-end gap-3 pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                        {templates.map((template, idx) => (
                            <div key={template.id} className="flex items-center gap-3" role="menuitem">
                                <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200" style={{ animationDelay: `${idx * 30}ms` }}>
                                    {template.nama}
                                </span>
                                <Button
                                    ref={idx === 0 ? firstMenuItemRef : undefined}
                                    onClick={() => handleTemplateClick(template)}
                                    onKeyDown={(e) => handleMenuItemKeyDown(e, () => handleTemplateClick(template))}
                                    size="icon"
                                    aria-label={`Gunakan template ${template.nama}`}
                                    className="rounded-full shadow-lg h-11 w-11 bg-orange-100 text-orange-600 hover:bg-orange-200 border-none transition-transform hover:scale-105 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <DynamicIcon name={template.icon} fallback={FileText} className="h-5 w-5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Transfer */}
                    <div className="flex items-center gap-3" role="menuitem">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200 delay-100">
                            Transfer
                        </span>
                        <Button
                            ref={templates.length === 0 ? firstMenuItemRef : undefined}
                            onClick={() => {
                                setShowTransfer(true)
                                setIsOpen(false)
                            }}
                            onKeyDown={(e) => handleMenuItemKeyDown(e, () => {
                                setShowTransfer(true)
                                setIsOpen(false)
                            })}
                            size="icon"
                            aria-label="Transfer antar akun"
                            className="rounded-full shadow-lg h-11 w-11 bg-primary/10 text-primary hover:bg-primary/20 border-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <ArrowRightLeft className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* New Record */}
                    <div className="flex items-center gap-3" role="menuitem">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200 delay-150">
                            New record
                        </span>
                        <Button
                            onClick={handleNewRecord}
                            onKeyDown={(e) => handleMenuItemKeyDown(e, handleNewRecord)}
                            size="icon"
                            aria-label="Buat transaksi baru"
                            className="rounded-full shadow-lg h-11 w-11 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 border-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Toggle Button */}
                <Button
                    ref={toggleButtonRef}
                    size="icon"
                    aria-label="Menu aksi cepat"
                    aria-expanded={isOpen}
                    aria-controls="fab-menu"
                    aria-haspopup="menu"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-xl transition-all duration-300 z-[56] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isOpen ? "rotate-45 bg-primary" : "bg-primary hover:bg-primary/90"
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
                open={showTransfer}
                onOpenChange={setShowTransfer}
            />
        </>
    )
}
