"use client";

import { Briefcase, Zap, ArrowRight, Umbrella, Stethoscope } from "lucide-react";
import Link from "next/link";
import { format, isBefore, isToday, startOfDay } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageProvider";

interface WorkWidgetProps {
  workDays: any[];
}

const calculateHours = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; 
  return diff / 60;
};

export function WorkWidget({ workDays }: WorkWidgetProps) {
  const { t, language } = useLanguage();
  
  let workedHoursUpToToday = 0; // To co PRZED ukośnikiem (rośnie z każdym dniem)
  let totalMonthlyGoal = 0;     // To co PO ukośniku (stały cel na bazie całego grafiku)

  let overtimeHours = 0;
  let vacationDays = 0;
  let sickDays = 0;

  const now = new Date();
  const startOfToday = startOfDay(now);

  // Zliczamy godziny i nieobecności z danych
  workDays.forEach(day => {
    // Sprawdzamy, czy dany dzień z grafiku już minął lub jest dzisiaj
    const d = day.date ? new Date(day.date) : now; 
    const isPastOrToday = isBefore(d, startOfToday) || isToday(d);

    if (day.shiftType === "REGULAR") {
      const shiftHours = calculateHours(day.startTime, day.endTime);
      
      // CEL MIESIĘCZNY: Dodajemy wszystkie zaplanowane zmiany w miesiącu
      totalMonthlyGoal += shiftHours;

      // PRZEPRACOWANE: Dodajemy tylko te zmiany, które już się odbyły (lub są dzisiaj)
      if (isPastOrToday) {
        workedHoursUpToToday += shiftHours;
        
        // Nadgodziny wliczamy tylko z dni, które już minęły
        if (day.isOvertime) {
          workedHoursUpToToday += day.overtimeHours;
          overtimeHours += day.overtimeHours;
        }
      }
    } 
    else if (day.shiftType === "VACATION") {
      vacationDays++;
      // Urlop traktujemy jako dzień, w którym normalnie byśmy pracowali (dodajemy domyślne 8h do celu)
      totalMonthlyGoal += 8; 
    } 
    else if (day.shiftType === "SICK") {
      sickDays++;
      // L4 traktujemy tak samo jak urlop
      totalMonthlyGoal += 8;
    }
  });

  // Zabezpieczenie paska postępu przed błędem (np. gdy grafik jest całkowicie pusty)
  const safeGoal = totalMonthlyGoal > 0 ? totalMonthlyGoal : 1;
  const progressPercent = Math.min((workedHoursUpToToday / safeGoal) * 100, 100);

  // Sprawdzamy, czy pasek dotarł do 100% (np. nadgodziny wyrównały urlop, albo przepracowano cały miesiąc)
  const isGoalReached = workedHoursUpToToday >= totalMonthlyGoal && totalMonthlyGoal > 0;

  const currentMonthName = format(now, "LLLL", { locale: language === 'pl' ? pl : enUS });

  return (
    <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-indigo-500/5 flex flex-col justify-between relative overflow-hidden group h-full transition-all">
      
      {/* Dynamiczne tło (Zaświeci się na zielono na koniec miesiąca, gdy osiągniemy 100%) */}
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full pointer-events-none opacity-20 transition-all duration-500 dark:opacity-20" 
           style={{ background: isGoalReached ? 'radial-gradient(circle, rgba(16,185,129,0.6) 0%, rgba(16,185,129,0) 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)' }}></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${isGoalReached ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20"}`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[10px] md:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t("dashboard.work.title")}</h2>
              <p className="text-sm uppercase tracking-wider font-black text-zinc-900 dark:text-white mt-0.5">{currentMonthName}</p>
            </div>
          </div>
          <Link href="/work-schedule" className="p-2.5 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all shadow-none hover:shadow-sm text-zinc-600 dark:text-zinc-300">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* GŁÓWNY LICZNIK: np. 8 / 168h */}
        <div className="flex items-end gap-2 mb-6 flex-1">
          <div className={`text-6xl font-black tracking-tighter transition-colors drop-shadow-sm ${isGoalReached ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
            {workedHoursUpToToday % 1 !== 0 ? workedHoursUpToToday.toFixed(1) : workedHoursUpToToday}
          </div>
          <div className="text-lg font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 tracking-wider">/ {totalMonthlyGoal}h</div>
        </div>

        {/* PASEK POSTĘPU (Rośnie każdego dnia po trochu) */}
        <div className="w-full h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-6 shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isGoalReached ? "bg-emerald-500" : "bg-blue-500"}`}
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
          </div>
        </div>

        {/* STATYSTYKI MIESIĘCZNE NA DOLE */}
        <div className="grid grid-cols-3 gap-2 border-t border-black/5 dark:border-white/10 pt-5 mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> {t("dashboard.work.overtime")}</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white drop-shadow-sm">{overtimeHours}h</span>
          </div>
          <div className="flex flex-col border-l border-black/5 dark:border-white/10 pl-3">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Umbrella className="w-3.5 h-3.5 text-purple-500" /> {t("dashboard.work.vacation")}</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white drop-shadow-sm">{vacationDays} <span className="text-xs font-bold text-zinc-400 lowercase">{t("dashboard.work.days")}</span></span>
          </div>
          <div className="flex flex-col border-l border-black/5 dark:border-white/10 pl-3">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Stethoscope className="w-3.5 h-3.5 text-amber-600" /> {t("dashboard.work.sick_leave")}</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white drop-shadow-sm">{sickDays} <span className="text-xs font-bold text-zinc-400 lowercase">{t("dashboard.work.days")}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}