"use client";

import { Zap, ArrowRight, Umbrella, Stethoscope } from "lucide-react";
import { PixelClock } from "@/components/ui/pixel-icons";
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
    <div className="border border-green-900/30 bg-black/40 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden h-full transition-all">
      
      <div className="relative flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PixelClock className="w-8 h-8 text-green-600 shrink-0" />
            <div>
              <p className="text-[10px] font-mono text-green-700 tracking-widest mb-0.5">{`>`} STATUS</p>
              <h2 className="text-xs font-mono font-black text-green-500 uppercase tracking-widest">{t("dashboard.work.title")}</h2>
              <p className="text-sm font-mono uppercase tracking-wider text-zinc-400 mt-0.5">{currentMonthName}</p>
            </div>
          </div>
          <Link href="/work-schedule" className="p-2 border border-green-900/40 hover:border-green-700 hover:text-green-400 text-zinc-600 transition-all">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Hours counter */}
        <div className="flex items-end gap-2 mb-6 flex-1">
          <div className={`text-6xl font-mono font-black tracking-tighter transition-colors ${isGoalReached ? "text-green-400" : "text-green-600"}`}>
            {workedHoursUpToToday % 1 !== 0 ? workedHoursUpToToday.toFixed(1) : workedHoursUpToToday}
          </div>
          <div className="text-lg font-mono text-green-900 mb-1.5">/ {totalMonthlyGoal}h</div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-green-900/20 overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-1000 ease-out ${isGoalReached ? "bg-green-400" : "bg-green-700"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 border-t border-green-900/20 pt-5 mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-green-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Zap className="w-3.5 h-3.5" /> {t("dashboard.work.overtime")}</span>
            <span className="text-lg font-mono font-black text-green-400">{overtimeHours}h</span>
          </div>
          <div className="flex flex-col border-l border-green-900/20 pl-3">
            <span className="text-[10px] font-mono text-green-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Umbrella className="w-3.5 h-3.5" /> {t("dashboard.work.vacation")}</span>
            <span className="text-lg font-mono font-black text-green-400">{vacationDays} <span className="text-xs font-mono text-green-900 lowercase">{t("dashboard.work.days")}</span></span>
          </div>
          <div className="flex flex-col border-l border-green-900/20 pl-3">
            <span className="text-[10px] font-mono text-green-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Stethoscope className="w-3.5 h-3.5" /> {t("dashboard.work.sick_leave")}</span>
            <span className="text-lg font-mono font-black text-green-400">{sickDays} <span className="text-xs font-mono text-green-900 lowercase">{t("dashboard.work.days")}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}