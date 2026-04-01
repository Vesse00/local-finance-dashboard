import { prisma } from "@/lib/db";
import { EnergyForm } from "@/components/health/energy-form";
import { Trash2, Wind, Droplets } from "lucide-react";
// PRAWIDŁOWY IMPORT Z SERWISU:
import { deleteEnergyEntry } from "@/lib/actions";

export default async function EnergyPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <div className="p-10 text-center">Brak dostępu</div>;

  const entries = await prisma.energyEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 30
  });

  const getZenConfig = (val: number) => {
    if (val <= 15) return { emoji: "🥀", color: "bg-rose-500/10 text-rose-500 border-rose-500/20", dot: "bg-rose-500" };
    if (val <= 40) return { emoji: "🍂", color: "bg-orange-400/10 text-orange-500 border-orange-400/20", dot: "bg-orange-400" };
    if (val <= 65) return { emoji: "🌱", color: "bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/20", dot: "bg-emerald-400" };
    if (val <= 85) return { emoji: "🔋", color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20", dot: "bg-teal-500" };
    return { emoji: "⚡", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", dot: "bg-indigo-500" };
  };

  return (
    <div className="relative flex-1 p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10 px-2">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Droplets className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Ogród Energii</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">Twój Zen Garden - obserwuj przypływy i odpływy sił witalnych.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-start">
          
          {/* LEWA STRONA: FORMULARZ */}
          <EnergyForm />

          {/* PRAWA STRONA: HISTORIA */}
          <div className="space-y-6 pt-4 lg:pl-6">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-8">
              <Wind className="w-4 h-4" /> Strumień Czasu
            </h3>

            {entries.length === 0 ? (
              <div className="p-12 text-center text-sm font-medium text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-[2.5rem] bg-white/30 dark:bg-zinc-950/30 backdrop-blur-md">
                Jeszcze nie zasiałeś pierwszego nasiona w swoim ogrodzie.
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:inset-y-0 before:left-[11px] sm:before:left-[15px] before:w-px before:bg-gradient-to-b before:from-transparent before:via-zinc-300 dark:before:via-zinc-800 before:to-transparent pb-10">
                {entries.map(entry => {
                  const zen = getZenConfig(entry.overallScore);
                  return (
                    <div key={entry.id} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[27px] sm:-left-[29px] top-6 w-[14px] h-[14px] rounded-full border-2 border-white dark:border-zinc-950 ${zen.dot} shadow-sm z-10 transition-transform duration-500 group-hover:scale-150`} />
                      
                      <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group-hover:-translate-y-1">
                        
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-start gap-4 sm:gap-5">
                            <div className="text-4xl sm:text-5xl filter drop-shadow-sm transition-transform duration-500 group-hover:scale-110">{zen.emoji}</div>
                            <div className="pt-1">
                              <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                                {new Date(entry.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[11px] font-black px-3 py-1 rounded-full ${zen.color} border backdrop-blur-md`}>
                                  Ogólnie: {entry.overallScore}%
                                </span>
                                {entry.workScore !== null && entry.freeTimeScore !== null && (
                                  <span className="text-[10px] font-bold text-zinc-400 bg-white/40 dark:bg-black/20 px-3 py-1 rounded-full border border-black/5 dark:border-white/5">
                                    Praca: {entry.workScore}% · Wolne: {entry.freeTimeScore}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <form action={deleteEnergyEntry}>
                            <input type="hidden" name="id" value={entry.id} />
                            <button type="submit" className="p-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all" title="Usuń wpis z ogrodu">
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
        </div>
      </div>
    </div>
  );
}