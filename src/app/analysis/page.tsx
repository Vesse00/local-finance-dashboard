import { prisma } from "@/lib/db";
import Link from "next/link";
import { LineChart, Wallet, Activity, Clock } from "lucide-react";
import { FinanceAnalysis } from "@/components/analysis/finance-analysis";
import { TimeAnalysis } from "@/components/analysis/time-analysis";
import { HealthAnalysis } from "@/components/analysis/health-analysis";

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

  let expenses = [];
  let incomes = [];
  let workDays = []; 
  let healthDays = [];
  let healthEntries = [];

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
      
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <LineChart className="w-8 h-8" />
          </div>
          Centrum Analiz
        </h1>

        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl w-fit">
          <Link href="/analysis?tab=finances" className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${activeTab === "finances" ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}><Wallet className="w-4 h-4" /> Finanse</Link>
          <Link href="/analysis?tab=health" className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${activeTab === "health" ? "bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}><Activity className="w-4 h-4" /> Zdrowie</Link>
          <Link href="/analysis?tab=time" className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${activeTab === "time" ? "bg-white dark:bg-zinc-800 text-blue-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}><Clock className="w-4 h-4" /> Czas Pracy</Link>
        </div>
      </div>

      {activeTab === "finances" && <FinanceAnalysis expenses={safeSerialize(expenses)} incomes={safeSerialize(incomes)} baseCurrency="PLN" />}
      {activeTab === "time" && <TimeAnalysis workDays={safeSerialize(workDays)} />}
      {activeTab === "health" && <HealthAnalysis healthDays={safeSerialize(healthDays)} healthEntries={safeSerialize(healthEntries)} />}

    </div>
  );
}