"use client";

import { X, Calendar as CalendarIcon, Repeat, Scale, ArrowRightLeft, LayoutList, Banknote } from "lucide-react";
import { useEffect, useState, useTransition, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { addExpense, adjustMainBalance, addWithdrawal } from "@/lib/actions";
import { RecurringForm } from "./recurring-form";
import { TransferForm } from "./transfer-form";
import { MultiExpenseForm } from "./multi-expense-form";
import { useLanguage } from "@/components/LanguageProvider";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  categories: any[];
  expenses?: any[];
  currency?: string;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

export function ExpenseModal({ isOpen, onClose, selectedDate, categories, expenses = [], currency = "PLN" }: ExpenseModalProps) {
  const { t, language } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  
  const [type, setType] = useState<"ONETIME" | "MULTI" | "RECURRING" | "CORRECTION" | "TRANSFER" | "WITHDRAWAL">("ONETIME");
  const [quickAmount, setQuickAmount] = useState<number | null>(null);

  const NEW_CATEGORY_CONST = t("calendar.modals.expense.category_new");
  const [categorySelection, setCategorySelection] = useState(NEW_CATEGORY_CONST);
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setType("ONETIME");
      setQuickAmount(null);
      setCategorySelection(categories.length > 0 ? categories[0].name : NEW_CATEGORY_CONST);
      setCustomCategory("");
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen, categories]);

  const handleQuickAmount = (val: number) => {
    setQuickAmount(val);
    if (amountRef.current) {
      amountRef.current.value = String(val);
    }
  };

  // Wydatki bieżącego miesiąca per kategoria
  const now = new Date();
  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e: any) => {
      if (e.type !== "EXPENSE") return;
      const d = new Date(e.date);
      if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return;
      const catName = e.category?.name || "";
      map[catName] = (map[catName] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const handleOnetimeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (categorySelection === NEW_CATEGORY_CONST && customCategory.trim() !== "") {
      formData.set("category", customCategory.trim());
    }
    startTransition(async () => {
      await addExpense(formData);
      onClose();
    });
  };

  const handleCorrectionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await adjustMainBalance(formData);
      onClose();
    });
  };

  const handleWithdrawalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await addWithdrawal(formData);
      onClose();
    });
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      {/* Szerszy modal dla trybu ONETIME, normalny dla reszty */}
      <div
        className={`relative w-full max-h-[92dvh] sm:max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${type === "MULTI" ? "max-w-3xl" : type === "ONETIME" ? "max-w-2xl" : "max-w-md"}`}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold mb-1 text-zinc-900 dark:text-white">{t("calendar.modals.expense.title")}</h3>
        <p className="text-sm text-zinc-500 mb-4">
          {selectedDate?.toLocaleDateString(language === "en" ? "en-US" : "pl-PL", { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="max-h-[calc(92dvh-8rem)] sm:max-h-[calc(85vh-8rem)] overflow-y-auto pr-1">
        {/* ZAKŁADKI TRYBU */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-5 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl">
          <button type="button" onClick={() => setType("ONETIME")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "ONETIME" ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <CalendarIcon className="w-3.5 h-3.5" /> {t("calendar.modals.expense.type_expense")}
          </button>
          <button type="button" onClick={() => setType("MULTI")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "MULTI" ? "bg-teal-500 shadow-md shadow-teal-500/20 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <LayoutList className="w-3.5 h-3.5" /> {t("calendar.modals.expense.type_multi")}
          </button>
          <button type="button" onClick={() => setType("WITHDRAWAL")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "WITHDRAWAL" ? "bg-yellow-500 shadow-md shadow-yellow-500/20 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <Banknote className="w-3.5 h-3.5" /> Bankomat
          </button>
          <button type="button" onClick={() => setType("TRANSFER")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "TRANSFER" ? "bg-blue-500 shadow-md shadow-blue-500/20 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <ArrowRightLeft className="w-3.5 h-3.5" /> {t("calendar.modals.expense.type_transfer")}
          </button>
          <button type="button" onClick={() => setType("RECURRING")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "RECURRING" ? "bg-indigo-500 shadow-md shadow-indigo-500/20 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <Repeat className="w-3.5 h-3.5" /> {t("calendar.modals.expense.type_recurring")}
          </button>
          <button type="button" onClick={() => setType("CORRECTION")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "CORRECTION" ? "bg-orange-500 shadow-md shadow-orange-500/20 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <Scale className="w-3.5 h-3.5" /> {t("calendar.modals.expense.type_correction")}
          </button>
        </div>

        {/* FORMULARZ ONETIME – 2 kolumny */}
        {type === "ONETIME" && (
          <form onSubmit={handleOnetimeSubmit} className="animate-in slide-in-from-left-4 duration-300">
            <input type="hidden" name="date" value={selectedDate?.toISOString() || new Date().toISOString()} />
            <input type="hidden" name="category" value={categorySelection === NEW_CATEGORY_CONST ? customCategory.trim() : categorySelection} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
              {/* LEWA KOLUMNA – kwota + opis + submit */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.expense.amount_label")}</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {QUICK_AMOUNTS.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickAmount(val)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          quickAmount === val
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        {val} zł
                      </button>
                    ))}
                  </div>
                  <input
                    ref={amountRef}
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder={t("calendar.modals.expense.amount_placeholder")}
                    defaultValue={quickAmount ?? ""}
                    onChange={() => setQuickAmount(null)}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white text-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.expense.description_label")}</label>
                  <input name="description" type="text" placeholder={t("calendar.modals.expense.description_placeholder")} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white" />
                </div>

                <button type="submit" disabled={isPending} className="w-full rounded-xl bg-primary py-3 text-white font-semibold shadow-lg shadow-primary/20 disabled:opacity-50 transition-opacity">
                  {isPending ? t("calendar.modals.expense.submitting") : t("calendar.modals.expense.submit_expense")}
                </button>
              </div>

              {/* PRAWA KOLUMNA – kategorie ze wskaźnikiem budżetu */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.expense.category_label")}</label>
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-72 pr-0.5 flex-1">
                  {categories.map((cat: any) => {
                    const spent = spendByCategory[cat.name] || 0;
                    const limit = cat.budgetLimit;
                    const pct = limit ? Math.min(100, (spent / limit) * 100) : 0;
                    const barColor = pct < 60 ? "bg-emerald-500" : pct < 85 ? "bg-amber-500" : "bg-red-500";
                    const isSelected = categorySelection === cat.name;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategorySelection(cat.name)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary shadow-sm"
                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base leading-none">{cat.icon}</span>
                          <span className={`text-xs font-semibold truncate flex-1 ${isSelected ? "text-primary" : "text-zinc-700 dark:text-zinc-300"}`}>{cat.name}</span>
                        </div>
                        {limit ? (
                          <>
                            <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
                              <span>{spent.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} / {limit.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł</span>
                              <span className={pct >= 85 ? "text-red-500 font-bold" : ""}>{Math.round(pct)}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-zinc-400">{t("calendar.modals.expense.category_no_limit")}</div>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCategorySelection(NEW_CATEGORY_CONST)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border border-dashed transition-all ${
                      categorySelection === NEW_CATEGORY_CONST
                        ? "bg-primary/10 border-primary"
                        : "bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/20 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">＋</span>
                      <span className="text-xs font-semibold text-zinc-500">{t("calendar.modals.expense.category_new_label")}</span>
                    </div>
                  </button>
                </div>
                {categorySelection === NEW_CATEGORY_CONST && (
                  <input type="text" placeholder={t("calendar.modals.expense.category_custom_placeholder")} value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} required className="mt-2 w-full rounded-xl border border-primary/50 bg-primary/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white text-sm animate-in slide-in-from-top-2" />
                )}
              </div>
            </div>
          </form>
        )}

        {type === "MULTI" && (
          <MultiExpenseForm
            selectedDate={selectedDate}
            categories={categories}
            onSuccess={onClose}
            currency={currency}
          />
        )}

        {type === "TRANSFER" && (
          <TransferForm defaultDate={selectedDate} onSuccess={onClose} defaultFrom="MAIN" defaultTo="SAVINGS" />
        )}

        {type === "WITHDRAWAL" && (
          <form className="space-y-4 animate-in fade-in duration-300" onSubmit={handleWithdrawalSubmit}>
            <input type="hidden" name="date" value={selectedDate?.toISOString() || new Date().toISOString()} />
            <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-700 dark:text-yellow-400">
              💵 Wypłata gotówkowa jest traktowana jako <strong>transfer</strong> — nie jest liczona jako wydatek w statystykach.
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Kwota wypłaty</label>
              <input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-zinc-900 dark:text-white text-lg font-bold" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Opis (opcjonalny)</label>
              <input name="description" type="text" defaultValue="Wypłata gotówkowa" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-zinc-900 dark:text-white" />
            </div>
            <button type="submit" disabled={isPending} className="w-full mt-2 rounded-xl bg-yellow-500 py-3 text-white font-semibold shadow-lg shadow-yellow-500/20 disabled:opacity-50">
              {isPending ? "Zapisywanie..." : "💵 Zarejestruj wypłatę"}
            </button>
          </form>
        )}

        {type === "RECURRING" && (
          <div className="animate-in fade-in duration-300">
            <RecurringForm categories={categories} defaultDate={selectedDate?.getDate() || 1} onSuccess={onClose} />
          </div>
        )}

        {type === "CORRECTION" && (
          <form className="space-y-4 animate-in slide-in-from-right-4 duration-300" onSubmit={handleCorrectionSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.expense.correction_label")}</label>
              <input name="amount" type="number" step="0.01" placeholder={t("calendar.modals.expense.correction_placeholder")} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-zinc-900 dark:text-white text-lg font-bold" required />
            </div>
            <button type="submit" disabled={isPending} className="w-full mt-4 rounded-xl bg-orange-500 py-3 text-white font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-50">
              {isPending ? t("calendar.modals.expense.submitting") : t("calendar.modals.expense.submit_correction")}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  ) : null;

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}