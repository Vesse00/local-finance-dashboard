import { prisma } from "@/lib/db";
import Link from "next/link";
import { LineChart, Wallet, Activity, Clock, Power } from "lucide-react";
import { FinanceAnalysis } from "@/components/analysis/finance-analysis";
import { TimeAnalysis } from "@/components/analysis/time-analysis";
import { HealthAnalysis } from "@/components/analysis/health-analysis";
import { DiscoverPage } from "@/components/DiscoverPage";

export const dynamic = "force-dynamic";

// TARCZA NA BIGINT
const safeSerialize = (data: any) => 
  JSON.parse(JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));

export default async function AnalysisPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || "finances";

  let expenses: any[] = [];
  let incomes: any[] = [];
  let workDays: any[] = []; 
  let healthDays: any[] = [];
  let healthEntries: any[] = [];

  if (activeTab === "finances") {
    expenses = await prisma.expense.findMany({
      where: { userId: user.id },
      include: { category: true },
      orderBy: { date: 'desc' }
    });
    incomes = await prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' }
    });
  } else if (activeTab === "time") {
    workDays = await prisma.workDay.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' }
    });
  } else if (activeTab === "health") {
    healthDays = await prisma.healthDay.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' }
    });
    healthEntries = await prisma.healthEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' }
    });
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8">
      <DiscoverPage page="analysis" />
      <div className="flex flex-col gap-6">
        <div className="max-w-7xl mx-auto w-full space-y-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white/40 dark:bg-black/20 backdrop-blur-xl p-6 rounded-3xl border border-white/50 dark:border-white/5 shadow-sm transition-all">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                <LineChart className="w-8 h-8" />
              </div>
              Centrum Analiz 
            </h1>
            {/* SWITCH TRYBU PRO */}
            <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-300/50 dark:border-zinc-800/50 shadow-inner">
              <div className="px-5 py-2 rounded-full text-xs font-black text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 shadow-sm">
                Tryb Klasyczny
              </div>
              <Link href="/analysis/advanced" className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-black text-zinc-500 hover:text-indigo-500 dark:text-zinc-400 dark:hover:text-indigo-400 transition-all">
                <Power className="w-3.5 h-3.5" /> PRO
              </Link>
            </div>
          </div>
          
          
        </div>
        

        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl w-fit">
          <Link href="/analysis?tab=finances" className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${activeTab === "finances" ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}><Wallet className="w-4 h-4" /> Finanse</Link>
          <Link href="/analysis?tab=health" className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${activeTab === "health" ? "bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}><Activity className="w-4 h-4" /> Zdrowie</Link>
          <Link href="/analysis?tab=time" className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${activeTab === "time" ? "bg-white dark:bg-zinc-800 text-blue-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}><Clock className="w-4 h-4" /> Czas Pracy</Link>
        </div>
      </div>
    
      {activeTab === "finances" && <FinanceAnalysis expenses={safeSerialize(expenses)} incomes={safeSerialize(incomes)} baseCurrency={user.currency || "PLN"} />}
      {activeTab === "time" && <TimeAnalysis workDays={safeSerialize(workDays)} />}
      {activeTab === "health" && <HealthAnalysis healthDays={safeSerialize(healthDays)} healthEntries={safeSerialize(healthEntries)} />}

    </div>
  );
}