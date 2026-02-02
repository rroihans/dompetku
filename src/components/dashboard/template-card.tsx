import { Card, CardContent } from "@/components/ui/card";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { formatRupiah } from "@/lib/format";
import { TemplateTransaksiRecord } from "@/lib/db/app-db";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: TemplateTransaksiRecord;
  onClick?: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  // Determine color based on tipeTransaksi if template.warna is missing
  const isExpense = template.tipeTransaksi === "KELUAR";
  const defaultColor = isExpense ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600";
  const iconBgColor = template.warna ? `bg-[${template.warna}]/10 text-[${template.warna}]` : defaultColor;
  
  // Note: Tailwind arbitrary values with dynamic strings might not work if not safe-listed.
  // Ideally we use style or valid classes. For now using style for custom hex colors if provided.
  const customStyle = template.warna ? { backgroundColor: `${template.warna}20`, color: template.warna } : {};

  // Keyboard activation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // Prevent space from scrolling page
      onClick?.();
    }
  };

  return (
    <div 
      className="snap-start shrink-0 w-[160px] cursor-pointer focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded-lg"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Template ${template.nama}, kategori ${template.kategori}, nominal ${formatRupiah(template.nominal)}`}
    >
      <Card className="h-full hover:scale-105 transition-transform duration-200 border shadow-sm">
        <CardContent className="p-3 flex flex-col h-full">
          <div 
            className={cn("h-10 w-10 rounded-full flex items-center justify-center mb-2", !template.warna && defaultColor)}
            style={customStyle}
            aria-hidden="true"
          >
            <DynamicIcon name={template.icon} fallback={FileText} className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate leading-tight mb-1" title={template.nama}>
              {template.nama}
            </h4>
            <p className="text-[10px] text-muted-foreground bg-muted inline-block px-1.5 py-0.5 rounded-sm truncate max-w-full mb-2">
              {template.kategori}
            </p>
          </div>

          <div className="mt-auto">
            <p 
              className={cn("text-xs font-bold truncate", isExpense ? "text-red-500" : "text-emerald-500")}
              data-private="true"
            >
              {formatRupiah(template.nominal)}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {template.usageCount}x digunakan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
