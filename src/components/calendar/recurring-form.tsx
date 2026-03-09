"use client";

import { useState, useTransition } from "react";
import { addRecurringPayment } from "@/lib/actions";

interface RecurringFormProps {
  categories: any[];
  defaultDate?: number;
  onSuccess: () => void;
}

export function RecurringForm({ categories, defaultDate = 1, onSuccess }: RecurringFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isCredit, setIsCredit] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      await addRecurringPayment(formData);
      onSuccess(); // Zamyka modal po udanym zapisie
    });
  };

  return (
    <form className="space-y-4 animate-in fade-in duration-300" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Nazwa płatności</label>
        <input name="name" type="text" placeholder="np. Spotify, Rata za telefon" required className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white" />
      </div>

      {/* PIERWSZY RZĄD: Kwota i Dzień */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Kwota (m-c)</label>
          <input name="defaultAmount" type="number" step="0.01" required placeholder="0.00" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Dzień płatności</label>
          <input name="dayOfMonth" type="number" min="1" max="31" required defaultValue={defaultDate} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white" />
        </div>
      </div>

      {/* DRUGI RZĄD: Kategoria i Zakończenie */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Kategoria</label>
          <select name="categoryId" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white appearance-none">
            <option value="null" className="bg-white dark:bg-zinc-900">Brak kategorii</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900">{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Zakończenie (opcja)</label>
          <input name="endDate" type="date" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white cursor-pointer" />
        </div>
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-3 p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 cursor-pointer hover:bg-indigo-500/10 transition-colors">
          <input type="checkbox" checked={isCredit} onChange={() => setIsCredit(!isCredit)} className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">To jest kredyt / dług</span>
            <span className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Włącz, by śledzić postęp spłaty</span>
          </div>
        </label>
      </div>

      {isCredit && (
        <div className="animate-in slide-in-from-top-2">
          <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Kwota CAŁKOWITA do spłaty (PLN)</label>
          <input name="totalAmount" type="number" step="0.01" placeholder="np. 50000" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white" required={isCredit} />
        </div>
      )}

      <button type="submit" disabled={isPending} className="w-full mt-4 rounded-xl bg-indigo-500 py-3 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 disabled:opacity-50">
        {isPending ? "Zapisywanie..." : "Dodaj zlecenie stałe"}
      </button>
    </form>
  );
}