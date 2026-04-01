"use client";

import { useState, useTransition } from "react";
// PRAWIDŁOWY IMPORT Z SERWISU:
import { saveEnergyEntry } from "@/lib/actions";
import { ChevronDown, ChevronUp, Wind } from "lucide-react";

const getZenConfig = (val: number) => {
  if (val <= 15) return { emoji: "🥀", color: "bg-rose-500", glow: "shadow-rose-500/50", text: "Wyczerpanie", textColor: "text-rose-500" };
  if (val <= 40) return { emoji: "🍂", color: "bg-orange-400", glow: "shadow-orange-400/50", text: "Niski Poziom", textColor: "text-orange-400" };
  if (val <= 65) return { emoji: "🌱", color: "bg-emerald-400", glow: "shadow-emerald-400/50", text: "W Normie", textColor: "text-emerald-500" };
  if (val <= 85) return { emoji: "🔋", color: "bg-teal-500", glow: "shadow-teal-500/50", text: "Pełny Bak", textColor: "text-teal-500" };
  return { emoji: "⚡", color: "bg-indigo-500", glow: "shadow-indigo-500/50", text: "Overcharged", textColor: "text-indigo-500" };
};

const STAGES = [10, 35, 60, 85, 100];

const OrganicSelector = ({ value, onChange, label, disabled = false }: any) => {
  const { emoji, color, text, textColor } = getZenConfig(value);

  return (
    <div className={`flex flex-col items-center gap-6 w-full ${disabled ? 'opacity-40 grayscale-[40%] pointer-events-none' : ''} transition-all duration-500`}>
      <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.2em] uppercase">{label}</h3>
      
      {/* Central Visual Orb */}
      <div className="relative w-40 h-40 flex items-center justify-center group">
        <div className={`absolute inset-0 rounded-[40%] ${color} opacity-20 blur-3xl mix-blend-multiply dark:mix-blend-screen transition-all duration-700 ease-out group-hover:opacity-40 scale-125`} />
        
        <div className="relative w-32 h-32 rounded-[35%] bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.05)] dark:shadow-[0_0_40px_rgba(255,255,255,0.02)] flex items-center justify-center border border-white/40 dark:border-white/10 transition-all duration-500 group-hover:scale-105">
          <span className="text-6xl filter drop-shadow-md transform transition-transform duration-500 group-hover:scale-110">{emoji}</span>
        </div>
      </div>
      
      <div className={`text-xl font-bold ${textColor} transition-colors duration-500 drop-shadow-sm`}>
        {text}
      </div>

      {/* Custom Wide Slider */}
      <div className="relative w-full max-w-sm h-12 rounded-[2rem] bg-black/5 dark:bg-white/5 border border-white/10 dark:border-white/5 shadow-inner flex items-center overflow-hidden">
        
        {/* Niewidzialny input range */}
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />

        {/* Kolorowe tło narastające z lewej strony */}
        <div 
          className={`absolute left-0 h-full ${color} opacity-20 transition-all duration-300`} 
          style={{ width: `${value}%` }} 
        />

        {/* Customowy uchwyt (Thumb) przypominający płynną pigułkę */}
        <div 
          className={`absolute h-10 px-4 rounded-[2rem] flex items-center justify-center text-xs font-black text-white shadow-lg pointer-events-none transition-all duration-100 z-10 ${color}`}
          style={{ 
            left: `calc(${value}% + ${10 - (value * 0.2)}px)`, // Korekta przesunięcia, dostosowana do grubości uchwytu, odsuwająca na lewo im większa wartość
            transform: 'translateX(-50%)',
            minWidth: '56px'
          }}
        >
          {value}%
        </div>
      </div>
    </div>
  );
};

export function EnergyForm() {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [showDetails, setShowDetails] = useState(false);
  const [overall, setOverall] = useState(60);
  const [work, setWork] = useState(60);
  const [freeTime, setFreeTime] = useState(60);

  const currentOverall = showDetails ? Math.round((work + freeTime) / 2) : overall;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("overallScore", currentOverall.toString());
    if (showDetails) {
      formData.append("workScore", work.toString());
      formData.append("freeTimeScore", freeTime.toString());
    }
    
    startTransition(async () => {
      await saveEnergyEntry(formData);
      setOverall(60); setWork(60); setFreeTime(60); setShowDetails(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/40 dark:bg-zinc-950/20 backdrop-blur-3xl border border-white/40 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgba(255,255,255,0.01)] relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -z-10 mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -z-10 mix-blend-multiply dark:mix-blend-screen" />

      <div className="flex items-center justify-between mb-12">
        <h2 className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 flex items-center gap-3">
          <Wind className="w-6 h-6 text-teal-500" /> Stan Umysłu
        </h2>
        <input 
          name="date" 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)}
          max={todayStr}
          className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-2xl font-bold text-xs text-zinc-500 outline-none cursor-pointer border border-white/30 dark:border-white/5 hover:border-teal-500/30 transition-colors"
        />
      </div>

      <div className="space-y-12">
        <OrganicSelector 
          label={showDetails ? "Średnia z całego dnia (Automatyczna)" : "Zasilanie ogólne (Cały dzień)"} 
          value={currentOverall} 
          onChange={setOverall} 
          disabled={showDetails} 
        />

        <button 
          type="button" 
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mx-auto uppercase tracking-wide bg-white/30 dark:bg-zinc-800/30 px-6 py-3 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showDetails ? "Ukryj podział dnia" : "Rozbij na Pracę i Czas Wolny"}
        </button>

        {showDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 sm:p-8 bg-black/[0.02] dark:bg-white/[0.02] rounded-[2rem] border border-black/5 dark:border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
            <OrganicSelector label="W Pracy (Wydajność)" value={work} onChange={setWork} />
            <OrganicSelector label="Po Pracy (Wolne)" value={freeTime} onChange={setFreeTime} />
          </div>
        )}

        <div className="relative group">
          <textarea 
            name="note" 
            placeholder="Co zaprząta Twoje myśli? Np. 'Świetny poranek, ale potem ciężkie spotkanie'..."
            className="w-full rounded-[2rem] border border-white/40 dark:border-white/5 bg-white/40 dark:bg-zinc-900/40 p-6 outline-none focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 text-sm min-h-[120px] backdrop-blur-xl transition-all resize-none shadow-sm dark:text-zinc-300 placeholder:text-zinc-400"
          />
        </div>

        <button type="submit" disabled={isPending} className="relative w-full py-5 rounded-[2rem] font-black text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden group disabled:opacity-50">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="relative flex items-center justify-center gap-2">
            {isPending ? "Balansowanie..." : "Zapisz do Ogrodu"} <Wind className="w-4 h-4" />
          </span>
        </button>
      </div>
    </form>
  );
}