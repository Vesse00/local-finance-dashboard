import Link from "next/link";
import {
  Power, Zap, BrainCircuit, Activity, PieChart, AlertOctagon, Tags, Info,
  Hourglass, ShieldAlert, RefreshCw, Car, TrendingDown, TrendingUp, Lightbulb,
  Heart, AlertTriangle, ArrowRight, Smile, Frown, Target
} from "lucide-react";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, differenceInDays, addDays, subMonths, format } from "date-fns";

export default async function AdvancedAnalysisPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <div className="p-10 text-center">Brak dostępu / Brak danych</div>;

  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const daysInMonth = differenceInDays(end, start) + 1;
  const currentDay = Math.max(1, now.getDate() - 1);
  const daysLeft = daysInMonth - now.getDate();
  const currency = user.currency || "PLN";

  // ── RÓWNOLEGŁE ZAPYTANIA ──────────────────────────────────
  const [
    incomesAgg,
    expensesAgg,
    savingsAgg,
    prevIncomesAgg,
    prevExpensesAgg,
    allExpenses,
    topExpenses,
    recurringPayments,
    workDays,
    carEvents,
    energyEntries,
    expensesByCategory,
    budgetCategories,
  ] = await Promise.all([
    prisma.income.aggregate({ where: { userId: user.id, date: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { userId: user.id, date: { gte: start, lte: end }, type: "EXPENSE" }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { userId: user.id, date: { gte: start, lte: end }, type: "SAVING" }, _sum: { amount: true } }),
    prisma.income.aggregate({ where: { userId: user.id, date: { gte: prevStart, lte: prevEnd } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { userId: user.id, date: { gte: prevStart, lte: prevEnd }, type: "EXPENSE" }, _sum: { amount: true } }),
    // Wszystkie wydatki bieżącego miesiąca z datą (do korelacji)
    prisma.expense.findMany({
      where: { userId: user.id, date: { gte: start, lte: end }, type: "EXPENSE" },
      select: { amount: true, date: true, categoryId: true, description: true, recurringId: true },
      orderBy: { amount: "desc" },
    }),
    prisma.expense.findMany({
      where: { userId: user.id, date: { gte: start, lte: end }, type: "EXPENSE" },
      orderBy: { amount: "desc" },
      take: 5,
    }),
    prisma.recurringPayment.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.workDay.findMany({ where: { userId: user.id, date: { gte: start, lte: end }, shiftType: "REGULAR" }, select: { startTime: true, endTime: true } }),
    prisma.carEvent.findMany({ where: { car: { userId: user.id }, nextDueDate: { gte: now, lte: addDays(now, 30) } } }),
    // Nastroje z bieżącego miesiąca
    prisma.energyEntry.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
      select: { date: true, overallScore: true },
      orderBy: { date: "asc" },
    }),
    // Wydatki pogrupowane po kategorii
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId: user.id, date: { gte: start, lte: end }, type: "EXPENSE" },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.category.findMany({ where: { userId: user.id }, select: { id: true, name: true, icon: true, budgetLimit: true } }),
  ]);

  // ── PODSTAWOWE WSKAŹNIKI ──────────────────────────────────
  const totalIncome   = incomesAgg._sum?.amount ?? 0;
  const pureExpenses  = expensesAgg._sum?.amount ?? 0;
  const savingsOut    = savingsAgg._sum?.amount ?? 0;
  const totalExpense  = pureExpenses + savingsOut;
  const balance       = totalIncome - totalExpense;

  const prevIncome    = prevIncomesAgg._sum?.amount ?? 0;
  const prevExpense   = prevExpensesAgg._sum?.amount ?? 0;

  const incomeChange  = prevIncome  > 0 ? ((totalIncome  - prevIncome)  / prevIncome)  * 100 : 0;
  const expenseChange = prevExpense > 0 ? ((pureExpenses - prevExpense) / prevExpense) * 100 : 0;

  const dailyBurnRate = currentDay > 0 ? pureExpenses / currentDay : 0;
  const predictedMonthExpense = pureExpenses + dailyBurnRate * daysLeft;
  const predictedLeftover = totalIncome - predictedMonthExpense - savingsOut;
  const isDanger = predictedLeftover < 0;

  const savingRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  // ── WYCENA CZASU ─────────────────────────────────────────
  let totalHoursWorked = 0;
  for (const d of workDays) {
    if (d.startTime && d.endTime) {
      const [sh, sm] = d.startTime.split(":").map(Number);
      const [eh, em] = d.endTime.split(":").map(Number);
      totalHoursWorked += Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
    }
  }
  const hourlyRate     = totalHoursWorked > 0 ? totalIncome / totalHoursWorked : 0;
  const wealthVelocity = balance / (daysInMonth * 24);

  // ── KOSZTY STAŁE vs ZMIENNE ──────────────────────────────
  const fixedCosts    = recurringPayments.reduce((s, r) => s + r.defaultAmount, 0);
  const variableCosts = Math.max(0, pureExpenses - fixedCosts);

  // ── ROCZNE ZOBOWIĄZANIA (symulacja 12 m-cy) ───────────────
  let annualBurden = 0;
  for (const rec of recurringPayments) {
    let remaining = rec.totalAmount != null ? (rec.remainingAmount ?? 0) : null;
    for (let i = 0; i < 12; i++) {
      if (rec.endDate && new Date(now.getFullYear(), now.getMonth() + i, rec.dayOfMonth) > rec.endDate) break;
      let amt = rec.defaultAmount;
      if (remaining != null) { if (amt > remaining) amt = remaining; remaining -= amt; }
      if (amt > 0) annualBurden += amt;
      if (remaining != null && remaining <= 0) break;
    }
  }

  // ── KORELACJA NASTRÓJ → WYDATKI ──────────────────────────
  // Grupujemy wydatki per dzień, łączymy z energy score
  const expensePerDay: Record<string, number> = {};
  for (const e of allExpenses) {
    const day = format(new Date(e.date), "yyyy-MM-dd");
    expensePerDay[day] = (expensePerDay[day] ?? 0) + e.amount;
  }

  type MoodSpend = { date: string; score: number; spend: number };
  const moodSpendData: MoodSpend[] = energyEntries
    .map((en) => ({
      date: format(new Date(en.date), "yyyy-MM-dd"),
      score: en.overallScore,
      spend: expensePerDay[format(new Date(en.date), "yyyy-MM-dd")] ?? 0,
    }))
    .filter((d) => d.spend > 0);

  // Dni niskiego nastroju (<40) i wysokich wydatków (> 2× średnia dzienna)
  const avgDailySpend = currentDay > 0 ? pureExpenses / currentDay : 0;
  const lowMoodHighSpendDays = moodSpendData.filter((d) => d.score < 40 && d.spend > avgDailySpend * 1.5);

  // Korelacja Pearsona (uproszczona) między score a spend
  let moodCorrelation: number | null = null;
  if (moodSpendData.length >= 3) {
    const n = moodSpendData.length;
    const mx = moodSpendData.reduce((s, d) => s + d.score, 0) / n;
    const my = moodSpendData.reduce((s, d) => s + d.spend, 0) / n;
    const num = moodSpendData.reduce((s, d) => s + (d.score - mx) * (d.spend - my), 0);
    const den = Math.sqrt(
      moodSpendData.reduce((s, d) => s + (d.score - mx) ** 2, 0) *
      moodSpendData.reduce((s, d) => s + (d.spend - my) ** 2, 0)
    );
    moodCorrelation = den > 0 ? num / den : null;
  }

  // ── INDEKS IMPULSYWNOŚCI ──────────────────────────────────
  const impulseExpenses = allExpenses.filter((e) => !e.categoryId && !e.recurringId);
  const impulseTotal    = impulseExpenses.reduce((s, e) => s + e.amount, 0);
  const impulseIndex    = pureExpenses > 0 ? (impulseTotal / pureExpenses) * 100 : 0;

  // ── KATEGORIE Z LIMITEM BUDŻETU I PRZEKROCZENIA ───────────
  type CatOverrun = { id: string; name: string; icon: string; limit: number; spent: number; percent: number };
  const catOverruns: CatOverrun[] = [];
  for (const cat of budgetCategories) {
    if (!cat.budgetLimit) continue;
    const grp = expensesByCategory.find((g) => g.categoryId === cat.id);
    const spent = grp?._sum?.amount ?? 0;
    if (spent > 0) {
      catOverruns.push({ id: cat.id, name: cat.name, icon: cat.icon, limit: cat.budgetLimit, spent, percent: (spent / cat.budgetLimit) * 100 });
    }
  }
  catOverruns.sort((a, b) => b.percent - a.percent);

  // ── TOP KATEGORIE WYDATKÓW ────────────────────────────────
  type CatSpend = { name: string; icon: string; amount: number; percent: number; count: number };
  const topCategories: CatSpend[] = expensesByCategory.slice(0, 5).map((g) => {
    const cat = budgetCategories.find((c) => c.id === g.categoryId);
    return {
      name: cat?.name ?? "Bez kategorii",
      icon: cat?.icon ?? "❓",
      amount: g._sum?.amount ?? 0,
      percent: pureExpenses > 0 ? ((g._sum?.amount ?? 0) / pureExpenses) * 100 : 0,
      count: g._count?.id ?? 0,
    };
  });

  // ── SMART TIPY ───────────────────────────────────────────
  type Tip = { level: "danger" | "warn" | "ok"; title: string; body: string; saving?: number };
  const tips: Tip[] = [];

  // 1. Impulsywność
  if (impulseIndex > 20) {
    tips.push({ level: "warn", title: "Wydatki bez kategorii", body: `${impulseIndex.toFixed(0)}% Twoich wydatków (${fmt(impulseTotal, currency)}) nie ma przypisanej kategorii – to utrudnia kontrolę i może oznaczać zakupy impulsywne. Skategoryzuj je w kalendarzu.`, saving: impulseTotal * 0.15 });
  }
  // 2. Udział zmiennych kosztów
  if (variableCosts > fixedCosts && totalIncome > 0) {
    const savings = variableCosts - fixedCosts;
    tips.push({ level: "warn", title: "Koszty zmienne dominują", body: `Wydatki nieplanowane (${fmt(variableCosts, currency)}) przekraczają stałe zobowiązania (${fmt(fixedCosts, currency)}). Zaplanowanie budżetu tygodniowego mogłoby uwolnić nawet ${fmt(savings * 0.1, currency)}/miesiąc.`, saving: savings * 0.1 });
  }
  // 3. Wskaźnik oszczędności < 20%
  if (savingRate < 20 && totalIncome > 0) {
    const target = totalIncome * 0.2 - balance;
    tips.push({ level: savingRate < 5 ? "danger" : "warn", title: "Niska stopa oszczędności", body: `Oszczędzasz ${savingRate.toFixed(1)}% przychodu (cel: 20%). Aby osiągnąć minimum, musisz ograniczyć wydatki o ${fmt(target, currency)}/miesiąc.`, saving: target });
  }
  // 4. Korelacja nastrój-wydatki
  if (lowMoodHighSpendDays.length >= 2) {
    const totalLowMoodSpend = lowMoodHighSpendDays.reduce((s, d) => s + d.spend, 0);
    tips.push({ level: "warn", title: "Zakupy przy złym nastroju", body: `W ${lowMoodHighSpendDays.length} dniach z niskim nastrojem wydałeś łącznie ${fmt(totalLowMoodSpend, currency)} – ponad 1,5× więcej niż wynosi Twoja dzienna średnia. Zakupy emocjonalne to jeden z największych „wycieków" budżetu.`, saving: totalLowMoodSpend * 0.3 });
  }
  // 5. Kategorie z przekroczonym limitem
  const overBudgetCats = catOverruns.filter((c) => c.percent > 100);
  for (const cat of overBudgetCats.slice(0, 2)) {
    tips.push({ level: "danger", title: `Budżet przekroczony: ${cat.icon} ${cat.name}`, body: `Wydałeś ${fmt(cat.spent, currency)} przy limicie ${fmt(cat.limit, currency)} (${cat.percent.toFixed(0)}%). Zostało ${daysLeft} dni miesiąca.`, saving: cat.spent - cat.limit });
  }
  // 6. Prognozy pozytywne
  if (tips.length === 0 && savingRate >= 20) {
    tips.push({ level: "ok", title: "Świetna kontrola finansów!", body: `Oszczędzasz ${savingRate.toFixed(1)}% przychodu i nie masz przekroczonych limitów. Rozważ zwiększenie transferów na konta długoterminowe lub inwestycje.` });
  }

  // ── OCENA ZDROWIA FINANSOWEGO (0–100) ────────────────────
  let healthScore = 50;
  if (savingRate >= 20) healthScore += 20; else if (savingRate >= 10) healthScore += 10; else healthScore -= 10;
  if (impulseIndex < 10) healthScore += 10; else if (impulseIndex > 30) healthScore -= 10;
  if (overBudgetCats.length === 0) healthScore += 10; else healthScore -= overBudgetCats.length * 5;
  if (lowMoodHighSpendDays.length >= 3) healthScore -= 10;
  if (!isDanger) healthScore += 10; else healthScore -= 15;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const healthLabel = healthScore >= 80 ? "Doskonały" : healthScore >= 60 ? "Dobry" : healthScore >= 40 ? "Wymaga uwagi" : "Krytyczny";
  const healthColor = healthScore >= 80 ? "text-emerald-500" : healthScore >= 60 ? "text-blue-500" : healthScore >= 40 ? "text-amber-500" : "text-red-500";
  const healthBg    = healthScore >= 80 ? "from-emerald-500/20" : healthScore >= 60 ? "from-blue-500/20" : healthScore >= 40 ? "from-amber-500/20" : "from-red-500/20";

  function fmt(v: number, cur: string) {
    return v.toLocaleString("pl-PL", { style: "currency", currency: cur, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 });
  }

  return (
    <div className="relative flex-1 p-4 md:p-6 min-h-screen animate-in fade-in duration-500">
      <div className="max-w-400 mx-auto w-full space-y-4 relative z-10">

        {/* NAGŁÓWEK */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-500/5 dark:bg-indigo-500/10 backdrop-blur-xl p-4 md:px-6 rounded-2xl border border-indigo-500/20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-indigo-950 dark:text-white tracking-tight">Terminal Analityczny</h1>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-300/60 font-medium mt-0.5">Wnioski, korelacje i predykcje z bieżącego miesiąca.</p>
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

        {/* ── RZĄD 1: KPI + WSKAŹNIK ZDROWIA + PROGNOZA ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">

          {/* Przychody */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-4 shadow-sm col-span-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Przychody
            </p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{fmt(totalIncome, currency)}</p>
            {prevIncome > 0 && (
              <p className={`text-[10px] mt-1 font-bold ${incomeChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {incomeChange >= 0 ? "+" : ""}{incomeChange.toFixed(1)}% vs poprzedni
              </p>
            )}
          </div>

          {/* Wydatki */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-4 shadow-sm col-span-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Wydatki
            </p>
            <p className="text-xl font-black text-red-600 dark:text-red-400">{fmt(pureExpenses, currency)}</p>
            {prevExpense > 0 && (
              <p className={`text-[10px] mt-1 font-bold ${expenseChange <= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(1)}% vs poprzedni
              </p>
            )}
          </div>

          {/* Oszczędności */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-4 shadow-sm col-span-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" /> Stopa osk.
            </p>
            <p className={`text-xl font-black ${savingRate >= 20 ? "text-emerald-500" : savingRate >= 10 ? "text-amber-500" : "text-red-500"}`}>{savingRate.toFixed(1)}%</p>
            <p className="text-[10px] text-zinc-400 mt-1">cel: 20%</p>
          </div>

          {/* Burn rate */}
          <div className="bg-linear-to-b from-indigo-950 to-black rounded-2xl p-4 shadow-xl relative overflow-hidden col-span-1">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1 relative z-10">
              <Zap className="w-3 h-3 text-amber-400" /> Burn/dzień
            </p>
            <p className="text-xl font-black text-white relative z-10">{fmt(dailyBurnRate, currency)}</p>
            <p className={`text-[10px] mt-1 font-bold relative z-10 ${isDanger ? "text-red-400" : "text-emerald-400"}`}>
              Prognoza: {fmt(predictedLeftover, currency)}
            </p>
          </div>

          {/* Wycena godziny */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-4 shadow-sm col-span-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Hourglass className="w-3 h-3" /> Roboczogodzina
            </p>
            <p className="text-xl font-black text-zinc-900 dark:text-white">
              {hourlyRate > 0 ? fmt(hourlyRate, currency) : "—"}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              {totalHoursWorked > 0 ? `${totalHoursWorked.toFixed(0)} h w pracy` : "Brak danych grafiku"}
            </p>
          </div>

          {/* Ocena zdrowia finansowego */}
          <div className={`bg-linear-to-br ${healthBg} to-transparent backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-2xl p-4 shadow-sm col-span-1`}>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Zdrowie fin.
            </p>
            <p className={`text-3xl font-black ${healthColor}`}>{healthScore}</p>
            <p className={`text-[10px] font-bold mt-0.5 ${healthColor}`}>{healthLabel}</p>
          </div>
        </div>

        {/* ── RZĄD 2: SMART TIPY + KORELACJA NASTRÓJ ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* SMART TIPY */}
          <div className="xl:col-span-2 bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Smart Tipy Oszczędnościowe
            </h2>
            {tips.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                Brak uwag – Twoje finanse wyglądają dobrze w tym miesiącu! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className={`p-4 rounded-xl border flex gap-3 ${
                    tip.level === "danger" ? "bg-red-500/5 border-red-500/20" :
                    tip.level === "warn"   ? "bg-amber-500/5 border-amber-500/20" :
                                            "bg-emerald-500/5 border-emerald-500/20"
                  }`}>
                    <div className="shrink-0 mt-0.5">
                      {tip.level === "danger" ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                       tip.level === "warn"   ? <AlertOctagon  className="w-4 h-4 text-amber-500" /> :
                                               <Lightbulb      className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black mb-0.5 ${
                        tip.level === "danger" ? "text-red-700 dark:text-red-400" :
                        tip.level === "warn"   ? "text-amber-700 dark:text-amber-400" :
                                                "text-emerald-700 dark:text-emerald-400"
                      }`}>{tip.title}</p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{tip.body}</p>
                      {tip.saving != null && tip.saving > 0 && (
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> Potencjalna oszczędność: {fmt(tip.saving, currency)}/miesiąc
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KORELACJA NASTRÓJ → WYDATKI */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" /> Nastrój a Wydatki
            </h2>

            {moodSpendData.length < 3 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Heart className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-400 leading-relaxed">Potrzeba co najmniej 3 dni z wpisanym nastrojem i wydatkami, żeby pokazać korelację.</p>
                <Link href="/health/energy" className="mt-3 text-[11px] font-bold text-indigo-500 hover:underline">
                  Wpisz nastrój →
                </Link>
              </div>
            ) : (
              <div className="flex-1 space-y-4">
                {/* Korelacja */}
                {moodCorrelation !== null && (
                  <div className={`p-3 rounded-xl border text-center ${
                    moodCorrelation < -0.3 ? "bg-rose-500/10 border-rose-500/20" :
                    moodCorrelation > 0.3  ? "bg-blue-500/10 border-blue-500/20" :
                                            "bg-zinc-500/5 border-zinc-300/20"
                  }`}>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Korelacja Pearson</p>
                    <p className={`text-2xl font-black ${
                      moodCorrelation < -0.3 ? "text-rose-500" :
                      moodCorrelation > 0.3  ? "text-blue-500" :
                                              "text-zinc-500"
                    }`}>{moodCorrelation.toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {moodCorrelation < -0.3 ? "Gorszy nastrój → więcej wydatków 🛑" :
                       moodCorrelation > 0.3  ? "Lepszy nastrój → wyższe wydatki ℹ️" :
                                               "Brak wyraźnej korelacji"}
                    </p>
                  </div>
                )}

                {/* Oś nastrój: ostatnie dni */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Dni niskiego nastroju + wysokich wydatków</p>
                  {lowMoodHighSpendDays.length === 0 ? (
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1"><Smile className="w-3.5 h-3.5 text-emerald-400" /> Brak problemowych dni w tym miesiącu</p>
                  ) : (
                    lowMoodHighSpendDays.slice(0, 4).map((d, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                        <div className="flex items-center gap-1.5">
                          <Frown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{d.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-rose-500 font-bold">{d.score}% nastrój</span>
                          <span className="text-zinc-400">·</span>
                          <span className="font-black text-zinc-800 dark:text-white">{fmt(d.spend, currency)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Minibar chart: ostatnie 7 wpisów */}
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Ostatnie wpisy nastroju</p>
                  <div className="flex items-end gap-1 h-12">
                    {moodSpendData.slice(-10).map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className={`w-full rounded-t-sm transition-all ${
                            d.score >= 70 ? "bg-emerald-400" : d.score >= 40 ? "bg-amber-400" : "bg-rose-400"
                          }`}
                          style={{ height: `${(d.score / 100) * 44}px` }}
                          title={`${d.date}: ${d.score}%`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RZĄD 3: STRUKTURA KOSZTÓW + TOP KATEGORIE + LIMITY + ANOMALIE ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* STRUKTURA KOSZTÓW + 50/30/20 */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" /> Struktura Kosztów
            </h3>
            <div className="space-y-3 mb-4">
              {[
                { label: "Stałe (zlecenia)", value: fixedCosts,    color: "bg-zinc-500", pct: totalIncome > 0 ? (fixedCosts/totalIncome)*100 : 0 },
                { label: "Zmienne (życie)",  value: variableCosts, color: "bg-orange-400", pct: totalIncome > 0 ? (variableCosts/totalIncome)*100 : 0 },
                { label: "Oszczędności",     value: savingsOut,    color: "bg-emerald-400", pct: totalIncome > 0 ? (savingsOut/totalIncome)*100 : 0 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
                    <span className="text-zinc-900 dark:text-white">{fmt(row.value, currency)} <span className="text-zinc-400 font-normal">({row.pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50">
              <p className="text-[9px] text-zinc-400 font-bold uppercase mb-1.5 flex items-center gap-1"><Info className="w-3 h-3" /> Reguła 50/30/20</p>
              {[
                { label: "Potrzeby (50%)", target: 50, actual: totalIncome > 0 ? (fixedCosts/totalIncome)*100 : 0 },
                { label: "Chęci (30%)",    target: 30, actual: totalIncome > 0 ? (variableCosts/totalIncome)*100 : 0 },
                { label: "Oszcz. (20%)",   target: 20, actual: totalIncome > 0 ? (savingsOut/totalIncome)*100 : 0 },
              ].map((b) => (
                <div key={b.label} className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-zinc-500">{b.label}</span>
                  <span className={`font-black ${Math.abs(b.actual - b.target) <= 10 ? "text-emerald-500" : "text-amber-500"}`}>
                    {b.actual.toFixed(0)}% / {b.target}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TOP KATEGORIE */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Tags className="w-3.5 h-3.5" /> Top Wydatki Wg Kategorii
            </h3>
            {topCategories.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">Brak skategoryzowanych wydatków</p>
            ) : (
              <div className="space-y-2.5">
                {topCategories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[10px] font-bold mb-0.5">
                        <span className="truncate text-zinc-700 dark:text-zinc-200">{cat.name}</span>
                        <span className="ml-1 whitespace-nowrap text-zinc-900 dark:text-white">{fmt(cat.amount, currency)}</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${cat.percent}%` }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-400 shrink-0">{cat.percent.toFixed(0)}%</span>
                  </div>
                ))}
                {impulseIndex > 0 && (
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <span className="text-base shrink-0">❓</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[10px] font-bold mb-0.5">
                        <span className="text-amber-600 dark:text-amber-400">Bez kategorii</span>
                        <span className="ml-1 whitespace-nowrap text-zinc-900 dark:text-white">{fmt(impulseTotal, currency)}</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${impulseIndex}%` }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-400 shrink-0">{impulseIndex.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LIMITY BUDŻETU */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Limity Budżetu
            </h3>
            {catOverruns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <Smile className="w-8 h-8 text-emerald-400" />
                <p className="text-xs text-zinc-400">Żadna kategoria nie ma ustawionych limitów lub wszystkie są w normie.</p>
                <Link href="/settings?tab=utilities" className="text-[11px] text-indigo-500 font-bold hover:underline">Ustaw limity →</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {catOverruns.map((cat) => {
                  const over = cat.percent > 100;
                  const warn = cat.percent > 80 && !over;
                  return (
                    <div key={cat.id}>
                      <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <span>{cat.icon}</span>
                          <span className={`${over ? "text-red-600 dark:text-red-400" : warn ? "text-amber-600 dark:text-amber-400" : "text-zinc-700 dark:text-zinc-200"}`}>{cat.name}</span>
                        </span>
                        <span className={`${over ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}>{cat.percent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${over ? "bg-red-500" : warn ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${Math.min(cat.percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-400 mt-0.5">
                        <span>{fmt(cat.spent, currency)}</span>
                        <span>limit: {fmt(cat.limit, currency)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ZOBOWIĄZANIA + GARAŻ */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Zobowiązania
            </h3>
            <div className="p-3 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10">
              <p className="text-[9px] text-red-500 font-bold uppercase mb-1">Łączne (kolejne 12 m-cy)</p>
              <p className="text-lg font-black text-red-700 dark:text-red-300">{fmt(annualBurden, currency)}</p>
              <p className="text-[9px] text-red-400 mt-0.5">{recurringPayments.length} aktywnych zleceń</p>
            </div>
            <div className="p-3 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 mb-1">
                <Car className="w-3.5 h-3.5" />
                <p className="text-[9px] font-bold uppercase">Garaż (30 dni)</p>
              </div>
              <p className="text-sm font-black text-zinc-900 dark:text-white">
                {carEvents.length > 0 ? `${carEvents.length} nadchodzących serwisów/opłat` : "Brak akcji w garażu"}
              </p>
            </div>
            {/* Impulsywność */}
            <div className={`p-3 rounded-xl border ${impulseIndex > 20 ? "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20" : "bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/50"}`}>
              <p className="text-[9px] font-bold uppercase mb-1 text-zinc-500">Indeks impulsywności</p>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-black ${impulseIndex > 30 ? "text-red-500" : impulseIndex > 15 ? "text-amber-500" : "text-emerald-500"}`}>
                  {impulseIndex.toFixed(0)}%
                </p>
                <p className="text-[9px] text-zinc-400">wydatków bez kategorii</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RZĄD 4: TOP WYDATKI + PRĘDKOŚĆ BOGACENIA ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* TOP 5 WYDATKÓW */}
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" /> Największe Pojedyncze Wydatki
            </h3>
            {topExpenses.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">Brak wydatków w tym miesiącu.</p>
            ) : (
              <div className="space-y-2">
                {topExpenses.map((exp, idx) => {
                  const pct = pureExpenses > 0 ? (exp.amount / pureExpenses) * 100 : 0;
                  const name = exp.description || exp.recipient || "Nieznany wydatek";
                  return (
                    <div key={exp.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${idx === 0 ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate pr-2">{name}</span>
                          <span className="text-[11px] font-black whitespace-nowrap">{fmt(exp.amount, currency)}</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[9px] text-zinc-400 mt-0.5">{pct.toFixed(1)}% budżetu</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PRĘDKOŚĆ BOGACENIA + WYCENA CZASU */}
          <div className="bg-linear-to-br from-indigo-950 to-slate-900 rounded-2xl p-5 border border-indigo-900/50 shadow-xl relative overflow-hidden flex flex-col justify-between gap-4">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px]"></div>
            <div className="relative z-10">
              <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Wycena Czasu i Prędkość Bogacenia
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Stawka robocza</p>
                  <p className="text-xl font-black text-white">
                    {hourlyRate > 0 ? `${fmt(hourlyRate, currency)}/h` : "—"}
                  </p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{totalHoursWorked.toFixed(0)} h w tym m-cu</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Godzina życia</p>
                  <p className="text-xl font-black text-white">{fmt(totalIncome / (daysInMonth * 24), currency)}/h</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">całe życie = dochód</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-zinc-400 mb-1 leading-tight">
                  Nawet podczas snu, każdą godzinę Twoje saldo zmienia się o:
                </p>
                <p className={`text-3xl font-black tracking-tight ${wealthVelocity >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {wealthVelocity > 0 ? "+" : ""}{Math.abs(wealthVelocity).toLocaleString("pl-PL", { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 2 })}
                  <span className="text-sm font-bold opacity-60 ml-1">/h</span>
                </p>
                {wealthVelocity < 0 && (
                  <p className="text-[10px] text-red-400 mt-1 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Wydajesz więcej niż zarabiasz – sprawdź tipy powyżej.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
