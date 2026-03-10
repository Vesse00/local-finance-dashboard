"use client";

import { Briefcase, Clock, Zap, ArrowRight, Umbrella, Stethoscope } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface WorkWidgetProps {
  workDays: any[];
}

// Funkcja do obliczania godzin
const calculateHours = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; 
  return diff / 60;
};

export function WorkWidget({ workDays }: WorkWidgetProps) {
  let regularHours = 0;
  let overtimeHours = 0;
  let vacationDays = 0;
  let sickDays = 0;

  // Zliczamy dane z przekazanych dni
  workDays.forEach(day => {
    if (day.shiftType === "VACATION") vacationDays++;
    else if (day.shiftType === "SICK") sickDays++;
    else if (day.shiftType === "REGULAR") {
      regularHours += calculateHours(day.startTime, day.endTime);
      if (day.isOvertime) overtimeHours += day.overtimeHours;
    }
  });

  const totalHours = regularHours + overtimeHours;
  
  // Zakładamy standardowy etat w okolicach 160h dla paska postępu
  const targetHours = 160;
  const progressPercent = Math.min((totalHours / targetHours) * 100, 100);

  const currentMonthName = format(new Date(), "LLLL", { locale: pl });

  return (
    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
      
      {/* Dekoracyjne tło */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Czas Pracy</h2>
              <p className="text-xs text-zinc-500 capitalize">{currentMonthName}</p>
            </div>
          </div>
          <Link href="/work-schedule" className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-zinc-600 dark:text-zinc-300">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-end gap-2 mb-6">
          <div className="text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            {totalHours}
          </div>
          <div className="text-lg font-bold text-zinc-500 mb-1">/ {targetHours}h</div>
        </div>

        {/* Pasek postępu */}
        <div className="w-full h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-6">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
          </div>
        </div>

        {/* Małe statystyki na dole */}
        <div className="grid grid-cols-3 gap-2 border-t border-black/5 dark:border-white/10 pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 mb-1"><Zap className="w-3 h-3 text-amber-500" /> Nadgodziny</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">{overtimeHours}h</span>
          </div>
          <div className="flex flex-col border-l border-black/5 dark:border-white/10 pl-3">
            <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 mb-1"><Umbrella className="w-3 h-3 text-purple-500" /> Urlop</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">{vacationDays} dni</span>
          </div>
          <div className="flex flex-col border-l border-black/5 dark:border-white/10 pl-3">
            <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 mb-1"><Stethoscope className="w-3 h-3 text-amber-600" /> L4</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">{sickDays} dni</span>
          </div>
        </div>
      </div>
    </div>
  );
}