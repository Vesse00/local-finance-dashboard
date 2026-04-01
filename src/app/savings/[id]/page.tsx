"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { 
  ArrowLeft, PiggyBank, Briefcase, Building, ArrowUpRight, ArrowDownRight, 
  X, ArrowRightLeft, Scale, Calculator, AlertCircle, RefreshCw
} from "lucide-react";

export default function SavingsDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal Korekty
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({ newBalance: "", reason: "PROFIT" });
  const [isSaving, setIsSaving] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/savings/${resolvedParams.id}`);
      if (res.ok) setAccount(await res.json());
      else router.push("/savings");
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchDetails(); }, [resolvedParams.id]);

  const handleCorrection = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/savings/${resolvedParams.id}/correction`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(correctionForm)
      });
      if (res.ok) {
        setIsCorrectionModalOpen(false);
        fetchDetails(); 
      }
    } catch (err) { console.error(err); }
    setIsSaving(false);
  };

  const openCorrectionModal = () => {
    // BEZPIECZNA INICJALIZACJA: bierzemy aktualne saldo lub 0 jeśli jeszcze nie ma danych
    setCorrectionForm({ newBalance: (account?.balance || 0).toString(), reason: "PROFIT" });
    setIsCorrectionModalOpen(true);
  };

  const handleBalanceChange = (val: string) => {
    const currentBalance = account?.balance || 0;
    const target = parseFloat(val);
    const diff = isNaN(target) ? 0 : target - currentBalance;
    let autoReason = correctionForm.reason;
    
    if (diff > 0 && (autoReason === "LOSS" || autoReason === "FEE")) autoReason = "PROFIT";
    if (diff < 0 && (autoReason === "PROFIT" || autoReason === "INTEREST")) autoReason = "LOSS";
    
    setCorrectionForm({ newBalance: val, reason: autoReason });
  };

  if (loading || !account) return <div className="p-12 text-center text-zinc-500 animate-pulse">{t("savings_details.loading")}</div>;

  const getAccountIcon = (type: string) => {
    if (type === "IKE") return <Briefcase className="w-10 h-10 text-blue-500" />;
    if (type === "IKZE") return <Building className="w-10 h-10 text-purple-500" />;
    return <PiggyBank className="w-10 h-10 text-emerald-500" />;
  };

  const theme = account.type === "IKE" ? "blue" : account.type === "IKZE" ? "purple" : "emerald";

  // Obliczanie różnicy w locie dla modala (bezpieczne odwołanie do account.balance)
  const currentBalance = account?.balance || 0;
  const currency = account?.currency || "PLN";
  const targetBalanceInput = parseFloat(correctionForm.newBalance);
  const diff = isNaN(targetBalanceInput) ? 0 : targetBalanceInput - currentBalance;
  const isDiffPositive = diff > 0;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      <Link href="/savings" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("savings_details.back_to_center")}
      </Link>

      <div className={`bg-gradient-to-br from-${theme}-500/20 to-${theme}-500/5 border border-${theme}-500/30 backdrop-blur-xl rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6`}>
        <div className="flex items-center gap-6">
          <div className="bg-white/80 dark:bg-black/50 p-4 rounded-2xl shadow-sm">
            {getAccountIcon(account.type)}
          </div>
          <div>
            <span className={`px-3 py-1 bg-white/50 dark:bg-black/30 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 inline-block text-zinc-800 dark:text-zinc-200`}>
              {account.type}
            </span>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">{account.name}</h1>
          </div>
        </div>

        <div className="text-center md:text-right">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t("savings_details.current_balance")}</p>
          <p className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            {currentBalance.toLocaleString(language === "pl" ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <button 
            onClick={openCorrectionModal} 
            className="px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors shadow-lg w-full md:w-auto ml-auto"
          >
            <Scale className="w-4 h-4" /> {t("savings_details.balance_correction_btn")}
          </button>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-zinc-400" /> {t("savings_details.transaction_ledger")}
        </h3>
        
        <div className="space-y-2">
          {(!account.history || account.history.length === 0) ? (
            <div className="text-center py-10 text-zinc-500 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
              {t("savings_details.no_history")}
            </div>
          ) : (
            account.history.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "IN" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                    {tx.type === "IN" ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{tx.description || (tx.type === "IN" ? t("savings_details.default_deposit") : t("savings_details.default_withdrawal"))}</p>
                    <p className="text-xs font-medium text-zinc-500 mt-0.5">{format(new Date(tx.date), "dd MMMM yyyy, HH:mm", { locale: language === "pl" ? pl : enUS })}</p>
                  </div>
                </div>
                {/* Naprawione ucinanie kwoty: flex-shrink-0 */}
                <div className="font-black text-lg whitespace-nowrap pl-4 flex-shrink-0 text-zinc-900 dark:text-white">
                  <span className={tx.type === "IN" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"}>
                    {tx.type === "IN" ? "+" : "-"}{tx.amount.toLocaleString(language === "pl" ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/20">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-500" /> {t("savings_details.correction_modal_title")}
              </h3>
              <button onClick={() => setIsCorrectionModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center justify-center py-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t("savings_details.previous_balance")}</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{currentBalance.toLocaleString(language === "pl" ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 2 })}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><Calculator className="w-3.5 h-3.5 text-indigo-500"/> {t("savings_details.update_amount_label")}</label>
                <div className="relative">
                  <input 
                    type="number" step="0.01" 
                    value={correctionForm.newBalance} 
                    onChange={e => handleBalanceChange(e.target.value)} 
                    className="w-full p-4 pr-16 bg-white dark:bg-zinc-950 border-2 border-indigo-200 dark:border-indigo-900/50 rounded-xl outline-none focus:border-indigo-500 font-mono text-2xl font-black shadow-sm" 
                    placeholder="0.00" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">{currency}</span>
                </div>
              </div>

              {diff !== 0 && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in ${isDiffPositive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"}`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 w-full">
                    <p className="text-sm font-bold leading-snug">
                      {t("savings_details.difference_label")} <span className="font-black text-lg">{isDiffPositive ? "+" : ""}{diff.toLocaleString(language === "pl" ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 2 })}</span>
                    </p>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">{t("savings_details.save_as_label")}</label>
                      <select 
                        value={correctionForm.reason} 
                        onChange={e => setCorrectionForm({...correctionForm, reason: e.target.value})} 
                        className={`w-full p-2.5 rounded-lg outline-none font-bold text-xs appearance-none cursor-pointer ${isDiffPositive ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-200" : "bg-red-500/20 text-red-900 dark:text-red-200"}`}
                      >
                        {isDiffPositive ? (
                          <>
                            <option value="PROFIT">{t("savings_details.profit_investment")}</option>
                            <option value="INTEREST">{t("savings_details.profit_interest")}</option>
                            <option value="MANUAL">{t("savings_details.profit_manual")}</option>
                          </>
                        ) : (
                          <>
                            <option value="LOSS">{t("savings_details.loss_investment")}</option>
                            <option value="FEE">{t("savings_details.loss_fee")}</option>
                            <option value="MANUAL">{t("savings_details.loss_manual")}</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3 border-t border-zinc-100 dark:border-zinc-900">
              <button onClick={() => setIsCorrectionModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">{t("savings_details.cancel_btn")}</button>
              <button 
                onClick={handleCorrection} 
                disabled={isSaving || diff === 0 || isNaN(targetBalanceInput)} 
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg disabled:opacity-50"
              >
                {isSaving ? t("savings_details.saving") : t("savings_details.apply_correction_btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}