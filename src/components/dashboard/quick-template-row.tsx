"use client";

import { useState, useRef, useCallback } from "react";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { TemplateCard } from "./template-card";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
import { TemplateTransaksiRecord } from "@/lib/db/app-db";
import { AddTransactionForm } from "@/components/forms/add-transaction-form";

interface QuickTemplateRowProps {
  templates: TemplateTransaksiRecord[];
}

export function QuickTemplateRow({ templates }: QuickTemplateRowProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateTransaksiRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTemplateClick = (template: TemplateTransaksiRecord) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  // Keyboard navigation for horizontal scroll
  const handleScrollKeyDown = useCallback((e: React.KeyboardEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 176; // 160px card + 16px gap

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        container.scrollTo({
          left: container.scrollLeft - cardWidth,
          behavior: "smooth"
        });
        break;
      case "ArrowRight":
        e.preventDefault();
        container.scrollTo({
          left: container.scrollLeft + cardWidth,
          behavior: "smooth"
        });
        break;
      case "Home":
        e.preventDefault();
        container.scrollTo({ left: 0, behavior: "smooth" });
        break;
      case "End":
        e.preventDefault();
        container.scrollTo({
          left: container.scrollWidth - container.clientWidth,
          behavior: "smooth"
        });
        break;
    }
  }, []);

  return (
    <div className="space-y-3" role="region" aria-label="Template transaksi cepat">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-4 w-4" aria-hidden="true" /> Template Cepat
        </h3>
        <Link href="/template" className="text-xs text-primary font-medium hover:underline">
          Lihat Semua
        </Link>
      </div>

      {/* Screen reader instruction */}
      <span className="sr-only">Gunakan tombol panah kiri/kanan untuk navigasi template</span>

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum Ada Template"
          description="Buat template untuk transaksi yang sering dilakukan"
          action={
            <Link href="/template">
              <Button size="sm" variant="outline" className="mt-2 gap-2">
                <Plus className="h-4 w-4" /> Buat Template
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-3 pb-4 pt-1 snap-x snap-mandatory scrollbar-hide px-4 sm:px-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-lg"
            role="list"
            tabIndex={0}
            onKeyDown={handleScrollKeyDown}
            aria-label="Daftar template transaksi"
          >
            {templates.map((template) => (
              <div key={template.id} role="listitem">
                <TemplateCard
                  template={template}
                  onClick={() => handleTemplateClick(template)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <AddTransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialValues={selectedTemplate ? {
          nominal: selectedTemplate.nominal,
          kategori: selectedTemplate.kategori,
          akunId: selectedTemplate.akunId,
          tipeTransaksi: selectedTemplate.tipeTransaksi as "MASUK" | "KELUAR",
          deskripsi: selectedTemplate.deskripsi,
        } : undefined}
      />
    </div>
  );
}
