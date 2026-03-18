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
      
      {/* MAGIA W TLE: Rozmyte, żyjące gradienty (Mesh Gradient) */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="fixed bottom-1/4 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '12s' }}></div>
      <div className="fixed top-1/2 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '10s' }}></div>

      {/* GŁÓWNY KONTENER (Rozszerzony na niemal cały ekran) */}
      <div className="max-w-[1920px] mx-auto w-full space-y-6 relative z-10">
        
        {/* 1. ASYSTENT NA SAMEJ GÓRZE */}
        <div className="w-full animate-in fade-in slide-in-from-top-4 duration-700">
          <DailyBriefing initialData={safeSerialize(briefingData)}/>
        </div>
        
        {/* 2. GŁÓWNA SIATKA DASHBOARDU (3 Kolumny) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* PIERWSZY RZĄD: Główny Widget (2/3 ekranu) */}
          <div className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both h-full">
            <MainWidget 
              currentStats={safeSerialize(stats)} 
              summaries={safeSerialize(summaries)} 
            />
          </div>

          {/* PIERWSZY RZĄD: Puste pole obok (1/3 ekranu) - idealne na coś szybkiego */}
          <div className="lg:col-span-1 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center min-h-[160px] h-full text-zinc-500 text-sm font-medium text-center transition-all duration-500 hover:shadow-xl hover:border-indigo-500/30 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
            Miejsce na przyszły widget<br/>(np. Szybkie Akcje)
          </div>

          {/* DRUGI RZĄD: Czas Pracy (1/3 ekranu) */}
          <div className="lg:col-span-1 group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            <div className="transition-transform duration-500 group-hover:-translate-y-1 h-full">
              <WorkWidget workDays={safeSerialize(currentMonthWorkDays)} />
            </div>
          </div>

          {/* DRUGI RZĄD: Zdrowie (1/3 ekranu) */}
          <div className="lg:col-span-1 group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            <div className="transition-transform duration-500 group-hover:-translate-y-1 h-full">
              <HealthWidget 
                healthDays={safeSerialize(currentMonthHealthDays)} 
                healthEntries={safeSerialize(currentMonthHealthEntries)} 
              />
            </div>
          </div>

          {/* DRUGI RZĄD: Puste pole dopełniające (1/3 ekranu) */}
          <div className="lg:col-span-1 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-dashed border-zinc-300 dark:border-zinc-800/50 rounded-3xl p-6 flex items-center justify-center min-h-[300px] text-zinc-500 text-sm font-medium text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            Miejsce na kolejny moduł<br/>(np. Garaż lub Wykres)
          </div>

        </div>

      </div>
    </div>
  );
}