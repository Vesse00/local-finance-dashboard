import { DailyBriefing } from "@/components/dashboard/daily-briefing";
import { MainWidget } from "@/components/dashboard/main-widget";
import { WorkWidget } from "@/components/dashboard/work-widget";
import { HealthWidget } from "@/components/dashboard/health-widget";
import { getDashboardStats } from "@/lib/actions";
import { getBriefingData } from "@/lib/services/briefing"; // Zgrabnie i elegancko podzielone!
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";


// Bezpieczna konwersja danych z bazy (BigInt do String)
const safeSerialize = (data: any) => 
  JSON.parse(JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));

export default async function DashboardPage() {
  const [stats, briefingData] = await Promise.all([
    getDashboardStats(),
    getBriefingData() // <--- NASZE NOWE POBIERANIE W TLE
  ]);
  
  const user = await prisma.user.findFirst({
    include: {
      monthSummaries: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  const summaries = user?.monthSummaries || [];
  const now = new Date();
  
  const currentMonthWorkDays = user ? await prisma.workDay.findMany({
    where: { userId: user.id, date: { gte: startOfMonth(now), lte: endOfMonth(now) } }
  }) : [];

  const currentMonthHealthDays = user ? await prisma.healthDay.findMany({
    where: { userId: user.id, date: { gte: startOfMonth(now), lte: endOfMonth(now) } }
  }) : [];
  
  const currentMonthHealthEntries = user ? await prisma.healthEntry.findMany({
    where: { userId: user.id, date: { gte: startOfMonth(now), lte: endOfMonth(now) } }
  }) : [];

  return (
    <div className="relative flex-1 p-6 md:p-10 pt-6 min-h-screen overflow-hidden">

      {/* GŁÓWNY KONTENER */}
      <div className="max-w-[1920px] mx-auto w-full space-y-6 relative z-10">
        
        {/* 1. ASYSTENT NA SAMEJ GÓRZE */}
        <div className="w-full animate-in fade-in slide-in-from-top-4 duration-700">
          <DailyBriefing initialData={safeSerialize(briefingData)} currency={user?.currency || "PLN"} />
        </div>
        
        {/* 2. GŁÓWNA SIATKA DASHBOARDU (3 Kolumny) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* PIERWSZY RZĄD: Główny Widget (2/3 ekranu) */}
          <div className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both h-full">
            <MainWidget 
              currentStats={safeSerialize(stats)} 
              summaries={safeSerialize(summaries)} 
              currency={user?.currency || "PLN"}
              payday={user?.payday ?? 10}
            />
          </div>

          {/* PIERWSZY RZĄD: Puste pole obok (1/3 ekranu) */}
          <div className="lg:col-span-1 border border-green-900/30 border-dashed bg-black/20 p-6 flex items-center justify-center min-h-[160px] h-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
            <span className="text-xs font-mono text-green-800 text-center">{'// '} FUTURE_WIDGET<br/>quick_actions.mod</span>
          </div>

          {/* DRUGI RZĄD: Czas Pracy (1/3 ekranu) */}
          <div className="lg:col-span-1 group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
              <WorkWidget workDays={safeSerialize(currentMonthWorkDays)} />
          </div>

          {/* DRUGI RZĄD: Zdrowie (1/3 ekranu) */}
          <div className="lg:col-span-1 group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
              <HealthWidget 
                healthDays={safeSerialize(currentMonthHealthDays)} 
                healthEntries={safeSerialize(currentMonthHealthEntries)} 
              />
          </div>

          {/* DRUGI RZĄD: Puste pole dopełniające (1/3 ekranu) */}
          <div className="lg:col-span-1 border border-dashed border-green-900/30 bg-black/20 p-6 flex items-center justify-center min-h-[300px] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            <span className="text-xs font-mono text-green-800 text-center">{'// '} FUTURE_WIDGET<br/>garage_or_chart.mod</span>
          </div>

        </div>

      </div>
    </div>
  );
}