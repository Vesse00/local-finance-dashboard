"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, TrendingDown, TrendingUp, PiggyBank, Calendar as CalendarIcon, ArrowRightLeft } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  allExpenses: any[];
  allIncomes: any[];
}

export function DayDetailsModal({ isOpen, onClose, date, allExpenses, allIncomes }: DayDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen || !date) return null;

  // Filtrowanie transakcji tylko dla wybranego dnia
  const dayIncomes = allIncomes.filter(i => isSameDay(new Date(i.date), date));
  const dayExpensesAll = allExpenses.filter(e => isSameDay(new Date(e.date), date));

  // Podział wydatków na zwykłe i transfery (Oszczędności/Inwestycje)
  const dayExpenses = dayExpensesAll.filter(e => e.type === "EXPENSE");
  const daySavings = dayExpensesAll.filter(e => e.type === "SAVING" || e.type === "INVESTMENT");

  // Sumy
  const totalIncomes = dayIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = dayExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSavings = daySavings.reduce((acc, curr) => acc + curr.amount, 0);

  const hasAnyTransactions = dayIncomes.length > 0 || dayExpenses.length > 0 || daySavings.length > 0;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Nagłówek Modala */}
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white capitalize">
                {format(date, 'EEEE', { locale: pl })}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {format(date, 'd MMMM yyyy', { locale: pl })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ciało z transakcjami (przewijane) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!hasAnyTransactions ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <p>Brak transakcji w tym dniu.</p>
            </div>
          ) : (
            <>
              {/* Sekcja: Wpływy */}
              {dayIncomes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                    <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Wpływy</span>
                    <span>+{totalIncomes.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</span>
                  </div>
                  {dayIncomes.map(income => (
                    <div key={income.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{income.source || "Wpływ"}</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{income.amount} zł</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sekcja: Wydatki */}
              {dayExpenses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                    <span className="flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> Wydatki</span>
                    <span>-{totalExpenses.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</span>
                  </div>
                  {dayExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{expense.category?.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{expense.category?.name}</span>
                          {expense.description && <span className="text-xs text-zinc-500">{expense.description}</span>}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">-{expense.amount} zł</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sekcja: Transfery / Oszczędności */}
              {daySavings.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    <span className="flex items-center gap-1.5"><PiggyBank className="w-4 h-4" /> Odłożone / Inwestycje</span>
                    <span>{totalSavings.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</span>
                  </div>
                  {daySavings.map(saving => (
                    <div key={saving.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{saving.description || "Transfer"}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{saving.amount} zł</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}