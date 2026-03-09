"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isToday, setYear, isSameDay
} from "date-fns";
import { pl } from "date-fns/locale";
import { ExpenseModal } from "@/components/calendar/expense-modal";
import { AddIncomeModal } from "@/components/dashboard/add-income-modal";
import { DayDetailsModal } from "@/components/calendar/day-details-modal"; // NOWY IMPORT

interface CalendarUIProps {
  expenses: any[];
  incomes: any[];
}

export function CalendarUI({ expenses, incomes }: CalendarUIProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Stany dla modala Dodawania Wydatku
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState<Date | null>(null);

  // Stany dla modala Szczegółów Dnia (NOWE)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsDate, setDetailsDate] = useState<Date | null>(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)));
  };

  // Otwieranie Modala dodawania
  const handleAddExpense = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation(); // Blokuje kliknięcie w sam "dzień" pod spodem!
    setExpenseDate(date);
    setIsExpenseModalOpen(true);
  };

  // Otwieranie Modala szczegółów
  const handleDayClick = (date: Date) => {
    setDetailsDate(date);
    setIsDetailsModalOpen(true);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
        
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center gap-2 min-w-[170px]">
            <h2 className="text-xl font-bold capitalize">
              {format(currentMonth, 'LLLL', { locale: pl })}
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
        
        <div className="flex items-center gap-3">
          <AddIncomeModal />
          <button className="flex items-center gap-2 p-2 px-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/10">
            <Settings className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Kategorie</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl overflow-hidden shadow-sm">
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

            return (
              <div 
                key={i} 
                // Dodajemy onClick do całej kafelki dnia! (cursor-pointer)
                onClick={() => isCurrentMonth && handleDayClick(date)}
                className={`group relative min-h-[120px] p-2 transition-colors border-t border-l border-transparent
                  ${isCurrentMonth ? "bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer" : "bg-zinc-50/50 dark:bg-zinc-900/30 cursor-default"}
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

                <div className="flex flex-col gap-1 mt-1 max-h-[75px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {dayIncomes.map(income => (
                    <div key={income.id} title={income.source} className="truncate rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                      + {income.amount} zł
                    </div>
                  ))}
                  {dayExpenses.map(expense => (
                    <div key={expense.id} title={expense.description || expense.category?.name} className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium border ${expense.type === "EXPENSE" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"}`}>
                      {expense.type === "EXPENSE" ? "-" : ""} {expense.amount} zł {expense.category?.icon}
                    </div>
                  ))}
                </div>

                {isCurrentMonth && (
                  <button 
                    onClick={(e) => handleAddExpense(e, date)} // <--- e.stopPropagation wewnątrz tej funkcji
                    className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-lg transition-all transform scale-90 group-hover:opacity-100 group-hover:scale-100 hover:bg-primary/80 z-10"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stare dodawanie wydatków */}
      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        selectedDate={expenseDate}
      />

      {/* NOWY Modal ze szczegółami dnia */}
      <DayDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        date={detailsDate}
        allExpenses={expenses}
        allIncomes={incomes}
      />
    </div>
  );
}