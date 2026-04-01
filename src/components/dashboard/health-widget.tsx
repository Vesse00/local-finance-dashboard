"use client";

import { Activity, Dumbbell, Flame, Droplet, Scale, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageProvider";

interface HealthWidgetProps {
  healthDays: any[];
  healthEntries: any[];
}

export function HealthWidget({ healthDays, healthEntries }: HealthWidgetProps) {
  const { t, language } = useLanguage();
  
  // Obliczenia statystyk z bieżącego miesiąca
  let workouts = 0;
  let caloriesSum = 0;
  const daysWithCals = new Set();

  healthEntries.forEach(e => {
    if (e.type === "WORKOUT") workouts++;
    if (e.type === "CALORIES") {
      caloriesSum += e.calories;
      daysWithCals.add(new Date(e.date).getDate());
    }
  });
  const avgCalories = daysWithCals.size > 0 ? Math.round(caloriesSum / daysWithCals.size) : 0;

  let waterSum = 0;
  let daysWithWater = 0;
  let latestWeight = 0;

  // Sortujemy dni, by wyciągnąć najnowszą wagę
  const sortedDays = [...healthDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedDays.forEach(d => {
    if (d.waterGlasses > 0) {
      waterSum += d.waterGlasses;
      daysWithWater++;
    }
    if (d.weight) latestWeight = d.weight; // Nadpisuje się, więc zostaje najnowsza
  });

  const avgWater = daysWithWater > 0 ? (waterSum / daysWithWater).toFixed(1) : "0";
  const currentMonthName = format(new Date(), "LLLL", { locale: language === 'pl' ? pl : enUS });

  return (
    <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-emerald-500/5 flex flex-col justify-between relative overflow-hidden group h-full transition-all">
      
      {/* Dekoracyjne tło */}
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full pointer-events-none opacity-20 transition-all duration-500 dark:opacity-20" 
           style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, rgba(16,185,129,0) 70%)' }}></div>

      <div className="relative z-10 flex flex-col h-full">
        
        {/* Nagłówek */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-inner transition-colors group-hover:bg-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[10px] md:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{t("dashboard.health.title")}</h2>
              <p className="text-sm uppercase tracking-wider font-black text-zinc-900 dark:text-white mt-0.5">{currentMonthName}</p>
            </div>
          </div>
          <Link href="/health/daily" className="p-2.5 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all shadow-none hover:shadow-sm text-zinc-600 dark:text-zinc-300">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Siatka statystyk (2x2) */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          
          <div className="bg-emerald-500/5 dark:bg-emerald-900/10 rounded-[2rem] p-4 border border-emerald-500/10 flex flex-col justify-center relative overflow-hidden group/card shadow-inner hover:bg-emerald-500/10 transition-colors">
            <div className="absolute -right-5 -top-5 w-16 h-16 bg-emerald-500/20 blur-xl rounded-full"></div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 uppercase tracking-widest relative z-10">
              <Dumbbell className="w-3.5 h-3.5" /> {t("dashboard.health.workouts")}
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 relative z-10 drop-shadow-sm">{workouts}</div>
          </div>

          <div className="bg-indigo-500/5 dark:bg-indigo-900/10 rounded-[2rem] p-4 border border-indigo-500/10 flex flex-col justify-center relative overflow-hidden group/card shadow-inner hover:bg-indigo-500/10 transition-colors">
            <div className="absolute -right-5 -top-5 w-16 h-16 bg-indigo-500/20 blur-xl rounded-full"></div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 uppercase tracking-widest relative z-10">
              <Scale className="w-3.5 h-3.5" /> {t("dashboard.health.weight")}
            </div>
            <div className="flex items-baseline gap-1 relative z-10 drop-shadow-sm">
              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{latestWeight > 0 ? latestWeight : "--"}</div>
              {latestWeight > 0 && <span className="text-[10px] font-bold text-indigo-700/60 dark:text-indigo-300/60">kg</span>}
            </div>
          </div>

          <div className="bg-orange-500/5 dark:bg-orange-900/10 rounded-[2rem] p-4 border border-orange-500/10 flex flex-col justify-center relative overflow-hidden group/card shadow-inner hover:bg-orange-500/10 transition-colors">
            <div className="absolute -right-5 -top-5 w-16 h-16 bg-orange-500/20 blur-xl rounded-full"></div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-1.5 uppercase tracking-widest relative z-10">
              <Flame className="w-3.5 h-3.5" /> {t("dashboard.health.avg_calories")}
            </div>
            <div className="flex items-baseline gap-1 relative z-10 drop-shadow-sm">
              <div className="text-2xl font-black text-orange-700 dark:text-orange-300">{avgCalories}</div>
              <span className="text-[10px] font-bold text-orange-700/60 dark:text-orange-300/60 uppercase">kcal</span>
            </div>
          </div>

          <div className="bg-blue-500/5 dark:bg-blue-900/10 rounded-[2rem] p-4 border border-blue-500/10 flex flex-col justify-center relative overflow-hidden group/card shadow-inner hover:bg-blue-500/10 transition-colors">
            <div className="absolute -right-5 -top-5 w-16 h-16 bg-blue-500/20 blur-xl rounded-full"></div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1.5 uppercase tracking-widest relative z-10">
              <Droplet className="w-3.5 h-3.5" /> {t("dashboard.health.avg_water")}
            </div>
            <div className="flex items-baseline gap-1 relative z-10 drop-shadow-sm">
              <div className="text-2xl font-black text-blue-700 dark:text-blue-300">{avgWater}</div>
              <span className="text-[10px] font-bold text-blue-700/60 dark:text-blue-300/60 uppercase">{t("dashboard.health.glasses")}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}