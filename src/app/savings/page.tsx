"use client";

import { useState, useEffect } from "react";
import { PiggyBank, Briefcase, Building, ChevronRight, Plus, Landmark, X, Trash2 } from "lucide-react";
import { TransferUI } from "@/components/savings/transfer-ui";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function SavingsPage() {
  const { t } = useLanguage();
  const [mainSavings, setMainSavings] = useState(0);
  const [subAccounts, setSubAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("PLN");

  // Modal dodawania subkonta
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: "", balance: "", type: "SAVINGS" });
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/savings");
      if (res.ok) {
        const data = await res.json();
        setMainSavings(data.mainSavings || 0); 
        setSubAccounts(data.accounts || []);
        if (data.currency) setCurrency(data.currency);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddAccount = async () => {
    setErrorMessage("");
    try {
      const res = await fetch("/api/savings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccount.name || (newAccount.type === "IKE" ? t("savings_page.default_ike") : newAccount.type === "IKZE" ? t("savings_page.default_ikze") : t("savings_page.default_savings")),
          balance: newAccount.balance || "0",
          type: newAccount.type
        })
      });
      
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewAccount({ name: "", balance: "", type: "SAVINGS" });
        fetchData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || t("savings_page.error_generic"));
      }
    } catch (err) { 
      setErrorMessage(t("savings_page.error_connection"));
    }
  };

  const handleDeleteAccount = async (id: string, name: string, balance: number) => {
    const msg = balance > 0 
      ? t("savings_page.delete_confirm_with_balance", { name, balance: balance.toFixed(2), currency })
      : t("savings_page.delete_confirm", { name });
      
    if (!confirm(msg)) return;
    
    try {
      const res = await fetch("/api/savings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchData(); 
    } catch (err) {
      console.error(err);
    }
  };

  const totalSavings = mainSavings + subAccounts.reduce((acc, curr) => acc + curr.balance, 0);

  const getAccountIcon = (type: string) => {
    if (type === "IKE") return <Briefcase className="w-8 h-8 text-blue-500" />;
    if (type === "IKZE") return <Building className="w-8 h-8 text-purple-500" />;
    return <PiggyBank className="w-8 h-8 text-emerald-500" />;
  };

  const getAccountColor = (type: string) => {
    if (type === "IKE") return "border-blue-500/30 text-blue-500";
    if (type === "IKZE") return "border-purple-500/30 text-purple-500";
    return "border-emerald-500/30 text-emerald-500";
  };

  // Logika blokowania przycisków
  const hasIKE = subAccounts.some(acc => acc.type === "IKE");
  const hasIKZE = subAccounts.some(acc => acc.type === "IKZE");

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* NAGŁÓWEK */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-[80px] pointer-events-none"></div>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Landmark className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("savings_page.title")}</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-2">
            {t("savings_page.subtitle")}
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4 z-10">
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
            {totalSavings.toLocaleString("pl-PL", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setErrorMessage(""); setIsAddModalOpen(true); }} className="px-4 py-3 bg-white/50 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 rounded-xl font-bold text-sm text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2 border border-black/5 dark:border-white/5 shadow-sm">
              <Plus className="w-4 h-4" /> {t("savings_page.new_subaccount")}
            </button>
            <TransferUI onTransferComplete={fetchData} />
          </div>
        </div>
      </div>

      {/* KARUZELA KONT */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          {t("savings_page.your_wallets")} <ChevronRight className="w-5 h-5 text-zinc-400" />
        </h2>
        
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0">
          {loading ? (
            <div className="min-w-[280px] w-full h-40 bg-zinc-100 dark:bg-zinc-900 rounded-3xl animate-pulse"></div>
          ) : (
            <>
              {/* KAFELEK: GŁÓWNE OSZCZĘDNOŚCI */}
            <Link href="/savings/main" className="snap-center block min-w-[280px] w-full bg-white/70 dark:bg-zinc-950/40 border border-blue-500/30 backdrop-blur-xl rounded-3xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300 group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/80 dark:bg-black/50 p-3 rounded-2xl backdrop-blur-md shadow-sm">
                    <PiggyBank className="w-8 h-8 text-blue-500" />
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    {t("savings_page.main_badge")}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1">{t("savings_page.main_savings_title")}</h3>
                  <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{mainSavings.toFixed(2)} <span className="text-lg font-bold opacity-50">{currency}</span></p>
                </div>
              </Link>

              {/* KAFELKI: POZOSTAŁE SUBKONTA */}
              {subAccounts.map(acc => (
                <Link href={`/savings/${acc.id}`} key={acc.id} className={`snap-center block min-w-[280px] w-full bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl border ${getAccountColor(acc.type)} rounded-3xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300 relative group cursor-pointer`}>
                  
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAccount(acc.id, acc.name, acc.balance); }}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
                    title={t("savings_page.delete_tooltip")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/80 dark:bg-black/50 p-3 rounded-2xl backdrop-blur-md shadow-sm">
                        {getAccountIcon(acc.type)}
                      </div>
                      <span className="px-3 py-1 bg-white/50 dark:bg-black/30 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm text-zinc-800 dark:text-white">
                        {acc.type}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1 pr-8 truncate">{acc.name}</h3>
                    <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{acc.balance.toFixed(2)} <span className="text-lg font-bold opacity-50">{currency}</span></p>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>

      {/* MODAL DODAWANIA SUBKONTA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{t("savings_page.modal_title")}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5">
              
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">{t("savings_page.account_type")}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setNewAccount({...newAccount, type: "SAVINGS"})} 
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${newAccount.type === "SAVINGS" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                  >
                    <PiggyBank className="w-6 h-6" /><span className="text-[10px] font-bold">{t("savings_page.type_standard")}</span>
                  </button>
                  
                  {/* IKE (z opcją zablokowania) */}
                  <button 
                    onClick={() => !hasIKE && setNewAccount({...newAccount, type: "IKE"})} 
                    disabled={hasIKE}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${hasIKE ? "opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400 bg-zinc-50 dark:bg-zinc-900" : newAccount.type === "IKE" ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                  >
                    <Briefcase className="w-6 h-6" /><span className="text-[10px] font-bold">{t("savings_page.type_ike")}</span>
                  </button>

                  {/* IKZE (z opcją zablokowania) */}
                  <button 
                    onClick={() => !hasIKZE && setNewAccount({...newAccount, type: "IKZE"})} 
                    disabled={hasIKZE}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${hasIKZE ? "opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400 bg-zinc-50 dark:bg-zinc-900" : newAccount.type === "IKZE" ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                  >
                    <Building className="w-6 h-6" /><span className="text-[10px] font-bold">{t("savings_page.type_ikze")}</span>
                  </button>
                </div>
                {(hasIKE || hasIKZE) && (
                   <p className="text-[10px] text-zinc-400 mt-1">{t("savings_page.ike_ikze_law_notice")}</p>
                )}
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">{t("savings_page.account_name_label")}</label>
                <input type="text" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 font-medium" placeholder={newAccount.type === "IKE" ? t("savings_page.placeholder_ike") : newAccount.type === "IKZE" ? t("savings_page.placeholder_ikze") : t("savings_page.placeholder_standard")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">{t("savings_page.initial_balance")}</label>
                <input type="number" step="0.01" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 font-mono text-xl font-bold" placeholder="0.00" />
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3 border-t border-zinc-100 dark:border-zinc-900">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">{t("savings_page.cancel_btn")}</button>
              <button onClick={handleAddAccount} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20">{t("savings_page.create_btn")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Globalne ukrycie scrollbara */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}