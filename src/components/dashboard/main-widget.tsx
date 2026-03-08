import { Wallet, TrendingDown, PiggyBank, AlertCircle, ArrowRightLeft } from "lucide-react";
import { getDashboardStats, transferToSavings } from "@/lib/actions";
import { AddIncomeModal } from "./add-income-modal";

export async function MainWidget() {
  const stats = await getDashboardStats();
  const maPieniadzeDoOszczedzania = stats.kwotaWolna > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-8 shadow-2xl transition-all">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary opacity-20 blur-[80px] dark:opacity-30 pointer-events-none"></div>
      
      <div className="relative flex flex-col md:flex-row justify-between gap-8">
        
        {/* Lewa Strona: Kwota Wolna */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
              <Wallet className="w-5 h-5 text-primary" />
              <h2>Kwota wolna</h2>
            </div>
            <AddIncomeModal />
          </div>

          {stats.wplywy === 0 ? (
            <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 w-fit">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Dodaj wpływy, aby zacząć!</span>
            </div>
          ) : (
            <>
              <div className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                {stats.kwotaWolna.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
              </div>
              
              <div className="flex items-center gap-3 mt-4 text-sm">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium border border-red-500/20">
                  <TrendingDown className="w-4 h-4" />
                  Wydano: {stats.wydano.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                </div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  z puli {stats.wplywy.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Prawa strona: Oszczędności i Magiczny Guzik */}
        <div className="flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10 pt-6 md:pt-0 md:pl-8 min-w-[220px]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-500/20">
              <PiggyBank className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Oszczędności</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {stats.oszczednosci.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
              </p>
            </div>
          </div>
          
          {/* Formularz podłączony do Server Action */}
          <form action={transferToSavings}>
            {/* Przekazujemy całą pozostałą kwotę w ukrytym polu */}
            <input type="hidden" name="amount" value={stats.kwotaWolna} />
            <button 
              type="submit" 
              disabled={!maPieniadzeDoOszczedzania}
              className="w-full group flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-all text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
              Przenieś resztę
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}