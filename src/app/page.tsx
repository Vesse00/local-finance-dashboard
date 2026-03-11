import { MainWidget } from "@/components/dashboard/main-widget";
import { WorkWidget } from "@/components/dashboard/work-widget";
import { HealthWidget } from "@/components/dashboard/health-widget";
import { getDashboardStats } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

// PANCERNA TARCZA: Konwertuje wszystko co Prisma wypluje, włączając w to BigInty
const safeSerialize = (data: any) => 
  JSON.parse(JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));

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
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      
      {/* 1. GŁÓWNY WIDŻET FINANSÓW */}
      <div className="w-full">
        <MainWidget 
          currentStats={safeSerialize(stats)} 
          summaries={safeSerialize(summaries)} 
        />
      </div>

      {/* 2. DOLNA SEKCJA WIDŻETÓW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-1">
          <WorkWidget workDays={safeSerialize(currentMonthWorkDays)} />
        </div>

        <div className="xl:col-span-1">
          <HealthWidget 
            healthDays={safeSerialize(currentMonthHealthDays)} 
            healthEntries={safeSerialize(currentMonthHealthEntries)} 
          />
        </div>

        <div className="xl:col-span-1 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[300px] text-zinc-500 text-sm font-medium text-center">
          Miejsce na kolejny moduł<br/>(np. Ostatnie Transakcje)
        </div>
        
      </div>
      
    </div>
  );
}