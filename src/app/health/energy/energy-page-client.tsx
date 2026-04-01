"use client";

import { Droplets } from "lucide-react";
import { EnergyForm } from "@/components/health/energy-form";
import { EnergyHistory } from "@/components/health/energy-history";
import { useLanguage } from "@/components/LanguageProvider";

export function EnergyPageClient({ entries }: { entries: any[] }) {
  const { t } = useLanguage();

  return (
    <div className="relative flex-1 p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10 px-2">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Droplets className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{t("health_energy.title")}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">{t("health_energy.subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-start">
          <EnergyForm />
          <EnergyHistory entries={entries} />
        </div>
      </div>
    </div>
  );
}