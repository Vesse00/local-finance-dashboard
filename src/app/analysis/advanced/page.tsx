import Link from "next/link";
import { Power, Zap, BrainCircuit, Activity, Target, PieChart, AlertOctagon, Tags, Info, Hourglass, ShieldAlert, RefreshCw, Car } from "lucide-react";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, differenceInDays, addDays } from "date-fns";

export default async function AdvancedAnalysisPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <div className="p-10 text-center">Brak dostępu / Brak danych</div>;

  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  
  const daysInMonth = differenceInDays(end, start) + 1;
  const currentDay = now.getDate() === 1 ? 1 : now.getDate() - 1;
  const daysLeft = daysInMonth - now.getDate();

  // --- ZAAWANSOWANE ZAPYTANIA RÓWNOLEGŁE (Naprawiony TypeScript) ---
  const [
    incomesAgg,
    expensesAgg,
    topExpenses, // Zmiana z groupBy na findMany (Pobiera 3 największe transakcje z tego miesiąca)
    recurringPayments,
    workDays,
    carEvents
  ] = await Promise.all([
    prisma.income.aggregate({ where: { userId: user.id, date: { gte: start, lte: end } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
    prisma.expense.aggregate({ where: { userId: user.id, date: { gte: start, lte: end } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
    
    // Pobiera konkretne, największe transakcje (najbezpieczniejsza opcja!)
    prisma.expense.findMany({ where: { userId: user.id, date: { gte: start, lte: end } }, orderBy: { amount: 'desc' }, take: 3 }).catch(() => []),
    
    prisma.recurringPayment.findMany({ where: { userId: user.id, isActive: true } }).catch(() => []),
    prisma.workDay.findMany({ where: { userId: user.id, date: { gte: start, lte: end }, shiftType: 'REGULAR' } }).catch(() => []),
    prisma.carEvent.findMany({ where: { car: { userId: user.id }, nextDueDate: { gte: start, lte: addDays(now, 30) } } }).catch(() => [])
  ]);

  const totalIncome = incomesAgg._sum?.amount || 0;
  const totalExpense = expensesAgg._sum?.amount || 0;
  const balance = totalIncome - totalExpense;

  const largestExpense = topExpenses[0] || null; // Największa z TOP 3 to nasza Anomalia

  // --- WYLICZENIA ANALITYCZNE ---
  const dailyBurnRate = currentDay > 0 ? (totalExpense / currentDay) : 0;
  const predictedEndOfMonthExpense = totalExpense + (dailyBurnRate * daysLeft);
  const predictedLeftover = totalIncome - predictedEndOfMonthExpense;
  const isDangerZone = predictedLeftover < 0;

  const expensePercent = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;
  const savingsPercent = totalIncome > 0 ? 100 - expensePercent : 0;

  const fixedCosts = recurringPayments.reduce((sum, req) => sum + req.defaultAmount, 0);
  const variableCosts = Math.max(0, totalExpense - fixedCosts);
  const fixedPercent = totalExpense > 0 ? (fixedCosts / totalExpense) * 100 : 0;
  const variablePercent = totalExpense > 0 ? (variableCosts / totalExpense) * 100 : 0;

  // --- WYCENA CZASU (Wskaźnik ROI) ---
  let totalHoursWorked = 0;
  workDays.forEach(day => {
    if (day.startTime && day.endTime) {
      const startH = parseInt(day.startTime.split(':')[0]) || 0;
      const endH = parseInt(day.endTime.split(':')[0]) || 0;
      totalHoursWorked += Math.max(0, endH - startH);
    }
  });
  const realHourlyRate = totalHoursWorked > 0 ? (totalIncome / totalHoursWorked) : 0;

  return (
    <div className="relative flex-1 p-4 md:p-6 min-h-screen animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto w-full space-y-4 relative z-10">
        
        {/* NAGŁÓWEK */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-500/5 dark:bg-indigo-500/10 backdrop-blur-xl p-4 md:px-6 rounded-2xl border border-indigo-500/20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-indigo-950 dark:text-white tracking-tight">Terminal Analityczny</h1>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-300/60 font-medium mt-0.5">Wnioski, anomalie i predykcje z bieżącego miesiąca.</p>
            </div>
          </div>
          
          <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-300/50 dark:border-zinc-800/50 shadow-inner">
            <Link href="/analysis" className="px-5 py-1.5 rounded-lg text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all">
              Widok Klasyczny
            </Link>
            <div className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/30">
              <Power className="w-3 h-3" /> PRO
            </div>
          </div>
        </div>

        {/* --- PIERWSZY RZĄD --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* PRZEPŁYW (Sankey) */}
          <div className="lg:col-span-2 bg-white/40 dark:bg-black/20 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Bieżący Przepływ
            </h2>
            
            <div className="relative w-full flex flex-col sm:flex-row items-stretch gap-3 h-auto sm:h-40">
              <div className="w-full sm:w-1/3 h-24 sm:h-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-400 relative z-10 transition-transform hover:scale-[1.02]">
                <p className="text-[9px] font-black uppercase tracking-wider opacity-70 mb-1">Całkowity Wpływ</p>
                <p className="text-2xl font-black">{totalIncome.toLocaleString('pl-PL', { maximumFractionDigits: 0 })}</p>
              </div>

              <div className="hidden sm:flex w-8 h-full flex-col justify-center gap-3 relative z-0">
                 <div className="w-full h-1/2 border-t-2 border-r-2 border-zinc-300 dark:border-zinc-700 rounded-tr-xl -ml-2"></div>
                 <div className="w-full h-1/2 border-b-2 border-r-2 border-zinc-300 dark:border-zinc-700 rounded-br-xl -ml-2"></div>
              </div>

              <div className="w-full sm:w-2/3 flex flex-col gap-3 h-full justify-center">
                <div className="bg-white/80 dark:bg-zinc-900/80 border border-red-100 dark:border-red-900/30 p-3 px-4 rounded-xl shadow-sm relative overflow-hidden flex items-center justify-between group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Wydatki</p>
                    <p className="text-lg font-black text-red-500">-{totalExpense.toLocaleString('pl-PL', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="flex flex-col items-end w-1/3">
                    <p className="text-xs font-black text-zinc-900 dark:text-white mb-1">{expensePercent.toFixed(1)}%</p>
                    <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${expensePercent}%` }}></div></div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/80 border border-indigo-100 dark:border-indigo-900/30 p-3 px-4 rounded-xl shadow-sm relative overflow-hidden flex items-center justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Wolne Środki</p>
                    <p className="text-lg font-black text-indigo-500">{balance.toLocaleString('pl-PL', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="flex flex-col items-end w-1/3">
                    <p className="text-xs font-black text-zinc-900 dark:text-white mb-1">{savingsPercent.toFixed(1)}%</p>
                    <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${savingsPercent}%` }}></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WYCENA CZASU */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5" /> Analiza Wartości Czasu
              </h2>
              {totalHoursWorked > 0 ? (
                <>
                  <p className="text-[10px] text-zinc-500 mb-1 font-medium">Realna stawka w tym miesiącu:</p>
                  <p className="text-3xl font-black text-zinc-900 dark:text-white">{realHourlyRate.toFixed(1)} <span className="text-sm text-zinc-400">zł/h</span></p>
                </>
              ) : (
                <p className="text-xs text-zinc-500">Brak przepracowanych godzin w grafiku.</p>
              )}
            </div>
            
            {totalHoursWorked > 0 && (
              <div className="mt-4 p-3 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                <p className="text-[10px] text-zinc-500 leading-tight">
                  W tym miesiącu spędzisz w pracy <strong>{totalHoursWorked} godzin</strong>. Każda godzina Twojego życia jest warta obecnie <strong>{realHourlyRate.toFixed(0)} zł</strong> (Zestawienie całkowitego wpływu i etatu).
                </p>
              </div>
            )}
          </div>

          {/* AI BURN RATE FORECAST */}
          <div className="bg-gradient-to-b from-indigo-950 to-black rounded-2xl p-5 border border-indigo-900/50 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px]"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">Burn Rate</h3>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mb-4">
                <p className="text-[10px] text-zinc-400 mb-1">Dzienne spalanie gotówki</p>
                <p className="text-2xl font-black text-white">{dailyBurnRate.toFixed(1)} zł <span className="text-[10px] text-zinc-500 font-medium">/ dzień</span></p>
              </div>
            </div>
            <div className={`relative z-10 p-3 rounded-xl border ${isDangerZone ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
              <p className="text-[9px] font-bold uppercase opacity-80 mb-1 text-white">Prognoza na koniec m-ca</p>
              <p className={`text-xl font-black ${isDangerZone ? "text-red-400" : "text-emerald-400"}`}>
                {predictedLeftover.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
              </p>
            </div>
          </div>

        </div>

        {/* --- DRUGI RZĄD --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* 1. Koszty Stałe vs Zmienne */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5" /> Struktura Kosztów
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-zinc-600 dark:text-zinc-300">Sztywne (Rachunki)</span>
                    <span className="text-zinc-900 dark:text-white">{fixedCosts.toLocaleString('pl-PL')} zł</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-500" style={{ width: `${Math.min(fixedPercent, 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-orange-600 dark:text-orange-400">Zmienne (Życie)</span>
                    <span className="text-zinc-900 dark:text-white">{variableCosts.toLocaleString('pl-PL')} zł</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400" style={{ width: `${Math.min(variablePercent, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-zinc-500 mt-4 flex items-start gap-1 leading-tight">
              <Info className="w-3 h-3 flex-shrink-0" />
              <span>Sztywne koszty generowane na bieżąco z zakł. Kalendarza.</span>
            </p>
          </div>

          {/* 2. TOP 3 Pojedyncze Wydatki */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Tags className="w-3.5 h-3.5" /> Główne Strzały w M-cu
            </h3>
            {topExpenses.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-xs text-zinc-500">Brak wydatków.</div>
            ) : (
              <div className="space-y-3">
                {topExpenses.map((expense, idx) => {
                  const percent = totalExpense > 0 ? (expense.amount / totalExpense) * 100 : 0;
                  const expenseName = expense.description || expense.recipient || "Nieznany wydatek";
                  return (
                    <div key={expense.id} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 capitalize truncate pr-2">{expenseName}</span>
                          <span className="text-[10px] font-black whitespace-nowrap">{expense.amount.toLocaleString('pl-PL')} zł</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500/70" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RADAR OBCIĄŻEŃ I ZOBOWIĄZAŃ */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Radar Zobowiązań
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <p className="text-[10px] font-bold uppercase">Roczny Ciężar Subskrypcji</p>
                </div>
                <p className="text-lg font-black text-red-700 dark:text-red-300">
                  {(fixedCosts * 12).toLocaleString('pl-PL')} zł <span className="text-[10px] text-red-500/70 font-medium">/ rok</span>
                </p>
              </div>

              <div className="p-3 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 mb-1">
                  <Car className="w-3.5 h-3.5" />
                  <p className="text-[10px] font-bold uppercase">Pojazdy (Kolejne 30 dni)</p>
                </div>
                <p className="text-sm font-black text-zinc-900 dark:text-white">
                  {carEvents.length > 0 ? `${carEvents.length} nadchodzące serwisy/opłaty` : "Brak akcji w garażu"}
                </p>
              </div>
            </div>
          </div>

          {/* Wykrywacz Anomalii */}
          <div className="bg-amber-50 dark:bg-amber-500/5 backdrop-blur-2xl border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" /> Analiza Anomalii
            </h3>
            {largestExpense ? (
              <div>
                <p className="text-[10px] text-amber-800 dark:text-amber-200/80 mb-2 leading-relaxed font-medium">
                  Największy pojedynczy strzał w tym miesiącu pochłonął <strong className="text-amber-600 dark:text-amber-400">{((largestExpense.amount / totalExpense) * 100).toFixed(1)}%</strong> Twojego budżetu:
                </p>
                <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-500/10">
                  <p className="text-xs font-black text-zinc-900 dark:text-white truncate">{largestExpense.description || largestExpense.recipient || "Nieznany wydatek"}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 font-bold mt-0.5">{largestExpense.amount.toLocaleString('pl-PL')} zł</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-800 dark:text-amber-200/70">Wszystko w normie. Brak znaczących wydatków.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}