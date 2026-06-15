"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Wallet } from "lucide-react";
import { addIncome } from "@/lib/actions";
import { useLanguage } from "@/components/LanguageProvider";

export function AddIncomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  // Upewniamy się, że portal renderuje się tylko po stronie klienta (żeby uniknąć błędów hydratacji Next.js)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Blokowanie scrollowania pod modalem
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await addIncome(formData);
      setIsOpen(false);
    });
  };

  const modalContent = isOpen ? (
    <div 
      className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md" 
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="relative w-full max-w-md max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{t("dashboard.main.modal.title")}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("dashboard.main.modal.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("dashboard.main.modal.amount")}</label>
            <input name="amount" type="number" step="0.01" placeholder={t("dashboard.main.modal.amount_placeholder")} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-zinc-900 dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">{t("dashboard.main.modal.source")}</label>
            <input name="source" type="text" placeholder={t("dashboard.main.modal.source_placeholder")} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-zinc-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Kategoria</label>
            <select name="category" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-zinc-800 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-zinc-900 dark:text-white">
              <option value="">– wybierz –</option>
              <option value="Wynagrodzenie">💵 Wynagrodzenie</option>
              <option value="Premia">🏆 Premia</option>
              <option value="Odsetki">📈 Odsetki</option>
              <option value="Zwrot">↩️ Zwrot</option>
              <option value="Inne">📌 Inne</option>
            </select>
          </div>
          <button type="submit" disabled={isPending} className="active:scale-95 ease-in-out w-full  mt-2 rounded-xl bg-primary py-3 text-white font-semibold shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
            {isPending ? t("dashboard.main.modal.submitting") : t("dashboard.main.modal.submit")}
          </button>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="active:scale-95 ease-in-out flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
        <Plus className="w-4 h-4" /> {t("dashboard.main.modal.button")}
      </button>
      {/* Wypychamy modal na samą górę drzewa dokumentu */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}