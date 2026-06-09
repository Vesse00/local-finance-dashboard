"use client";

import { useState, useTransition } from "react";
// ZMIANA: Dodany import updateRecurringPayment
import { addRecurringPayment, updateRecurringPayment } from "@/lib/actions";
import { useLanguage } from "@/components/LanguageProvider";

interface RecurringFormProps {
  categories: any[];
  defaultDate?: number;
  onSuccess: () => void;
  initialData?: any; // NOWE: Pozwala przekazać dane do edycji
}

export function RecurringForm({ categories, defaultDate = 1, onSuccess, initialData }: RecurringFormProps) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  // NOWE: Jeśli edytujemy dług/kredyt, od razu włącz isCredit na starcie
  const [isCredit, setIsCredit] = useState(initialData?.totalAmount != null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Jeśli to edycja, doklejamy ID do FormDaty, żeby Action wiedziało co updatować
    if (initialData) {
      formData.append("id", initialData.id);
    }
    
    startTransition(async () => {
      if (initialData) {
        await updateRecurringPayment(formData);
      } else {
        await addRecurringPayment(formData);
      }
      onSuccess(); 
    });
  };

  // Wyciągamy bezpiecznie datę zakończenia jeśli istnieje
  const formattedEndDate = initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "";

  return (
    <form className="space-y-4 animate-in fade-in duration-300" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.recurring_form.payment_name")}</label>
        <input name="name" type="text" defaultValue={initialData?.name} placeholder={t("calendar.modals.recurring_form.payment_placeholder")} required className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.recurring_form.amount_month")}</label>
          <input name="defaultAmount" type="number" step="0.01" defaultValue={initialData?.defaultAmount} required placeholder={t("calendar.modals.recurring_form.amount_placeholder")} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.recurring_form.payment_day")}</label>
          <input name="dayOfMonth" type="number" min="1" max="31" required defaultValue={initialData?.dayOfMonth || defaultDate} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.recurring_form.category")}</label>
          <select name="categoryId" defaultValue={initialData?.categoryId || "null"} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white appearance-none">
            <option value="null" className="bg-white dark:bg-zinc-900">{t("calendar.modals.recurring_form.no_category")}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900">{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("calendar.modals.recurring_form.end_date")}</label>
          <input name="endDate" type="date" defaultValue={formattedEndDate} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white cursor-pointer" />
        </div>
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-3 p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 cursor-pointer hover:bg-indigo-500/10 transition-colors">
          <input type="checkbox" checked={isCredit} onChange={() => setIsCredit(!isCredit)} className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{t("calendar.modals.recurring_form.is_credit_title")}</span>
            <span className="text-xs text-indigo-600/70 dark:text-indigo-400/70">{t("calendar.modals.recurring_form.is_credit_subtitle")}</span>
          </div>
        </label>
      </div>

      {isCredit && (
        <div className="space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
                {t("calendar.modals.recurring_form.total_amount")}
              </label>
              <input 
                name="totalAmount" 
                type="number" 
                step="0.01" 
                defaultValue={initialData?.totalAmount}
                placeholder={t("calendar.modals.recurring_form.total_amount_placeholder")} 
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white" 
                required={isCredit} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
                {t("calendar.modals.recurring_form.remaining_amount")}
              </label>
              <input 
                name="remainingAmount" 
                type="number" 
                step="0.01" 
                defaultValue={initialData?.remainingAmount}
                placeholder={t("calendar.modals.recurring_form.remaining_amount_placeholder")} 
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white" 
                required={isCredit} 
              />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 italic">
            {t("calendar.modals.recurring_form.credit_info")}
          </p>
        </div>
      )}

      {/* Sekcja dopasowania importu - zawsze widoczna */}
      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 space-y-3">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Dopasowanie przy imporcie z banku</p>
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-500">Numer konta odbiorcy (IBAN)</label>
          <input
            name="recipientAccountNo"
            type="text"
            defaultValue={initialData?.recipientAccountNo || ""}
            placeholder="np. 82160014621815538750000002"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white font-mono"
          />
          <p className="text-[10px] text-zinc-400 mt-1">Import automatycznie scali transakcję z tym zleceniem i użyje faktycznej zapłaconej kwoty.</p>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-500">Fraza w opisie (fallback dla kart bez IBAN)</label>
          <input
            name="matchPhrase"
            type="text"
            defaultValue={initialData?.matchPhrase || ""}
            placeholder="np. Orange, Netflix, Allegro Pay"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white"
          />
        </div>
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-indigo-500 py-3 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 disabled:opacity-50">
        {isPending ? t("calendar.modals.recurring_form.saving") : initialData ? t("calendar.modals.recurring_form.save_changes") : t("calendar.modals.recurring_form.add_recurring")}
      </button>
    </form>
  );
}