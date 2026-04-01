"use client";

import { useState, useMemo, useTransition } from "react";
import { Calculator, Target, PiggyBank, Edit3, Check, CalendarDays, ChevronDown, BarChart2 } from "lucide-react";
import { updateCategoryBudget } from "@/lib/actions";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface PlannerUIProps {
  categories: any[];
  currentMonthExpenses: any[];
  currentMonthIncomes: any[];
  recurrings: any[];
  currency: string;
}

export function PlannerUI({ categories, currentMonthExpenses, currentMonthIncomes, recurrings, currency }: PlannerUIProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLimitsOpen, setIsLimitsOpen] = useState(false);

  const totalIncome = currentMonthIncomes.reduce((acc, inc) => acc + inc.amount, 0);

  // Zliczanie ile zaplanowano via budżety kategorii (limits)
  const plannedCategoriesTotal = categories.reduce((acc, cat) => acc + (cat.budgetLimit || 0), 0);
  
  // Zliczanie rat z RecurringPayments na ten miesiąc (fixed costs)
  const fixedCostsTotal = recurrings.reduce((acc, rec) => acc + rec.defaultAmount, 0);

  const totalPlanned = plannedCategoriesTotal + fixedCostsTotal;
  const remainingToPlan = totalIncome - totalPlanned;

  const chartData = useMemo(() => {
    return categories
      .filter((c) => c.budgetLimit && c.budgetLimit > 0)
      .map((c) => {
        const spent = currentMonthExpenses
          .filter((e) => e.categoryId === c.id)
          .reduce((sum, e) => sum + e.amount, 0);

        return {
          name: c.name,
          Limit: c.budgetLimit,
          Wydano: spent,
        };
      })
      .sort((a, b) => b.Limit - a.Limit); // Sortujemy malejąco po zaplanowanym budżecie
  }, [categories, currentMonthExpenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xl">
          <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium flex items-center justify-between gap-4" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span>{entry.value.toLocaleString("pl-PL", { style: "currency", currency })}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleSaveBudget = (categoryId: string) => {
    if (!editValue && editValue !== "0") {
      setEditingId(null);
      return;
    }
    
    startTransition(async () => {
      const val = parseFloat(editValue.replace(",", "."));
      await updateCategoryBudget(categoryId, isNaN(val) || val <= 0 ? null : val);
      setEditingId(null);
    });
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl p-6 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Calculator className="w-6 h-6 text-indigo-500" />
            Planer Miesięczny
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Przydziel budżety dla kategorii i kontroluj, czy zepniesz się z wypłatą na dany miesiąc.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
            <PiggyBank className="w-4 h-4" /> Wpływy (Do dyspozycji)
          </p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white">
            {totalIncome.toLocaleString("pl-PL", { style: "currency", currency })}
          </p>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" /> Zaplanowano
          </p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white">
            {totalPlanned.toLocaleString("pl-PL", { style: "currency", currency })}
          </p>
        </div>
        <div className={`border backdrop-blur-md rounded-3xl p-6 shadow-sm ${remainingToPlan < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/70 dark:bg-zinc-950/40 border-black/5 dark:border-white/10'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${remainingToPlan < 0 ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <Calculator className="w-4 h-4" /> Wolne środki na ten m-c
          </p>
          <p className={`text-3xl font-black ${remainingToPlan < 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
            {remainingToPlan.toLocaleString("pl-PL", { style: "currency", currency })}
          </p>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col mt-6 space-y-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
          <BarChart2 className="w-5 h-5 text-indigo-500" />
          Wykorzystanie zdefiniowanych budżetów
        </h3>
        
        {chartData.length > 0 ? (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(161, 161, 170, 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                <Bar 
                  dataKey="Limit" 
                  name="Zaplanowany Limit" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40} 
                />
                <Bar 
                  dataKey="Wydano" 
                  name="Wydane Środki" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-40 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-dashed border-black/10 dark:border-white/10">
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Ustaw limity kategorii poniżej, by zobaczyć wykres wykorzystania budżetu.</p>
          </div>
        )}
      </div>

      <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col mt-6">
        <div 
          onClick={() => setIsLimitsOpen(!isLimitsOpen)}
          className="flex items-center justify-between cursor-pointer group"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            Limity Kategorii na ten miesiąc
          </h3>
          <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-300 group-hover:text-indigo-500 ${isLimitsOpen ? 'rotate-180' : ''}`} />
        </div>

        {isLimitsOpen && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {categories.map((category) => {
            const spentInCat = currentMonthExpenses
              .filter(e => e.categoryId === category.id)
              .reduce((acc, curr) => acc + curr.amount, 0);

            const isEditing = editingId === category.id;
            const progress = category.budgetLimit ? (spentInCat / category.budgetLimit) * 100 : 0;
            const isOver = progress > 100;

            return (
              <div key={category.id} className="p-4 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 relative group transition-colors hover:border-indigo-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{category.name}</span>
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 rounded-lg p-0.5 border border-indigo-500/30 shadow-sm">
                      <input 
                        type="number" 
                        step="0.01" 
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-20 text-right bg-transparent text-sm font-bold outline-none pl-2"
                        autoFocus
                        onKeyDown={e => e.key === "Enter" && handleSaveBudget(category.id)}
                      />
                      <button onClick={() => handleSaveBudget(category.id)} disabled={isPending} className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-md">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => { setEditingId(category.id); setEditValue(category.budgetLimit ? category.budgetLimit.toString() : ""); }}
                      className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      title="Kliknij by ustawić limit"
                    >
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {category.budgetLimit ? category.budgetLimit.toLocaleString("pl-PL", { style: "currency", currency, maximumFractionDigits: 0 }) : "Brak limitu"}
                      </span>
                      <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="text-xs font-medium flex justify-between mb-1.5 text-zinc-500">
                  <span>Wydano: {spentInCat.toFixed(2)} {currency}</span>
                  {category.budgetLimit && <span>{progress.toFixed(0)}%</span>}
                </div>

                {category.budgetLimit && (
                  <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : progress > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                )}
                {isOver && category.budgetLimit && (
                  <p className="text-[10px] font-bold text-red-500 mt-2 text-right">
                    Przekroczono o {(spentInCat - category.budgetLimit).toFixed(2)} {currency}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        )}

        <div className="mt-8 border-t border-black/5 dark:border-white/5 pt-6">
          <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Uwzględnione stałe koszty
          </h3>
          <div className="flex flex-wrap gap-2">
            {recurrings.length === 0 ? (
               <span className="text-xs text-zinc-400">Brak. Dodaj je w kalendarzu.</span>
            ) : (
              recurrings.map(rec => (
                <div key={rec.id} className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-medium flex items-center gap-2">
                  <span className="text-zinc-500">{rec.name}</span>
                  <span className="font-bold text-zinc-800 dark:text-white">{rec.defaultAmount.toLocaleString("pl-PL", { style: "currency", currency, maximumFractionDigits: 0 })}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
