"use client";

import { X, Calendar as CalendarIcon, Repeat, Scale, ArrowRightLeft } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { addExpense, adjustMainBalance } from "@/lib/actions";
import { RecurringForm } from "./recurring-form";
import { TransferForm } from "./transfer-form";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  categories: any[]; 
}

export function ExpenseModal({ isOpen, onClose, selectedDate, categories }: ExpenseModalProps) {
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  
  // ZMIANA: Mamy 4 opcje
  const [type, setType] = useState<"ONETIME" | "RECURRING" | "CORRECTION" | "TRANSFER">("ONETIME");

  const [categorySelection, setCategorySelection] = useState("nowa");
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setType("ONETIME");
      setCategorySelection(categories.length > 0 ? categories[0].name : "nowa");
      setCustomCategory("");
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen, categories]);

  const handleOnetimeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (categorySelection === "nowa" && customCategory.trim() !== "") {
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

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold mb-1 text-zinc-900 dark:text-white">Operacja w dniu</h3>
        <p className="text-sm text-zinc-500 mb-6">
          {selectedDate?.toLocaleDateString("pl-PL", { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* SIATKA 2x2 */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-black/5 dark:bg-white/5 p-2 rounded-2xl">
          <button type="button" onClick={() => setType("ONETIME")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "ONETIME" ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <CalendarIcon className="w-3.5 h-3.5" /> Wydatek
          </button>
          <button type="button" onClick={() => setType("TRANSFER")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "TRANSFER" ? "bg-blue-500 shadow-md shadow-blue-500/20 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
          </button>
          <button type="button" onClick={() => setType("RECURRING")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "RECURRING" ? "bg-indigo-500 shadow-md shadow-indigo-500/20 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <Repeat className="w-3.5 h-3.5" /> Cykliczna
          </button>
          <button type="button" onClick={() => setType("CORRECTION")} className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${type === "CORRECTION" ? "bg-orange-500 shadow-md shadow-orange-500/20 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <Scale className="w-3.5 h-3.5" /> Korekta
          </button>
        </div>

        {/* FORMULARZE */}
        {type === "ONETIME" && (
          <form className="space-y-4 animate-in slide-in-from-left-4 duration-300" onSubmit={handleOnetimeSubmit}>
            <input type="hidden" name="date" value={selectedDate?.toISOString() || new Date().toISOString()} />
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Kwota (PLN)</label>
              <input name="amount" type="number" step="0.01" placeholder="0.00" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Kategoria</label>
              <select name="category" value={categorySelection} onChange={(e) => setCategorySelection(e.target.value)} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white mb-2">
                {categories.map(cat => <option key={cat.id} value={cat.name} className="bg-white dark:bg-zinc-900">{cat.icon} {cat.name}</option>)}
                <option value="nowa" className="text-primary font-bold bg-white dark:bg-zinc-900">+ Dodaj nową...</option>
              </select>
              {categorySelection === "nowa" && <input type="text" placeholder="Wpisz nazwę kategorii..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} required className="w-full rounded-xl border border-primary/50 bg-primary/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white animate-in slide-in-from-top-2" />}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Opis</label>
              <input name="description" type="text" placeholder="np. Zakupy" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white" />
            </div>
            <button type="submit" disabled={isPending} className="w-full mt-2 rounded-xl bg-primary py-3 text-white font-semibold shadow-lg shadow-primary/20 disabled:opacity-50">
              {isPending ? "Zapisywanie..." : "Zapisz wydatek"}
            </button>
          </form>
        )}

        {/* NASZ TRANSFER FORM! Z domyślnym ustawieniem z Portfela na Oszczędności */}
        {type === "TRANSFER" && (
          <TransferForm defaultDate={selectedDate} onSuccess={onClose} defaultFrom="MAIN" defaultTo="SAVINGS" />
        )}

        {type === "RECURRING" && (
          <div className="animate-in fade-in duration-300">
            <RecurringForm categories={categories} defaultDate={selectedDate?.getDate() || 1} onSuccess={onClose} />
          </div>
        )}

        {type === "CORRECTION" && (
          <form className="space-y-4 animate-in slide-in-from-right-4 duration-300" onSubmit={handleCorrectionSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Prawdziwe saldo</label>
              <input name="amount" type="number" step="0.01" placeholder="np. 1250.50" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-zinc-900 dark:text-white text-lg font-bold" required />
            </div>
            <button type="submit" disabled={isPending} className="w-full mt-4 rounded-xl bg-orange-500 py-3 text-white font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-50">
              {isPending ? "Obliczanie..." : "Wyrównaj saldo"}
            </button>
          </form>
        )}

      </div>
    </div>
  ) : null;

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}