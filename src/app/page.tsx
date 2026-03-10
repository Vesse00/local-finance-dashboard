import { MainWidget } from "@/components/dashboard/main-widget";
import { WorkWidget } from "@/components/dashboard/work-widget";
import { HealthWidget } from "@/components/dashboard/health-widget"; // <-- Nowy import
import { getDashboardStats } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  
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
  
  // Dane Pracy
  const currentMonthWorkDays = user ? await prisma.workDay.findMany({
    where: { userId: user.id, date: { gte: startOfMonth(now), lte: endOfMonth(now) } }
  }) : [];

  // Dane Zdrowia
  const currentMonthHealthDays = user ? await prisma.healthDay.findMany({
    where: { userId: user.id, date: { gte: startOfMonth(now), lte: endOfMonth(now) } }
  }) : [];
  
  const currentMonthHealthEntries = user ? await prisma.healthEntry.findMany({
    where: { userId: user.id, date: { gte: startOfMonth(now), lte: endOfMonth(now) } }
  }) : [];

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      
      {/* 1. GŁÓWNY WIDŻET FINANSÓW (Pełna szerokość) */}
      <div className="w-full">
        <MainWidget currentStats={stats} summaries={summaries} />
      </div>

      {/* 2. DOLNA SEKCJA WIDŻETÓW (Podzielona na 3 kolumny) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Widżet Pracy - 1 kolumna */}
        <div className="xl:col-span-1">
          <WorkWidget workDays={currentMonthWorkDays} />
        </div>

        {/* Widżet Zdrowia - 1 kolumna (NOWOŚĆ) */}
        <div className="xl:col-span-1">
          <HealthWidget healthDays={currentMonthHealthDays} healthEntries={currentMonthHealthEntries} />
        </div>

        {/* Puste miejsce na przyszły moduł (np. Ostatnie transakcje lub Samochód) - 1 kolumna */}
        <div className="xl:col-span-1 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[300px] text-zinc-500 text-sm font-medium text-center">
          Miejsce na kolejny moduł<br/>(np. Samochód lub Gwarancje)
        </div>
        
      </div>
      
    </div>
  );
}