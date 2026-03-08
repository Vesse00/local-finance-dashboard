"use client";

import { X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { addExpense } from "@/lib/actions";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
}

export function ExpenseModal({ isOpen, onClose, selectedDate }: ExpenseModalProps) {
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  
  // Stany dla własnej kategorii
  const [categorySelection, setCategorySelection] = useState("Jedzenie");
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset formularza po otwarciu
      setCategorySelection("Jedzenie");
      setCustomCategory("");
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Zastępujemy przesyłaną kategorię naszą nową, jeśli została wybrana opcja "nowa"
    if (categorySelection === "nowa" && customCategory.trim() !== "") {
      formData.set("category", customCategory.trim());
    }

    startTransition(async () => {
      await addExpense(formData);
      onClose();
    });
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold mb-1 text-zinc-900 dark:text-white">Dodaj wydatek</h3>
        <p className="text-sm text-zinc-500 mb-6">
          Dzień: {selectedDate?.toLocaleDateString("pl-PL", { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input type="hidden" name="date" value={selectedDate?.toISOString() || new Date().toISOString()} />
          
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Kwota (PLN)</label>
            <input name="amount" type="number" step="0.01" placeholder="0.00" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-zinc-900 dark:text-white" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Kategoria</label>
            <select 
              name="category" 
              value={categorySelection}
              onChange={(e) => setCategorySelection(e.target.value)}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none text-zinc-700 dark:text-zinc-300 mb-2"
            >
              <option value="Jedzenie">🍔 Jedzenie</option>
              <option value="Transport">🚗 Transport</option>
              <option value="Dom">🏠 Dom i rachunki</option>
              <option value="Inne">✨ Inne</option>
              <option value="nowa" className="text-primary font-bold">+ Dodaj nową...</option>
            </select>
            
            {/* Animowane pole wpisywania nowej kategorii */}
            {categorySelection === "nowa" && (
              <input 
                type="text" 
                placeholder="Wpisz nazwę kategorii..." 
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                className="w-full rounded-xl border border-primary/50 bg-primary/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-zinc-900 dark:text-white animate-in slide-in-from-top-2"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Opis (opcjonalnie)</label>
            <input name="description" type="text" placeholder="np. Zakupy w Biedronce" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-zinc-900 dark:text-white" />
          </div>
          
          <button type="submit" disabled={isPending} className="w-full mt-2 rounded-xl bg-primary hover:bg-primary/90 py-3 text-white font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? "Zapisywanie..." : "Zapisz wydatek"}
          </button>
        </form>
      </div>
    </div>
  ) : null;

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}