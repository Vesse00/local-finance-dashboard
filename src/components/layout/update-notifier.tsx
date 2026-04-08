"use client";

import { useEffect, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UpdateData {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
}

export function UpdateNotifier() {
  const [updateData, setUpdateData] = useState<UpdateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const lastCheckKey = "last_update_check";
        const lastCheckStr = localStorage.getItem(lastCheckKey);
        const now = Date.now();
        
        // Sprawdzanie raz na 2 dni (48 godzin to 48 * 60 * 60 * 1000 milisekund = 172800000ms)
        const CHECK_INTERVAL = 172800000;
        
        if (lastCheckStr && (now - parseInt(lastCheckStr) < CHECK_INTERVAL)) {
          return; // Jeśli minęło mało czasu, nie sprawdzaj API
        }

        const res = await fetch("/api/system/update");
        if (res.ok) {
          const data: UpdateData = await res.json();
          if (data.hasUpdate) {
            setUpdateData(data);
          }
          // Aktualizuj datę ostatniego sprawdzenia w localStorage (tylko na sukces)
          localStorage.setItem(lastCheckKey, now.toString());
        }
      } catch (err) {
        console.error("Błąd podczas sprawdzania aktualizacji", err);
      }
    };

    checkUpdate();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/update", { method: "POST" });
      if (res.ok) {
        toast.success("Rozpoczęto aktualizację! Może potrwać kilka minut. Odśwież stronę po tym czasie.");
        setDismissed(true);
      } else {
        toast.error("Wystąpił problem przy pobieraniu aktualizacji.");
      }
    } catch (err) {
      toast.error("Błąd sieci.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!updateData || !updateData.hasUpdate || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-4 w-80 max-w-[calc(100vw-3rem)]">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Download className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Nowa wersja dostępna!</h3>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Zainstalowana: <span className="font-mono">{updateData.currentVersion}</span> <br/>
          Dostępna: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{updateData.latestVersion}</span>
        </p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Pobierz i zaktualizuj"}
          </button>
          <button
            onClick={handleDismiss}
            disabled={loading}
            className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 text-xs font-medium py-2 rounded-lg transition-colors"
          >
            Później
          </button>
        </div>
      </div>
    </div>
  );
}