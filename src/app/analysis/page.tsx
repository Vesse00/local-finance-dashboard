import { prisma } from "@/lib/db";
import Link from "next/link";
import { LineChart, Wallet, Activity, Clock } from "lucide-react";
import { FinanceAnalysis } from "@/components/analysis/finance-analysis";

export const dynamic = "force-dynamic";

export default async function AnalysisPage({ searchParams }: { searchParams: { tab?: string } }) {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  // Pobieramy aktywną zakładkę z URL (domyślnie "finances")
  const activeTab = searchParams.tab || "finances";

  // OPTYMALIZACJA: Zmienne na dane finansowe
  let expenses = [];
  let incomes = [];

  // Pobieramy dane z bazy TYLKO, gdy użytkownik jest w zakładce Finanse
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
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8">
      
      {/* GŁÓWNY NAGŁÓWEK STRONY ANALIZY */}
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <LineChart className="w-8 h-8" />
          </div>
          Centrum Analiz
        </h1>

        {/* NAWIGACJA ZAKŁADEK (Server-side, zmieniająca URL) */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl w-fit">
          <Link 
            href="/analysis?tab=finances"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm
              ${activeTab === "finances" ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
          >
            <Wallet className="w-4 h-4" /> Finanse
          </Link>
          <Link 
            href="/analysis?tab=health"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm
              ${activeTab === "health" ? "bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
          >
            <Activity className="w-4 h-4" /> Zdrowie
          </Link>
          <Link 
            href="/analysis?tab=time"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm
              ${activeTab === "time" ? "bg-white dark:bg-zinc-800 text-orange-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
          >
            <Clock className="w-4 h-4" /> Czas
          </Link>
        </div>
      </div>

      {/* RENDEROWANIE ODPOWIEDNIEGO MODUŁU W ZALEŻNOŚCI OD ZAKŁADKI */}
      
      {activeTab === "finances" && (
        <FinanceAnalysis expenses={expenses} incomes={incomes} baseCurrency="PLN" />
      )}

      {activeTab === "health" && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white/30 dark:bg-black/20 border border-dashed border-zinc-300 dark:border-zinc-700 animate-in fade-in zoom-in-95">
          <Activity className="w-16 h-16 text-emerald-500 mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Moduł Zdrowia</h2>
          <p className="text-zinc-500 max-w-md">Miejsce na śledzenie wagi, spożycia wody, kalorii i treningów. Pojawi się w kolejnych aktualizacjach!</p>
        </div>
      )}

      {activeTab === "time" && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white/30 dark:bg-black/20 border border-dashed border-zinc-300 dark:border-zinc-700 animate-in fade-in zoom-in-95">
          <Clock className="w-16 h-16 text-orange-500 mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Zarządzanie Czasem</h2>
          <p className="text-zinc-500 max-w-md">Śledzenie nawyków, tryb pracy (Pomodoro) i analiza produktywności. Już wkrótce!</p>
        </div>
      )}

    </div>
  );
}