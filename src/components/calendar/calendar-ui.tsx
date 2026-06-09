"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Settings, Flame, TrendingDown } from "lucide-react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isToday, setYear, isSameDay, startOfDay
} from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageProvider";
import { ExpenseModal } from "@/components/calendar/expense-modal";
import { AddIncomeModal } from "@/components/dashboard/add-income-modal";
import { DayDetailsModal } from "@/components/calendar/day-details-modal";
import { CategoryManagerModal } from "@/components/calendar/category-manager-modal";
import { ImportModal } from "@/components/dashboard/import-modal";

interface CalendarUIProps {
  expenses: any[];
  incomes: any[];
  categories: any[];
  currency?: string;
}

/** Oblicza streak – ile dni z rzędu (wstecz od dzisiaj) zawiera wydatki */
function calcStreak(expenses: any[]): number {
  const today = startOfDay(new Date());
  let streak = 0;
  let checking = new Date(today);
  while (true) {
    const has = expenses.some(e => isSameDay(new Date(e.date), checking));
    if (!has) break;
    streak++;
    checking = new Date(checking.getTime() - 86400000);
  }
  return streak;
}

export function CalendarUI({ expenses, incomes, categories, currency = "PLN" }: CalendarUIProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === "en" ? enUS : pl;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState<Date | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsDate, setDetailsDate] = useState<Date | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)));
  };

  const handleAddExpense = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation(); 
    setExpenseDate(date);
    setIsExpenseModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setDetailsDate(date);
    setIsDetailsModalOpen(true);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = [
    t("calendar.weekdays.mon"),
    t("calendar.weekdays.tue"),
    t("calendar.weekdays.wed"),
    t("calendar.weekdays.thu"),
    t("calendar.weekdays.fri"),
    t("calendar.weekdays.sat"),
    t("calendar.weekdays.sun")
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Obliczenia dla paska budżetu i streak
  const monthExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth() && e.type === "EXPENSE";
    }), [expenses, currentMonth]);

  const totalMonthSpend = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const totalBudgetLimit = useMemo(() => categories.reduce((s: number, c: any) => s + (c.budgetLimit || 0), 0), [categories]);

  const streak = useMemo(() => calcStreak(expenses), [expenses]);

  const budgetPct = totalBudgetLimit > 0 ? Math.min(100, (totalMonthSpend / totalBudgetLimit) * 100) : 0;
  const budgetColor = budgetPct < 60 ? "bg-emerald-500" : budgetPct < 85 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
        
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center gap-2 min-w-[170px]">
            <h2 className="text-xl font-bold capitalize">
              {format(currentMonth, 'LLLL', { locale: dateLocale })}
            </h2>
            <select 
              value={currentMonth.getFullYear()}
              onChange={handleYearChange}
              className="bg-transparent text-xl font-bold outline-none cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors appearance-none"
            >
              {years.map(year => <option key={year} value={year} className="text-base bg-white dark:bg-zinc-900">{year}</option>)}
            </select>
          </div>

          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* STREAK + PASEK BUDŻETU */}
        <div className="flex flex-col gap-2 flex-1 md:max-w-xs">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
              <Flame className="w-4 h-4" />
              <span>{streak} {streak === 1 ? "dzień" : streak < 5 ? "dni" : "dni"} z rzędu!</span>
            </div>
          )}
          {totalBudgetLimit > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Budżet miesięczny</span>
                <span className={budgetPct >= 85 ? "text-red-500 font-bold" : ""}>
                  {totalMonthSpend.toLocaleString("pl-PL", { style: "currency", currency, maximumFractionDigits: 0 })} / {totalBudgetLimit.toLocaleString("pl-PL", { style: "currency", currency, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${budgetColor}`} style={{ width: `${budgetPct}%` }} />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ImportModal />
          <AddIncomeModal />
          
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 p-2 px-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/10"
          >
            <Settings className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{t("calendar.categories_button")}</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold uppercase text-zinc-500">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-black/5 dark:bg-white/10">
          {calendarDays.map((date, i) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isCurrentDay = isToday(date);
            
            const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), date));
            const dayIncomes = incomes.filter(inc => isSameDay(new Date(inc.date), date));

            const allDayTransactions = [
              ...dayIncomes.map(inc => ({ ...inc, isIncome: true })),
              ...dayExpenses.map(exp => ({ ...exp, isIncome: false }))
            ];

            const MAX_VISIBLE = 3;
            const visibleTransactions = allDayTransactions.slice(0, MAX_VISIBLE);
            const hiddenCount = allDayTransactions.length - MAX_VISIBLE;

            // Kolor tła dnia: zielony = przychód, czerwony = dużo wydatków, żółty = umiarkowane
            const daySpend = dayExpenses.filter(e => e.type === "EXPENSE").reduce((s: number, e: any) => s + e.amount, 0);
            const dayIncome = dayIncomes.reduce((s: number, e: any) => s + e.amount, 0);
            const isPast = date < startOfDay(new Date()) && !isCurrentDay;
            let dayColorClass = "";
            if (isCurrentMonth && isPast && (daySpend > 0 || dayIncome > 0)) {
              if (dayIncome > 0 && daySpend === 0) dayColorClass = "bg-emerald-50 dark:bg-emerald-950/30";
              else if (daySpend > 200) dayColorClass = "bg-red-50 dark:bg-red-950/25";
              else if (daySpend > 0) dayColorClass = "bg-amber-50 dark:bg-amber-950/20";
            }

            return (
              <div 
                key={i} 
                onClick={() => isCurrentMonth && handleDayClick(date)}
                className={`group relative min-h-[120px] p-2 transition-colors border-t border-l border-transparent
                  ${isCurrentMonth
                    ? `hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer ${dayColorClass || "bg-white dark:bg-zinc-950"}`
                    : "bg-zinc-50/50 dark:bg-zinc-900/30 cursor-default"}
                `}
              >
                <span className={`text-sm font-medium ${
                  isCurrentDay 
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/20" 
                    : isCurrentMonth 
                      ? "text-zinc-700 dark:text-zinc-300" 
                      : "text-zinc-400 dark:text-zinc-600"
                }`}>
                  {format(date, 'd')}
                </span>

                <div className="flex flex-col gap-1 mt-1">
                  {visibleTransactions.map(tx => (
                    tx.isIncome ? (
                      <div key={`inc-${tx.id}`} title={tx.source} className="truncate rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                        + {tx.amount.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })}
                      </div>
                    ) : (
                      <div key={`exp-${tx.id}`} title={tx.description || tx.category?.name} className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium border ${tx.type === "EXPENSE" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"}`}>
                        {tx.type === "EXPENSE" ? "-" : ""} {tx.amount.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })} {tx.category?.icon}
                      </div>
                    )
                  ))}
                  
                  {hiddenCount > 0 && (
                    <div className="truncate rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold border border-black/5 dark:border-white/5 text-center mt-0.5">
                      {t("calendar.more_transactions").replace("{count}", hiddenCount.toString())}
                    </div>
                  )}
                </div>

                {isCurrentMonth && (
                  <button 
                    onClick={(e) => handleAddExpense(e, date)}
                    className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-lg transition-all transform scale-90 opacity-100 md:opacity-0 md:group-hover:opacity-100 group-hover:scale-100 hover:bg-primary/80 z-10"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        selectedDate={expenseDate}
        categories={categories}
        expenses={expenses}
        currency={currency}
      />

      <DayDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        date={detailsDate}
        allExpenses={expenses}
        allIncomes={incomes}
        currency={currency}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
      />
    </div>
  );
}