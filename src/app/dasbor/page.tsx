"use client";

import { useEffect, useState } from "react";
import { getDashboardAnalytics } from "@/lib/db/analytics-repo";
import { getTransactionTemplates } from "@/lib/db/transaction-templates-repo";
import { BudgetBanner } from "@/components/dashboard/budget-banner";
import { TodaySection } from "@/components/dashboard/today-section";
import { QuickTemplateRow } from "@/components/dashboard/quick-template-row";
import { MonthlyOverview } from "@/components/dashboard/monthly-overview";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateTransaksiRecord } from "@/lib/db/app-db";

export default function NewDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    analytics: any;
    templates: TemplateTransaksiRecord[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [analytics, templatesResult] = await Promise.all([
          getDashboardAnalytics(),
          getTransactionTemplates({ limit: 20 })
        ]);

        setData({
          analytics,
          templates: templatesResult.data || []
        });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const { analytics, templates } = data;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Dasbor</h2>
        <p className="text-xs text-muted-foreground">
          Ringkasan aktivitas hari ini & status keuangan.
        </p>
      </div>

      {/* Budget Banner */}
      <BudgetBanner />

      {/* Today's Section */}
      <TodaySection 
        todayData={analytics.today}
        yesterdayData={analytics.yesterday}
        comparison={analytics.comparison}
      />

      {/* Quick Template Access */}
      <QuickTemplateRow templates={templates} />

      {/* Monthly Overview */}
      <MonthlyOverview 
        monthlyData={{
          income: analytics.pemasukanBulanIni,
          expense: analytics.pengeluaranBulanIni,
          net: analytics.selisihBulanIni,
          categories: analytics.pengeluaranPerKategori
        }}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      <Skeleton className="h-16 w-full rounded-lg" />
      
      <div className="space-y-2">
        <div className="flex justify-between">
           <Skeleton className="h-5 w-24" />
           <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      
      <div className="space-y-2">
         <Skeleton className="h-5 w-32" />
         <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-32 w-40 shrink-0 rounded-lg" />
            <Skeleton className="h-32 w-40 shrink-0 rounded-lg" />
            <Skeleton className="h-32 w-40 shrink-0 rounded-lg" />
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Skeleton className="h-48 rounded-lg" />
         <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}
