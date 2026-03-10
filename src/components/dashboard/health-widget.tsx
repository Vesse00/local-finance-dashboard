"use client";

import { Activity, Dumbbell, Flame, Droplet, Scale, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface HealthWidgetProps {
  healthDays: any[];
  healthEntries: any[];
}

export function HealthWidget({ healthDays, healthEntries }: HealthWidgetProps) {
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
  const currentMonthName = format(new Date(), "LLLL", { locale: pl });

  return (
    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group h-full">
      
      {/* Dekoracyjne tło */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full">
        
        {/* Nagłówek */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Zdrowie</h2>
              <p className="text-xs text-zinc-500 capitalize">{currentMonthName}</p>
            </div>
          </div>
          <Link href="/health/daily" className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-zinc-600 dark:text-zinc-300">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Siatka statystyk (2x2) */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wider">
              <Dumbbell className="w-3.5 h-3.5" /> Treningi
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white">{workouts}</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 mb-1 uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" /> Waga
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-black text-zinc-900 dark:text-white">{latestWeight > 0 ? latestWeight : "--"}</div>
              {latestWeight > 0 && <span className="text-xs font-bold text-zinc-500">kg</span>}
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-500 mb-1 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" /> Śr. Kalorii
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-black text-zinc-900 dark:text-white">{avgCalories}</div>
              <span className="text-[10px] font-bold text-zinc-500">kcal</span>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 mb-1 uppercase tracking-wider">
              <Droplet className="w-3.5 h-3.5" /> Śr. Wody
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-black text-zinc-900 dark:text-white">{avgWater}</div>
              <span className="text-[10px] font-bold text-zinc-500">szkl.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}