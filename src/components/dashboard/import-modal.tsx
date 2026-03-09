"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, ArrowRight } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export function ImportModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  
  const [mainProducts, setMainProducts] = useState<string[]>([]);
  const [savingsProduct, setSavingsProduct] = useState<string>("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep(1);
      setError(null);
      setSuccess(null);
      setProducts([]);
      setMainProducts([]);
      setSavingsProduct("");
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // NOWOŚĆ: Funkcja czyszcząca nazwę produktu z numerów kont i enterów
  const cleanProductName = (val: any) => {
    if (!val) return "";
    return String(val).split('\n')[0].trim();
  };

  const processFileContent = (data: any[]) => {
    const uniqueProducts = Array.from(
      new Set(data.map(row => cleanProductName(row['Produkt'] || row['Konto'])).filter(Boolean))
    ) as string[];

    if (uniqueProducts.length > 0) {
      setProducts(uniqueProducts);
      setMainProducts([uniqueProducts[0]]); 
      setParsedData(data);
      setStep(2);
      setIsUploading(false);
    } else {
      sendToApi(data, [], "");
    }
  };

  const sendToApi = async (data: any[], mainArr: string[], savings: string) => {
    setIsUploading(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: data, mainProducts: mainArr, savingsProduct: savings }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Błąd serwera.");

      setSuccess(result.message);
      router.refresh(); 
      
      setTimeout(() => {
        setIsOpen(false);
        setIsUploading(false);
      }, 2500);

    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv' || fileExtension === 'txt') {
      // NOWOŚĆ: Usunęliśmy delimiter: ";", żeby PapaParse sam rozpoznał przecinki!
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0 && results.data.length === 0) {
            setError("Plik CSV jest uszkodzony.");
            setIsUploading(false);
            return;
          }
          processFileContent(results.data);
        },
        error: (err) => { setError(err.message); setIsUploading(false); }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: 'array' });
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { raw: false, defval: "" });
          if (json.length === 0) throw new Error("Arkusz jest pusty.");
          processFileContent(json);
        } catch (err: any) {
          setError(err.message);
          setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError("Nieobsługiwany format pliku.");
      setIsUploading(false);
    }
  };

  const toggleMainProduct = (product: string) => {
    setMainProducts(prev => 
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  };

  const handleSubmitStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (mainProducts.length === 0) {
      setError("Musisz wybrać co najmniej jedno konto główne!");
      return;
    }
    if (mainProducts.includes(savingsProduct)) {
      setError("Konto oszczędnościowe nie może być jednocześnie zaznaczone jako główne!");
      return;
    }
    setError(null);
    sendToApi(parsedData, mainProducts, savingsProduct);
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => !isUploading && setIsOpen(false)}>
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={() => setIsOpen(false)} disabled={isUploading} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Importuj wyciąg</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {step === 1 ? "Wybierz plik z historią" : "Zidentyfikuj swoje konta"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-emerald-600 dark:text-emerald-400 animate-in zoom-in">
              <CheckCircle2 className="w-16 h-16 mb-4" />
              <p className="font-bold text-lg text-center">{success}</p>
            </div>
          ) : step === 1 ? (
            <>
              <div className="flex justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isUploading ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <UploadCloud className={`w-10 h-10 mb-3 ${isUploading ? 'text-indigo-500 animate-bounce' : 'text-zinc-400'}`} />
                    <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {isUploading ? <span className="font-semibold text-indigo-500">Czytanie pliku...</span> : <><span className="font-semibold text-indigo-500">Kliknij</span>, aby wgrać plik</>}
                    </p>
                  </div>
                  <input type="file" accept=".csv, .txt, .xls, .xlsx" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
              {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm text-center">{error}</div>}
            </>
          ) : (
            <form onSubmit={handleSubmitStep2} className="space-y-5 animate-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-white">
                  Konta Główne (Zaznacz konto bazowe ORAZ karty debetowe)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                  {products.map(p => (
                    <label key={p} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={mainProducts.includes(p)}
                        onChange={() => toggleMainProduct(p)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-zinc-600 dark:bg-zinc-800"
                      />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        {p}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-white">Konto Oszczędnościowe (Opcjonalnie)</label>
                <select value={savingsProduct} onChange={(e) => setSavingsProduct(e.target.value)} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white">
                  <option value="" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">-- Brak / Nie importuj --</option>
                  {products.map(p => <option key={p} value={p} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{p}</option>)}
                </select>
                <p className="text-xs text-zinc-500 mt-1">Przelewy tutaj zasilą wprost Twoją świnkę skarbonkę!</p>
              </div>

              {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm text-center">{error}</div>}

              <button type="submit" disabled={isUploading} className="w-full mt-2 rounded-xl bg-indigo-500 py-3 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {isUploading ? "Przetwarzanie..." : <>Zakończ Import <ArrowRight className="w-4 h-4" /></>}
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