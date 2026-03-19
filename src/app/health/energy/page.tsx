import { prisma } from "@/lib/db";
import { EnergyForm } from "@/components/health/energy-form";
import { Trash2, BatteryCharging, BrainCircuit } from "lucide-react";
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

  const getEmoji = (val: number) => {
    if(val <= 10) return "🛑";
    if(val <= 35) return "🪫";
    if(val <= 85) return "🔋";
    return "⚡";
  }

  const getColor = (val: number) => {
    if(val <= 10) return "text-red-500 bg-red-500/10";
    if(val <= 35) return "text-orange-500 bg-orange-500/10";
    if(val <= 85) return "text-emerald-500 bg-emerald-500/10";
    return "text-indigo-500 bg-indigo-500/10";
  }

  return (
    <div className="relative flex-1 p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BatteryCharging className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Zarządzanie Energią</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Twój osobisty wskaźnik Burn Rate i regeneracji.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEWA STRONA: FORMULARZ */}
          <EnergyForm />

          {/* PRAWA STRONA: HISTORIA */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" /> Historia Baterii
            </h3>

            {entries.length === 0 ? (
              <div className="p-10 text-center text-sm font-bold text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
                Jeszcze nie śledziłeś swojego poziomu energii.
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => (
                  <div key={entry.id} className="group relative bg-white/60 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm hover:border-indigo-500/30 transition-colors">
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl filter drop-shadow-sm">{getEmoji(entry.overallScore)}</div>
                        <div>
                          <p className="text-xs font-bold text-zinc-500 mb-1">
                            {new Date(entry.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md ${getColor(entry.overallScore)}`}>
                              Ogólnie: {entry.overallScore}%
                            </span>
                            {entry.workScore !== null && entry.freeTimeScore !== null && (
                              <span className="text-[10px] font-bold text-zinc-400">
                                (Praca: {entry.workScore}% | Wolne: {entry.freeTimeScore}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <form action={deleteEnergyEntry}>
                        <input type="hidden" name="id" value={entry.id} />
                        <button type="submit" className="p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>

                    {entry.note && (
                      <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 italic border border-zinc-100 dark:border-zinc-800">
                        "{entry.note}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}