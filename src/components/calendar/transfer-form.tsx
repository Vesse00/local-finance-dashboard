"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface TransferFormProps {
  defaultDate?: Date | null;
  onSuccess: () => void;
  defaultFrom?: string;
  defaultTo?: string;
}

export function TransferForm({ defaultDate, onSuccess, defaultFrom = "MAIN", defaultTo = "SAVINGS" }: TransferFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [fromAccount, setFromAccount] = useState(defaultFrom);
  const [toAccount, setToAccount] = useState(defaultTo);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = formData.get("amount");
    const date = formData.get("date");

    if (fromAccount === toAccount) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, fromAccount, toAccount, date })
        });

        if (!res.ok) throw new Error("Błąd podczas transferu");

        router.refresh(); 
        onSuccess();
      } catch (error: any) {
        console.error(error);
        alert("Wystąpił błąd. Spróbuj ponownie.");
      }
    });
  };

  const isSameAccount = fromAccount === toAccount;

  return (
    <form className="space-y-4 animate-in fade-in duration-300" onSubmit={handleSubmit}>
      <input type="hidden" name="date" value={defaultDate?.toISOString() || new Date().toISOString()} />
      
      {/* SELEKCJA KONT */}
      <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/5 dark:border-white/5">
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-zinc-500">Z konta</label>
          <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className="w-full bg-transparent outline-none font-semibold text-sm text-zinc-900 dark:text-white cursor-pointer">
            <option value="MAIN" className="bg-white dark:bg-zinc-900">Portfel</option>
            <option value="SAVINGS" className="bg-white dark:bg-zinc-900">Oszczędności</option>
            <option value="INVESTMENTS" disabled className="bg-white dark:bg-zinc-900 text-zinc-400">Inwestycje</option>
            <option value="CURRENCY" disabled className="bg-white dark:bg-zinc-900 text-zinc-400">Walutowe</option>
          </select>
        </div>
        
        <div className="flex items-center justify-center text-zinc-400 bg-white dark:bg-zinc-800 p-1.5 rounded-full shadow-sm">
           <ArrowRight className="w-4 h-4" />
        </div>

        <div className="flex-1 text-right">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-zinc-500">Na konto</label>
          <select value={toAccount} onChange={(e) => setToAccount(e.target.value)} className="w-full bg-transparent outline-none font-semibold text-sm text-zinc-900 dark:text-white cursor-pointer appearance-none" style={{ textAlignLast: 'right' }}>
            <option value="MAIN" className="bg-white dark:bg-zinc-900 text-left">Portfel</option>
            <option value="SAVINGS" className="bg-white dark:bg-zinc-900 text-left">Oszczędności</option>
            <option value="INVESTMENTS" disabled className="bg-white dark:bg-zinc-900 text-zinc-400 text-left">Inwestycje</option>
            <option value="CURRENCY" disabled className="bg-white dark:bg-zinc-900 text-zinc-400 text-left">Walutowe</option>
          </select>
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Przesuwana kwota (PLN)</label>
        <input name="amount" type="number" step="0.01" placeholder="np. 500" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-white text-lg font-bold" required />
      </div>

      <button type="submit" disabled={isPending || isSameAccount} className="w-full mt-4 rounded-xl py-3 text-white font-semibold shadow-lg transition-all hover:brightness-110 disabled:opacity-50 bg-blue-600 shadow-blue-600/20">
        {isPending ? "Przetwarzanie..." : isSameAccount ? "Wybierz różne konta" : "Wykonaj transfer"}
      </button>
    </form>
  );
}