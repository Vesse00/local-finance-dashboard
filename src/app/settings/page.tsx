import { Settings as SettingsIcon, Globe, Database, HardDriveDownload, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Tutaj w przyszłości pobierzesz usera z bazy: const user = await prisma.user.findFirst();

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* NAGŁÓWEK */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-zinc-500/10 text-zinc-700 dark:text-zinc-300">
          <SettingsIcon className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Ustawienia</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Zarządzaj swoimi preferencjami i danymi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KARTA 1: PREFERENCJE GŁÓWNE */}
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-black/5 dark:border-white/10 pb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            Preferencje ogólne
          </h2>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-1">Domyślna Waluta</label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Główna waluta wyświetlana w całej aplikacji.</p>
              </div>
              <select disabled className="w-full md:w-48 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none text-zinc-900 dark:text-white font-medium opacity-70 cursor-not-allowed">
                <option value="PLN">Polski Złoty (PLN)</option>
              </select>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-black/5 dark:border-white/5">
              <div>
                <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-1">Format czasu</label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Jak mają wyświetlać się daty transakcji.</p>
              </div>
              <select disabled className="w-full md:w-48 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 outline-none text-zinc-900 dark:text-white font-medium opacity-70 cursor-not-allowed">
                <option value="EU">DD-MM-YYYY</option>
              </select>
            </div>
          </div>
        </div>

        {/* KARTA 2: ZARZĄDZANIE DANYMI */}
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-black/5 dark:border-white/10 pb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            Zarządzanie danymi
          </h2>

          <div className="space-y-4">
            
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">Kopia zapasowa</h3>
                <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70 mt-1">Pobierz wszystkie swoje transakcje jako plik CSV.</p>
              </div>
              <button disabled className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium opacity-50 cursor-not-allowed">
                <HardDriveDownload className="w-4 h-4" /> Eksportuj
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-4">
              <div>
                <h3 className="font-bold text-red-600 dark:text-red-400 text-sm">Zresetuj konto</h3>
                <p className="text-xs text-red-500/70 dark:text-red-400/70 mt-1">Trwale usuwa wszystkie transakcje, zlecenia i podsumowania. <strong>Działanie nieodwracalne.</strong></p>
              </div>
              <button disabled className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium opacity-50 cursor-not-allowed">
                <AlertTriangle className="w-4 h-4" /> Usuń dane
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}