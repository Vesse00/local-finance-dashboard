"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, ArrowRight, Info } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

// ─── Typy ────────────────────────────────────────────────────────────────────

type RoleType = "MAIN" | "SAVINGS" | "IGNORE";

interface AccountRole {
  role: RoleType;
  savingsAccountId: string | null;
}

interface SavingsAccount {
  id: string;
  name: string;
  type: string;
}

const ROLE_LABELS: Record<RoleType, string> = {
  MAIN: "🏦 Główne / Karta",
  SAVINGS: "🐷 Oszczędności",
  IGNORE: "⏭️ Ignoruj",
};

const LOCALSTORAGE_KEY = "importAccountRoles";

const loadSavedRoles = (): Record<string, AccountRole> => {
  try { return JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || "{}"); }
  catch { return {}; }
};

const saveRoles = (roles: Record<string, AccountRole>) => {
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(roles));
};

// ─── Komponent ───────────────────────────────────────────────────────────────

export function ImportModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [accountRoles, setAccountRoles] = useState<Record<string, AccountRole>>({});
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/savings")
      .then(r => r.ok ? r.json() : { accounts: [] })
      .then((data) => {
        const accounts = Array.isArray(data) ? data : (data.accounts ?? []);
        setSavingsAccounts(accounts);
      })
      .catch(() => setSavingsAccounts([]));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep(1); setError(null); setSuccess(null);
      setProducts([]); setAccountRoles({});
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  const cleanProductName = (val: unknown): string => {
    if (!val) return "";
    return String(val).split('\n')[0].trim();
  };

  const processFileContent = (data: Record<string, string>[]) => {
    const uniqueProducts = Array.from(
      new Set(data.map(row => cleanProductName(row['Produkt'] || row['Konto'])).filter(Boolean))
    );
    if (uniqueProducts.length === 0) {
      setError("Nie wykryto żadnych kont w pliku."); setIsUploading(false); return;
    }
    const saved = loadSavedRoles();
    const initialRoles: Record<string, AccountRole> = {};
    uniqueProducts.forEach((p, i) => {
      initialRoles[p] = saved[p] ?? { role: i === 0 ? "MAIN" : "IGNORE", savingsAccountId: null };
    });
    setProducts(uniqueProducts);
    setAccountRoles(initialRoles);
    setParsedData(data);
    setStep(2);
    setIsUploading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'txt') {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0 && results.data.length === 0) {
            setError("Plik CSV jest uszkodzony."); setIsUploading(false); return;
          }
          processFileContent(results.data as Record<string, string>[]);
        },
        error: (err) => { setError(err.message); setIsUploading(false); }
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target?.result, { type: 'array' });
          const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: "" }) as Record<string, string>[];
          if (json.length === 0) throw new Error("Arkusz jest pusty.");
          processFileContent(json);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Błąd odczytu"); setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError("Nieobsługiwany format pliku."); setIsUploading(false);
    }
  };

  const setRole = (product: string, role: RoleType) => {
    setAccountRoles(prev => ({
      ...prev,
      [product]: { role, savingsAccountId: role === "SAVINGS" ? (prev[product]?.savingsAccountId ?? null) : null },
    }));
  };

  const setSavingsAccountId = (product: string, id: string | null) => {
    setAccountRoles(prev => ({ ...prev, [product]: { ...prev[product], savingsAccountId: id } }));
  };

  const handleSubmitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Object.values(accountRoles).some(r => r.role === "MAIN")) {
      setError("Musisz oznaczyć co najmniej jedno konto jako Główne."); return;
    }
    setError(null); setIsUploading(true);
    saveRoles(accountRoles);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: parsedData, accountRoles }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd serwera.");
      setSuccess(result.message);
      router.refresh();
      setTimeout(() => { setIsOpen(false); setIsUploading(false); }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd serwera"); setIsUploading(false);
    }
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md" onClick={() => !isUploading && setIsOpen(false)}>
      <div className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
        <button onClick={() => setIsOpen(false)} disabled={isUploading} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500"><FileSpreadsheet className="w-6 h-6" /></div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Importuj wyciąg</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {step === 1 ? "Wybierz plik z historią transakcji" : `Wykryto ${products.length} kont – przypisz role`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          {([1, 2] as const).map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? "bg-indigo-500" : "bg-black/10 dark:bg-white/10"}`} />
          ))}
        </div>

        <div className="overflow-y-auto">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-emerald-600 dark:text-emerald-400 animate-in zoom-in">
            <CheckCircle2 className="w-16 h-16 mb-4" />
            <p className="font-bold text-lg text-center">{success}</p>
          </div>
        ) : step === 1 ? (
          <>
            <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isUploading ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <UploadCloud className={`w-10 h-10 mb-3 ${isUploading ? 'text-indigo-500 animate-bounce' : 'text-zinc-400'}`} />
              <p className="text-sm text-zinc-500">
                {isUploading ? <span className="font-semibold text-indigo-500">Czytanie pliku...</span> : <><span className="font-semibold text-indigo-500">Kliknij</span>, aby wgrać plik</>}
              </p>
              <p className="text-xs text-zinc-400 mt-1">CSV, XLS, XLSX</p>
              <input type="file" accept=".csv,.txt,.xls,.xlsx" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
            {error && <div className="mt-3 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm text-center">{error}</div>}
          </>
        ) : (
          <form onSubmit={handleSubmitStep2} className="space-y-4 animate-in slide-in-from-right-4">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-600 dark:text-indigo-400">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Przelewy własne między Twoimi kontami są pomijane automatycznie. Role są zapamiętywane na kolejny import.</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-0.5">
              {products.map(product => {
                const current = accountRoles[product];
                return (
                  <div key={product} className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 space-y-2">
                    <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate">{product}</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["MAIN", "SAVINGS", "IGNORE"] as RoleType[]).map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setRole(product, role)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all border ${
                            current?.role === role
                              ? role === "MAIN" ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                                : role === "SAVINGS" ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                                : "bg-zinc-500 text-white border-zinc-500"
                              : "bg-white dark:bg-zinc-900 border-black/10 dark:border-white/10 text-zinc-500 hover:border-indigo-400/50"
                          }`}
                        >
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                    {current?.role === "SAVINGS" && (
                      <select
                        value={current.savingsAccountId ?? ""}
                        onChange={e => setSavingsAccountId(product, e.target.value || null)}
                        className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-zinc-700 dark:text-zinc-300"
                      >
                        <option value="">-- Ogólne oszczędności --</option>
                        {savingsAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm text-center">{error}</div>}

            <button type="submit" disabled={isUploading} className="w-full rounded-xl bg-indigo-500 py-3 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {isUploading ? "Przetwarzanie..." : <>Importuj <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 p-2 px-4 text-sm font-semibold rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">
        <UploadCloud className="w-4 h-4" /> Import
      </button>
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
