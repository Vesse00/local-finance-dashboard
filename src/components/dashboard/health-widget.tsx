"use client";

import { Dumbbell, Flame, Droplet, Scale, ArrowRight } from "lucide-react";
import { PixelHeart } from "@/components/ui/pixel-icons";
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
    <div className="border border-health-muted/30 bg-black/40 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden h-full transition-all">

      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PixelHeart className="w-8 h-8 text-health shrink-0" />
            <div>
              <p className="text-[10px] font-mono text-health-dim tracking-widest mb-0.5">{`>`} STATUS</p>
              <h2 className="text-xs font-mono font-black text-health uppercase tracking-widest">{t("dashboard.health.title")}</h2>
              <p className="text-sm font-mono uppercase tracking-wider text-zinc-400 mt-0.5">{currentMonthName}</p>
            </div>
          </div>
          <Link href="/health/daily" className="p-2 border border-health-muted/40 hover:border-health-dim hover:text-health text-zinc-600 transition-all">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats grid (2x2) */}
        <div className="grid grid-cols-2 gap-3 flex-1">

          <div className="border border-health-muted/20 bg-health/3 p-4 flex flex-col justify-center hover:bg-health/5 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-health-dim mb-1.5 uppercase tracking-widest">
              <Dumbbell className="w-3.5 h-3.5" /> {t("dashboard.health.workouts")}
            </div>
            <div className="text-2xl font-mono font-black text-health">{workouts}</div>
          </div>

          <div className="border border-health-muted/20 bg-health/3 p-4 flex flex-col justify-center hover:bg-health/5 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-health-dim mb-1.5 uppercase tracking-widest">
              <Scale className="w-3.5 h-3.5" /> {t("dashboard.health.weight")}
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-mono font-black text-health">{latestWeight > 0 ? latestWeight : "--"}</div>
              {latestWeight > 0 && <span className="text-[10px] font-mono text-health-muted">kg</span>}
            </div>
          </div>

          <div className="border border-health-muted/20 bg-health/3 p-4 flex flex-col justify-center hover:bg-health/5 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-health-dim mb-1.5 uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5" /> {t("dashboard.health.avg_calories")}
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-mono font-black text-health">{avgCalories}</div>
              <span className="text-[10px] font-mono text-health-muted uppercase">kcal</span>
            </div>
          </div>

          <div className="border border-health-muted/20 bg-health/3 p-4 flex flex-col justify-center hover:bg-health/5 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-health-dim mb-1.5 uppercase tracking-widest">
              <Droplet className="w-3.5 h-3.5" /> {t("dashboard.health.avg_water")}
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-mono font-black text-health">{avgWater}</div>
              <span className="text-[10px] font-mono text-health-muted uppercase">{t("dashboard.health.glasses")}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}