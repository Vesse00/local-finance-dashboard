"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface TransferFormProps {
  defaultDate?: Date | null;
  onSuccess: () => void;
  defaultFrom?: string;
  defaultTo?: string;
}

export function TransferForm({ defaultDate, onSuccess, defaultFrom = "MAIN", defaultTo = "SAVINGS" }: TransferFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [mainCurrency, setMainCurrency] = useState("PLN");
  
  const [fromAccount, setFromAccount] = useState(defaultFrom);
  const [toAccount, setToAccount] = useState(defaultTo);

  useEffect(() => {
    fetch("/api/savings")
      .then(res => res.json())
      .then(data => {
        if (data.accounts) setAccounts(data.accounts);
        if (data.currency) setMainCurrency(data.currency);
      })
      .catch(err => console.error(err));
  }, []);

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

        if (!res.ok) throw new Error(t("calendar.modals.transfer_form.error_message"));

        router.refresh(); 
        onSuccess();
      } catch (error: any) {
        alert(t("calendar.modals.transfer_form.error_message"));
      }
    });
  };

  const isSameAccount = fromAccount === toAccount;

  // Waluta konta źródłowego
  const fromCurrency = (fromAccount === "MAIN" || fromAccount === "SAVINGS")
    ? mainCurrency
    : accounts.find(a => a.id === fromAccount)?.currency || mainCurrency;

  return (
    <form className="space-y-6 animate-in fade-in duration-300" onSubmit={handleSubmit}>
      <input type="hidden" name="date" value={defaultDate?.toISOString() || new Date().toISOString()} />
      
      {/* SEKCJA KONT (PIONOWA WIEŻA Z NAKŁADAJĄCĄ SIĘ STRZAŁKĄ) */}
      <div className="relative space-y-3">
        
        {/* Z KONTA */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:border-indigo-500 transition-colors relative z-0">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-zinc-500">{t("calendar.modals.transfer_form.from_account")}</label>
          <select 
            value={fromAccount} 
            onChange={(e) => setFromAccount(e.target.value)} 
            className="w-full bg-transparent outline-none font-bold text-zinc-900 dark:text-white cursor-pointer appearance-none"
          >
            <option value="MAIN" className="text-zinc-900 bg-white dark:text-white dark:bg-zinc-900">{t("calendar.modals.transfer_form.main_wallet")}</option>
            <option value="SAVINGS" className="text-zinc-900 bg-white dark:text-white dark:bg-zinc-900">{t("calendar.modals.transfer_form.main_savings")}</option>
            {accounts.length > 0 && (
              <optgroup label={t("calendar.modals.transfer_form.savings_subaccounts")} className="text-zinc-500 bg-zinc-100 dark:bg-zinc-800 font-semibold">
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="text-zinc-900 bg-white dark:text-white dark:bg-zinc-900 font-bold">
                    {acc.name} ({acc.type}){acc.currency && acc.currency !== mainCurrency ? ` \u00b7 ${acc.currency}` : ""}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        
        {/* ELEGANCKI ODDZIELACZ (KÓŁKO NA ŚRODKU) */}
        <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center z-10 shadow-sm text-zinc-400 pointer-events-none">
           <ArrowDown className="w-4 h-4" />
        </div>

        {/* NA KONTO */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:border-indigo-500 transition-colors relative z-0">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-zinc-500">{t("calendar.modals.transfer_form.to_account")}</label>
          <select 
            value={toAccount} 
            onChange={(e) => setToAccount(e.target.value)} 
            className="w-full bg-transparent outline-none font-bold text-zinc-900 dark:text-white cursor-pointer appearance-none"
          >
            <option value="MAIN" className="text-zinc-900 bg-white dark:text-white dark:bg-zinc-900">{t("calendar.modals.transfer_form.main_wallet")}</option>
            <option value="SAVINGS" className="text-zinc-900 bg-white dark:text-white dark:bg-zinc-900">{t("calendar.modals.transfer_form.main_savings")}</option>
            {accounts.length > 0 && (
              <optgroup label={t("calendar.modals.transfer_form.savings_subaccounts")} className="text-zinc-500 bg-zinc-100 dark:bg-zinc-800 font-semibold">
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="text-zinc-900 bg-white dark:text-white dark:bg-zinc-900 font-bold">
                    {acc.name} ({acc.type}){acc.currency && acc.currency !== mainCurrency ? ` \u00b7 ${acc.currency}` : ""}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* POLE KWOTY */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-500 ml-1">{t("calendar.modals.transfer_form.transfer_amount")}</label>
        <div className="relative">
          <input 
            name="amount" 
            type="number" 
            step="0.01" 
            placeholder={t("calendar.modals.transfer_form.amount_placeholder")} 
            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 pr-12 outline-none focus:border-indigo-500 transition-all text-zinc-900 dark:text-white text-2xl font-black text-center shadow-sm" 
            required 
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">{fromCurrency}</span>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending || isSameAccount} 
        className="w-full rounded-2xl py-4 text-white font-bold shadow-lg transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-500 shadow-indigo-500/20"
      >
        {isPending ? t("calendar.modals.transfer_form.processing") : isSameAccount ? t("calendar.modals.transfer_form.same_account") : t("calendar.modals.transfer_form.submit_transfer")}
      </button>
    </form>
  );
}