"use client";

import { useState, useTransition } from "react";
import { Repeat, Plus, X, Trash2, CalendarDays, ArrowUpCircle, Edit } from "lucide-react";
import { addRecurringPayment, deleteRecurringPayment, overpayRecurring } from "@/lib/actions";
import { RecurringForm } from "./recurring-form";
import { useLanguage } from "@/components/LanguageProvider";

interface RecurringUIProps {
  recurrings: any[];
  categories: any[];
  currency: string;
}

export function RecurringUI({ recurrings, categories, currency }: RecurringUIProps) {
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [overpayModalId, setOverpayModalId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if(!confirm(t("calendar.modals.recurring_ui.confirm_delete"))) return;
    const formData = new FormData();
    formData.append("id", id);
    startTransition(async () => {
      await deleteRecurringPayment(formData);
    });
  };

  const handleOverpay = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await overpayRecurring(formData);
      setOverpayModalId(null);
    });
  };

  const openAddModal = () => {
    setEditingPayment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (payment: any) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

return (
    <div className="flex-1 p-6 md:p-8 space-y-6">
      
      {/* NAGŁÓWEK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl p-6 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Repeat className="w-6 h-6 text-indigo-500" />
            {t("calendar.modals.recurring_ui.title")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("calendar.modals.recurring_ui.subtitle")}
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-5 h-5" /> {t("calendar.modals.recurring_ui.new_order_btn")}
        </button>
      </div>

      {/* KARTY ZLECEŃ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recurrings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-white/30 dark:bg-black/20 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
            {t("calendar.modals.recurring_ui.empty_list")}
          </div>
        ) : (
          recurrings.map(rec => {
            const isLoan = rec.totalAmount !== null;
            const progress = isLoan ? ((rec.totalAmount - (rec.remainingAmount || 0)) / rec.totalAmount) * 100 : 0;
            const isFullyPaid = isLoan && (rec.remainingAmount || 0) <= 0;

            return (
              <div key={rec.id} className="relative p-5 rounded-2xl bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-sm group hover:border-indigo-500/30 transition-all flex flex-col">
                
                {/* NOWE: Ołówek do edycji */}
                <button 
                  onClick={() => openEditModal(rec)}
                  className="absolute top-4 right-12 p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                  title={t("calendar.modals.recurring_ui.edit_tooltip")}
                >
                  <Edit className="w-4 h-4" />
                </button>

                {/* Stary kosz do usuwania */}
                <button 
                  onClick={() => handleDelete(rec.id)}
                  className="absolute top-4 right-4 p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                  title={t("calendar.modals.recurring_ui.delete_tooltip")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-xl shadow-inner shrink-0">
                    {rec.category?.icon || "🔄"}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white leading-tight pr-14">{rec.name}</h3>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                      <CalendarDays className="w-3 h-3" /> {t("calendar.modals.recurring_ui.paid_on", { day: language === "en" ? getOrdinal(rec.dayOfMonth) : rec.dayOfMonth.toString() })}
                    </p>
                  </div>
                </div>

                <div className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-4">
                  {rec.defaultAmount.toLocaleString(language === "pl" ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                  <span className="text-sm font-normal text-zinc-500">{t("calendar.modals.recurring_ui.per_month")}</span>
                </div>

                <div className="mt-auto">
                  {isLoan && (
                    <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-500">{t("calendar.modals.recurring_ui.progress_paid", { percent: Math.min(100, progress).toFixed(0) })}</span>
                        <span className={`font-bold ${isFullyPaid ? "text-emerald-500" : "text-zinc-900 dark:text-white"}`}>
                          {isFullyPaid ? t("calendar.modals.recurring_ui.fully_paid") : t("calendar.modals.recurring_ui.progress_left", { 
                            amount: (rec.remainingAmount || 0).toLocaleString(language === "pl" ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })
                          })}
                        </span>
                      </div>
                      
                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${isFullyPaid ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${Math.min(100, progress)}%` }}></div>
                      </div>

                      {!isFullyPaid && (
                        <button 
                          onClick={() => setOverpayModalId(rec.id)}
                          className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors"
                        >
                          <ArrowUpCircle className="w-4 h-4" /> {t("calendar.modals.recurring_ui.overpay_btn")}
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL DODAWANIA/EDYCJI ZLECENIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-zinc-900 dark:text-white">
              <Repeat className="w-5 h-5 text-indigo-500" /> {editingPayment ? t("calendar.modals.recurring_ui.edit_modal_title") : t("calendar.modals.recurring_ui.add_modal_title")}
            </h3>
            {/* NOWE: Przekazujemy initialData do formularza! */}
            <RecurringForm categories={categories} onSuccess={() => setIsModalOpen(false)} initialData={editingPayment} />
          </div>
        </div>
      )}

      {/* MODAL NADPŁATY - bez zmian */}
      {overpayModalId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setOverpayModalId(null)}>
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOverpayModalId(null)} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2 text-zinc-900 dark:text-white">
              <ArrowUpCircle className="w-5 h-5 text-indigo-500" /> {t("calendar.modals.recurring_ui.overpay_modal_title")}
            </h3>
            <p className="text-sm text-zinc-500 mb-6">{t("calendar.modals.recurring_ui.overpay_subtitle")}</p>

            <form onSubmit={handleOverpay} className="space-y-4">
              <input type="hidden" name="id" value={overpayModalId} />
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.recurring_ui.overpay_amount_label")} ({t("calendar.currency")})</label>
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  placeholder={t("calendar.modals.recurring_ui.overpay_placeholder")} 
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white text-lg font-bold" 
                  required 
                />
              </div>

              <button type="submit" disabled={isPending} className="w-full mt-2 rounded-xl bg-indigo-500 py-3 text-white font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 hover:bg-indigo-600 transition-all">
                {isPending ? t("calendar.modals.recurring_ui.saving") : t("calendar.modals.recurring_ui.submit_overpay")}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}