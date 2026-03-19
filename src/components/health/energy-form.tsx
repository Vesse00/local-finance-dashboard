"use client";

import { useState, useTransition } from "react";
// PRAWIDŁOWY IMPORT Z SERWISU:
import { saveEnergyEntry } from "@/lib/actions";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";

const getEnergyConfig = (val: number) => {
  if(val <= 10) return { emoji: "🛑", color: "bg-red-500", text: "Burnout / Pusty Bak" };
  if(val <= 35) return { emoji: "🪫", color: "bg-orange-500", text: "Low Battery" };
  if(val <= 85) return { emoji: "🔋", color: "bg-emerald-500", text: "Pełny Bak" };
  return { emoji: "⚡", color: "bg-indigo-500", text: "Overcharged" };
}

// Nasz autorski, customowy Slider
// Nasz autorski, customowy Slider (Wersja Minimalistyczna)
const EnergySlider = ({ value, onChange, label, disabled = false }: any) => {
  const { emoji, color, text } = getEnergyConfig(value);
  
  return (
    <div className={`space-y-4 ${disabled ? 'opacity-60 grayscale-[30%]' : ''}`}>
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className={`text-[10px] font-black px-2 py-1 rounded border shadow-sm ${disabled ? 'border-zinc-300 text-zinc-500' : `${color} border-black/10 text-white`}`}>
          {value}% - {text}
        </span>
      </div>
      
      <div className="relative w-full h-10 flex items-center group">
        {/* Niewidzialny natywny suwak odbierający kliknięcia */}
        <input 
          type="range" min="0" max="100" value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
        />
        
        {/* Widoczny pasek postępu */}
        <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative z-0 shadow-inner">
           <div className={`h-full transition-all duration-150 ${color}`} style={{ width: `${value}%`}}></div>
        </div>
        
        {/* Uchwyt z SAMĄ Emotką (bez kółka, samo gęste!) */}
        <div 
          className="absolute z-10 top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150" 
          style={{ left: `${value}%`}}
        >
           <div className={`text-3xl filter drop-shadow-lg group-active:scale-125 transition-transform ${disabled ? '' : 'animate-in zoom-in'}`}>
             {emoji}
           </div>
        </div>
      </div>
    </div>
  )
}

export function EnergyForm() {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [showDetails, setShowDetails] = useState(false);
  const [overall, setOverall] = useState(50);
  const [work, setWork] = useState(50);
  const [freeTime, setFreeTime] = useState(50);

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
      setOverall(50); setWork(50); setFreeTime(50); setShowDetails(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-black/20 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-500" /> Bateria Życiowa
        </h2>
        <input 
          name="date" 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)}
          max={todayStr}
          className="bg-transparent font-bold text-sm text-zinc-500 outline-none cursor-pointer"
        />
      </div>

      <div className="space-y-8">
        <EnergySlider 
          label={showDetails ? "Średnia z całego dnia (Automatyczna)" : "Zasilanie ogólne (Cały dzień)"} 
          value={currentOverall} 
          onChange={setOverall} 
          disabled={showDetails} 
        />

        <button 
          type="button" 
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors mx-auto"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showDetails ? "Ukryj podział dnia" : "Rozbij na Pracę i Czas Wolny"}
        </button>

        {showDetails && (
          <div className="space-y-8 p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-4 fade-in">
            <EnergySlider label="Poziom w Pracy (Wydajność/Stres)" value={work} onChange={setWork} />
            <EnergySlider label="Poziom po Pracy (Regeneracja)" value={freeTime} onChange={setFreeTime} />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Notatka (Opcjonalnie)</label>
          <textarea 
            name="note" 
            placeholder="Dlaczego dzisiaj taki poziom? Wkurzył Cię szef? Świetny trening?"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 outline-none focus:border-indigo-500 text-sm min-h-[100px]"
          />
        </div>

        <button type="submit" disabled={isPending} className="w-full py-4 rounded-xl font-black text-white bg-indigo-500 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
          {isPending ? "Zapisywanie..." : "Zapisz Stan Baterii"}
        </button>
      </div>
    </form>
  );
}