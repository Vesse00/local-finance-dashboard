"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, TrendingDown, TrendingUp, PiggyBank, Calendar as CalendarIcon, ArrowRightLeft, Trash2, ChevronDown, ChevronUp, Landmark, Pencil, Check, Ban } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { deleteExpense, deleteIncome, updateIncome, updateExpense } from "@/lib/actions";
import { useLanguage } from "@/components/LanguageProvider";

const INCOME_CATEGORIES = [
  { value: "Wynagrodzenie", label: "💵 Wynagrodzenie" },
  { value: "Premia", label: "🏆 Premia" },
  { value: "Odsetki", label: "📈 Odsetki" },
  { value: "Zwrot", label: "↩️ Zwrot" },
  { value: "Inne", label: "📌 Inne" },
];

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  allExpenses: any[];
  allIncomes: any[];
  categories?: any[];
  currency?: string;
}

export function DayDetailsModal({ isOpen, onClose, date, allExpenses, allIncomes, categories = [], currency = "PLN" }: DayDetailsModalProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === "en" ? enUS : pl;

  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit form state
  const [editAmount, setEditAmount] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setExpandedId(null);
      setEditingId(null);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen || !date) return null;

  const startEditIncome = (income: any) => {
    setEditingId(income.id);
    setExpandedId(null);
    setEditAmount(String(income.amount));
    setEditSource(income.source || "");
    setEditCategory(income.category || "");
  };

  const startEditExpense = (expense: any) => {
    setEditingId(expense.id);
    setExpandedId(null);
    setEditAmount(String(expense.amount));
    setEditDescription(expense.description || "");
    setEditCategoryId(expense.categoryId || "");
  };

  const cancelEdit = () => setEditingId(null);

  const handleSaveIncome = (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("amount", editAmount);
    formData.append("source", editSource);
    formData.append("category", editCategory);
    startTransition(async () => {
      await updateIncome(formData);
      setEditingId(null);
    });
  };

  const handleSaveExpense = (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("amount", editAmount);
    formData.append("description", editDescription);
    if (editCategoryId) formData.append("categoryId", editCategoryId);
    startTransition(async () => {
      await updateExpense(formData);
      setEditingId(null);
    });
  };

  const handleDeleteExpense = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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

  const hasAnyTransactions = dayIncomes.length > 0 || dayExpenses.length > 0 || daySavings.length > 0;

  const toggleExpand = (id: string) => {
    if (editingId === id) return;
    setExpandedId(prev => (prev === id ? null : id));
  };

  const inputCls = "w-full rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white";
  const selectCls = "w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white";

  const modalContent = (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
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
                {format(date, 'EEEE', { locale: dateLocale })}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {format(date, 'd MMMM yyyy', { locale: dateLocale })}
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
              <p>{t("calendar.modals.day_details.empty")}</p>
            </div>
          ) : (
            <>
              {/* WPŁYWY */}
              {dayIncomes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                    <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> {t("calendar.modals.day_details.incomes")}</span>
                    <span>+{totalIncomes.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol' })}</span>
                  </div>
                  {dayIncomes.map(income => (
                    <div key={income.id} className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 overflow-hidden">
                      <div
                        onClick={() => toggleExpand(income.id)}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                      >
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          {editingId !== income.id && (expandedId === income.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-emerald-600/50" />)}
                          {income.source || t("calendar.modals.day_details.income_default")}
                          {income.category && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                              {income.category}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{income.amount.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol' })}</span>
                          <button onClick={e => { e.stopPropagation(); startEditIncome(income); }} disabled={isPending} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all disabled:opacity-50">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleDeleteIncome(e, income.id)} disabled={isPending} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* FORMULARZ EDYCJI */}
                      {editingId === income.id && (
                        <div className="px-3 pb-3 pt-1 border-t border-emerald-500/20 space-y-2" onClick={e => e.stopPropagation()}>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Kwota</label>
                              <input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Źródło</label>
                              <input type="text" value={editSource} onChange={e => setEditSource(e.target.value)} className={inputCls} />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Kategoria</label>
                            <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className={selectCls}>
                              <option value="">– brak –</option>
                              {INCOME_CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => handleSaveIncome(income.id)} disabled={isPending} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                              <Check className="w-3.5 h-3.5" /> Zapisz
                            </button>
                            <button onClick={cancelEdit} disabled={isPending} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 text-xs font-semibold hover:bg-black/10 disabled:opacity-50 transition-colors">
                              <Ban className="w-3.5 h-3.5" /> Anuluj
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ROZWINIĘTE SZCZEGÓŁY */}
                      {expandedId === income.id && editingId !== income.id && (
                        <div className="px-3 pb-3 pt-1 border-t border-emerald-500/20 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                          <p><strong className="text-emerald-700 dark:text-emerald-500">{t("calendar.modals.day_details.sender")}</strong> {income.source || t("calendar.modals.day_details.no_data")}</p>
                          <p><strong className="text-emerald-700 dark:text-emerald-500">{t("calendar.modals.day_details.description")}</strong> {income.description || t("calendar.modals.day_details.no_data")}</p>
                          <p className="flex items-center gap-1.5"><Landmark className="w-3 h-3" /> <strong className="text-emerald-700 dark:text-emerald-500">{t("calendar.modals.day_details.operation_type")}</strong> {income.bankTransactionType || t("calendar.modals.day_details.manual_entry")}</p>
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
                    <span className="flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> {t("calendar.modals.day_details.expenses")}</span>
                    <span>-{totalExpenses.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol' })}</span>
                  </div>
                  {dayExpenses.map(expense => (
                    <div key={expense.id} className="rounded-xl bg-red-500/10 border border-red-500/20 overflow-hidden">
                      <div
                        onClick={() => toggleExpand(expense.id)}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-red-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {editingId !== expense.id && (expandedId === expense.id ? <ChevronUp className="w-4 h-4 text-red-600/50" /> : <ChevronDown className="w-4 h-4 text-red-600/50" />)}
                          <span className="text-base">{expense.category?.icon}</span>
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{expense.category?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">-{expense.amount.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: 'narrowSymbol' })}</span>
                          <button onClick={e => { e.stopPropagation(); startEditExpense(expense); }} disabled={isPending} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all disabled:opacity-50">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleDeleteExpense(e, expense.id)} disabled={isPending} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* FORMULARZ EDYCJI */}
                      {editingId === expense.id && (
                        <div className="px-3 pb-3 pt-1 border-t border-red-500/20 space-y-2" onClick={e => e.stopPropagation()}>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Kwota</label>
                              <input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Opis</label>
                              <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} className={inputCls} />
                            </div>
                          </div>
                          {categories.length > 0 && (
                            <div>
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Kategoria</label>
                              <select value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)} className={selectCls}>
                                <option value="">– bez zmiany –</option>
                                {categories.map((cat: any) => (
                                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => handleSaveExpense(expense.id)} disabled={isPending} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                              <Check className="w-3.5 h-3.5" /> Zapisz
                            </button>
                            <button onClick={cancelEdit} disabled={isPending} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 text-xs font-semibold hover:bg-black/10 disabled:opacity-50 transition-colors">
                              <Ban className="w-3.5 h-3.5" /> Anuluj
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ROZWINIĘTE SZCZEGÓŁY */}
                      {expandedId === expense.id && editingId !== expense.id && (
                        <div className="px-3 pb-3 pt-1 border-t border-red-500/20 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                          <p><strong className="text-red-700 dark:text-red-500">{t("calendar.modals.day_details.recipient")}</strong> {expense.recipient || t("calendar.modals.day_details.no_data")}</p>
                          <p><strong className="text-red-700 dark:text-red-500">{t("calendar.modals.day_details.transaction_description")}</strong> {expense.description || t("calendar.modals.day_details.no_data")}</p>
                          <p className="flex items-center gap-1.5"><Landmark className="w-3 h-3" /> <strong className="text-red-700 dark:text-red-500">{t("calendar.modals.day_details.operation_type")}</strong> {expense.bankTransactionType || t("calendar.modals.day_details.manual_entry")}</p>
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
                    <span className="flex items-center gap-1.5"><PiggyBank className="w-4 h-4" /> {t("calendar.modals.day_details.savings")}</span>
                  </div>
                  {daySavings.map(saving => (
                    <div key={saving.id} className="group flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{saving.description || t("calendar.modals.day_details.transfer")}</span>
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