"use client";

import { useState, useMemo } from "react";
import { TrendingDown, TrendingUp, CalendarDays, Filter, Layers, Repeat, ArrowRightLeft } from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area 
} from 'recharts';

interface FinanceAnalysisProps {
  expenses: any[];
  incomes: any[];
  baseCurrency: string;
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

export function FinanceAnalysis({ expenses, incomes, baseCurrency }: FinanceAnalysisProps) {
  // Stany filtrów
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [paymentType, setPaymentType] = useState<"ALL" | "RECURRING" | "ONETIME">("ALL");

  const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Unikalne kategorie z dostępnych wydatków (do selecta)
  const availableCategories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category?.name || "Inne"));
    return Array.from(cats);
  }, [expenses]);

  // --- ZAAWANSOWANE FILTROWANIE ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      // 1. Filtr Daty
      if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return false;
      if (e.type !== "EXPENSE") return false;
      
      // 2. Filtr Kategorii
      const catName = e.category?.name || "Inne";
      if (selectedCategory !== "ALL" && catName !== selectedCategory) return false;

      // 3. Filtr Typu (Stałe vs Jednorazowe)
      // Sprawdzamy, czy wydatek jest podpięty pod zlecenie stałe
      const isRecurring = Boolean(e.recurringId || e.isRecurring);
      if (paymentType === "RECURRING" && !isRecurring) return false;
      if (paymentType === "ONETIME" && isRecurring) return false;

      return true;
    });
  }, [expenses, selectedMonth, selectedYear, selectedCategory, paymentType]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [incomes, selectedMonth, selectedYear]);

  // --- OBLICZENIA KPI ---
  const totalExpense = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Obliczamy ile to koszty stałe (np. subskrypcje/raty), a ile zmienne
  const fixedCosts = filteredExpenses.filter(e => e.recurringId || e.isRecurring).reduce((acc, curr) => acc + curr.amount, 0);
  const variableCosts = totalExpense - fixedCosts;
  
  // Jeśli wybrano filtry (kategorie/typy), bilans nie ma sensu (bo pokazuje tylko część), więc pokazujemy go tylko dla ALL
  const showBalance = selectedCategory === "ALL" && paymentType === "ALL";
  const balance = totalIncome - totalExpense;

  // --- PRZYGOTOWANIE DANYCH DO WYKRESÓW ---

  // 1. Wykres Kołowy (Kategorie)
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    const catName = expense.category?.name || "Inne";
    if (!acc[catName]) acc[catName] = 0;
    acc[catName] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 2. Wykres Dzienny (Trend wzdłuż osi czasu miesiąca)
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayExpenses = filteredExpenses.filter(e => new Date(e.date).getDate() === day);
    const sum = dayExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    return { day: `${day} ${months[selectedMonth].substring(0,3)}`, wydatki: sum };
  });

  // Customowy Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-black/10 dark:border-white/10 p-3 rounded-xl shadow-xl text-sm font-semibold text-zinc-900 dark:text-white">
          <p className="text-zinc-500 mb-1">{label || payload[0].name}</p>
          <p className="text-indigo-500">{`${payload[0].value.toLocaleString("pl-PL", { style: "currency", currency: baseCurrency })}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* PASEK FILTRÓW ZAAWANSOWANYCH */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl shadow-sm">
        
        {/* Filtry Czasu */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm shadow-sm">
            <CalendarDays className="w-4 h-4 text-zinc-400" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent outline-none cursor-pointer font-bold text-zinc-700 dark:text-zinc-300">
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent outline-none cursor-pointer font-bold text-zinc-700 dark:text-zinc-300 border-l border-black/10 dark:border-white/10 pl-2 ml-2">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Zaawansowane filtry */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-sm">
            <Layers className="w-4 h-4 text-zinc-500" />
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-transparent outline-none cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">
              <option value="ALL">Wszystkie kategorie</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 text-sm font-medium">
            <button 
              onClick={() => setPaymentType("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${paymentType === "ALL" ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              Wszystko
            </button>
            <button 
              onClick={() => setPaymentType("RECURRING")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${paymentType === "RECURRING" ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/20" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              <Repeat className="w-3.5 h-3.5" /> Stałe
            </button>
            <button 
              onClick={() => setPaymentType("ONETIME")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${paymentType === "ONETIME" ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Zmienne
            </button>
          </div>
        </div>
      </div>

      {/* KARTY KOSZTÓW I PODSUMOWANIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm">
          <p className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-red-500" /> Wydatki z filtrów</p>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{totalExpense.toLocaleString("pl-PL", { style: "currency", currency: baseCurrency })}</p>
        </div>
        
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm">
          <p className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2"><Repeat className="w-4 h-4 text-indigo-500" /> Koszty Stałe</p>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{fixedCosts.toLocaleString("pl-PL", { style: "currency", currency: baseCurrency })}</p>
          <p className="text-xs text-zinc-400 mt-2">{(totalExpense ? (fixedCosts/totalExpense)*100 : 0).toFixed(1)}% wszystkich wydatków</p>
        </div>

        <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm">
          <p className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2"><ArrowRightLeft className="w-4 h-4 text-orange-500" /> Koszty Zmienne</p>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{variableCosts.toLocaleString("pl-PL", { style: "currency", currency: baseCurrency })}</p>
          <p className="text-xs text-zinc-400 mt-2">Kawa, zakupy, zachcianki</p>
        </div>
        
        <div className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden group ${showBalance ? (balance >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20") : "bg-black/5 dark:bg-white/5 border-transparent opacity-50"}`}>
          <p className="text-sm font-medium flex items-center gap-2 mb-2 relative z-10 text-zinc-600 dark:text-zinc-400">
            {showBalance ? "Wynik netto miesiąca" : "Bilans (Wyłącz filtry)"}
          </p>
          <p className={`text-3xl font-extrabold relative z-10 ${showBalance ? (balance >= 0 ? "text-emerald-600" : "text-red-600") : "text-zinc-500"}`}>
            {showBalance ? `${balance > 0 ? "+" : ""}${balance.toLocaleString("pl-PL", { style: "currency", currency: baseCurrency })}` : "---"}
          </p>
        </div>
      </div>

      {/* WYKRESY ZAAWANSOWANE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WYKRES LINIOWY (Trend całego miesiąca) - ZAJMUJE 2 KOLUMNY */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            Trend wydatków (Dzień po dniu)
          </h3>
          <p className="text-sm text-zinc-500 mb-6">Zobacz, w które dni Twojego portfela ubywa najszybciej.</p>
          <div className="flex-1 min-h-[300px]">
            {totalExpense === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 font-medium">Brak wydatków dla wybranych filtrów.</div>
            ) : (
              <ResponsiveContainer w-full h-full>
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWydatki" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis dataKey="day" tick={{ fill: '#888888', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis tickFormatter={(val) => `${val} zł`} tick={{ fill: '#888888', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="wydatki" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWydatki)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* WYKRES KOŁOWY (Struktura) */}
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Podział Kategorii</h3>
          <div className="flex-1 min-h-[300px]">
            {pieData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 font-medium">Wybierz inny filtr</div>
            ) : (
              <ResponsiveContainer w-full h-full>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-white dark:stroke-zinc-900 stroke-[3px] hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}