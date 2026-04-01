"use client";

import { deleteEnergyEntry } from "@/lib/actions";
import { Trash2, Wind } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export function EnergyHistory({ entries }: { entries: any[] }) {
  const { t, language } = useLanguage();

  const getZenConfig = (val: number) => {
    if (val <= 15) return { emoji: "🥀", color: "bg-rose-500/10 text-rose-500 border-rose-500/20", dot: "bg-rose-500" };
    if (val <= 40) return { emoji: "🍂", color: "bg-orange-400/10 text-orange-500 border-orange-400/20", dot: "bg-orange-400" };
    if (val <= 65) return { emoji: "🌱", color: "bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/20", dot: "bg-emerald-400" };
    if (val <= 85) return { emoji: "🔋", color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20", dot: "bg-teal-500" };
    return { emoji: "⚡", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", dot: "bg-indigo-500" };
  };

  return (
    <div className="space-y-6 pt-4 lg:pl-6">
      <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-8">
        <Wind className="w-4 h-4" /> {t("health_energy.stream_of_time")}
      </h3>

      {entries.length === 0 ? (
        <div className="p-12 text-center text-sm font-medium text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-[2.5rem] bg-white/30 dark:bg-zinc-950/30 backdrop-blur-md">
          {t("health_energy.empty_history")}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:inset-y-0 before:left-[11px] sm:before:left-[15px] before:w-px before:bg-gradient-to-b before:from-transparent before:via-zinc-300 dark:before:via-zinc-800 before:to-transparent pb-10">
          {entries.map(entry => {
            const zen = getZenConfig(entry.overallScore);
            return (
              <div key={entry.id} className="relative group">
                <div className={`absolute -left-[27px] sm:-left-[29px] top-6 w-[14px] h-[14px] rounded-full border-2 border-white dark:border-zinc-950 ${zen.dot} shadow-sm z-10 transition-transform duration-500 group-hover:scale-150`} />
                
                <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group-hover:-translate-y-1">
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="text-4xl sm:text-5xl filter drop-shadow-sm transition-transform duration-500 group-hover:scale-110">{zen.emoji}</div>
                      <div className="pt-1">
                        <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                          {new Date(entry.date).toLocaleDateString(language === "pl" ? 'pl-PL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-black px-3 py-1 rounded-full ${zen.color} border backdrop-blur-md`}>
                            {t("health_energy.overall")}: {entry.overallScore}%
                          </span>
                          {entry.workScore !== null && entry.freeTimeScore !== null && (
                            <span className="text-[10px] font-bold text-zinc-400 bg-white/40 dark:bg-black/20 px-3 py-1 rounded-full border border-black/5 dark:border-white/5">
                              {t("health_energy.work")}: {entry.workScore}% · {t("health_energy.free_time")}: {entry.freeTimeScore}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <form action={deleteEnergyEntry}>
                      <input type="hidden" name="id" value={entry.id} />
                      <button type="submit" className="p-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all" title={t("health_energy.delete_tooltip")}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  {entry.note && (
                    <div className="mt-5 pl-14 sm:pl-16">
                      <div className="p-4 bg-white/40 dark:bg-black/20 rounded-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 italic border border-white/40 dark:border-white/5 relative before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:bg-zinc-200 dark:before:bg-zinc-800 before:rounded-r-full">
                        "{entry.note}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}