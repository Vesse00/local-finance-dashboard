"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, TrendingDown, TrendingUp, PiggyBank, Calendar as CalendarIcon, ArrowRightLeft, Trash2, ChevronDown, ChevronUp, Landmark } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { deleteExpense, deleteIncome } from "@/lib/actions";

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  allExpenses: any[];
  allIncomes: any[];
  currency?: string;
}

export function DayDetailsModal({ isOpen, onClose, date, allExpenses, allIncomes, currency = "PLN" }: DayDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // NOWY STAN: Przechowuje ID transakcji, która jest obecnie rozwinięta
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setExpandedId(null); // Resetujemy rozwinięcie po otwarciu
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen || !date) return null;

  const handleDeleteExpense = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Blokuje kliknięcie w tło (zapobiega zwinięciu akordeonu)
    const formData = new FormData();
    formData.append("id", id);
    startTransition(async () => await deleteExpense(formData));
  };

  const handleDeleteIncome = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const formData = new FormData();
    formData.append("id", id);
    startTransition(async () => await deleteIncome(formData));
  };

  const dayIncomes = allIncomes.filter(i => isSameDay(new Date(i.date), date));
  const dayExpensesAll = allExpenses.filter(e => isSameDay(new Date(e.date), date));

  const dayExpenses = dayExpensesAll.filter(e => e.type === "EXPENSE");
  const daySavings = dayExpensesAll.filter(e => e.type === "SAVING" || e.type === "INVESTMENT");

  const totalIncomes = dayIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = dayExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSavings = daySavings.reduce((acc, curr) => acc + curr.amount, 0);

  const hasAnyTransactions = dayIncomes.length > 0 || dayExpenses.length > 0 || daySavings.length > 0;

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
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

        <div className="p-6 overflow-y-auto space-y-6">
          {!hasAnyTransactions ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <p>Brak transakcji w tym dniu.</p>
            </div>
          ) : (
            <>
              {/* WPŁYWY */}
              {dayIncomes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                    <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Wpływy</span>
                    <span>+{totalIncomes.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol' })}</span>
                  </div>
                  {dayIncomes.map(income => (
                    <div 
                      key={income.id} 
                      onClick={() => toggleExpand(income.id)}
                      className="group flex flex-col p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          {expandedId === income.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-emerald-600/50" />}
                          {income.source || "Wpływ"}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{income.amount.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol' })}</span>
                          <button onClick={(e) => handleDeleteIncome(e, income.id)} disabled={isPending} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* ROZWIJANE SZCZEGÓŁY Z BANKU */}
                      {expandedId === income.id && (
                        <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                          <p><strong className="text-emerald-700 dark:text-emerald-500">Nadawca:</strong> {income.source || "Brak danych"}</p>
                          <p><strong className="text-emerald-700 dark:text-emerald-500">Opis:</strong> {income.description || "Brak danych"}</p>
                          <p className="flex items-center gap-1.5"><Landmark className="w-3 h-3"/> <strong className="text-emerald-700 dark:text-emerald-500">Typ operacji:</strong> {income.bankTransactionType || "Wpis ręczny"}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* WYDATKI */}
              {dayExpenses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                    <span className="flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> Wydatki</span>
                    <span>-{totalExpenses.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol' })}</span>
                  </div>
                  {dayExpenses.map(expense => (
                    <div 
                      key={expense.id} 
                      onClick={() => toggleExpand(expense.id)}
                      className="group flex flex-col p-3 rounded-xl bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedId === expense.id ? <ChevronUp className="w-4 h-4 text-red-600/50" /> : <ChevronDown className="w-4 h-4 text-red-600/50" />}
                          <span className="text-base">{expense.category?.icon}</span>
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{expense.category?.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">-{expense.amount.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol' })}</span>
                          <button onClick={(e) => handleDeleteExpense(e, expense.id)} disabled={isPending} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* ROZWIJANE SZCZEGÓŁY Z BANKU */}
                      {expandedId === expense.id && (
                        <div className="mt-3 pt-3 border-t border-red-500/20 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                          <p><strong className="text-red-700 dark:text-red-500">Odbiorca:</strong> {expense.recipient || "Brak danych"}</p>
                          <p><strong className="text-red-700 dark:text-red-500">Opis transakcji:</strong> {expense.description || "Brak danych"}</p>
                          <p className="flex items-center gap-1.5"><Landmark className="w-3 h-3"/> <strong className="text-red-700 dark:text-red-500">Typ operacji:</strong> {expense.bankTransactionType || "Wpis ręczny"}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* OSZCZĘDNOŚCI */}
              {daySavings.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    <span className="flex items-center gap-1.5"><PiggyBank className="w-4 h-4" /> Odłożone</span>
                  </div>
                  {daySavings.map(saving => (
                    <div key={saving.id} className="group flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{saving.description || "Transfer"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{saving.amount.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol' })}</span>
                        <button onClick={(e) => handleDeleteExpense(e, saving.id)} disabled={isPending} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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