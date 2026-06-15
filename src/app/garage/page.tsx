"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { format, differenceInDays } from "date-fns";
import { CarFront, Plus, Shield, Droplet, CalendarDays, X, ArrowRight } from "lucide-react";
import { DiscoverPage } from "@/components/DiscoverPage";

export default function GaragePage() {
  const { t, language } = useLanguage();

  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);

  // Formularz Auta + Daty Początkowe
  const [carForm, setCarForm] = useState({ 
    make: "", model: "", plate: "", year: "", 
    ocDate: "", inspectionDate: "", oilDate: "" 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cars`);
      if (res.ok) setCars(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCar = async () => {
    try {
      const res = await fetch("/api/cars", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(carForm)
      });
      if (res.ok) { setIsCarModalOpen(false); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const openAddModal = () => {
    setCarForm({ make: "", model: "", plate: "", year: "", ocDate: "", inspectionDate: "", oilDate: "" });
    setIsCarModalOpen(true);
  };

  // --- WYZNACZANIE TERMINÓW ---
  const getDeadlineInfo = (events: any[], type: string) => {
    const latestEvent = events.filter(e => e.type === type && e.nextDueDate).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (!latestEvent) return null;
    
    const daysLeft = differenceInDays(new Date(latestEvent.nextDueDate), new Date());
    let color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (daysLeft < 0) color = "text-red-500 bg-red-500/10 border-red-500/20";
    else if (daysLeft <= 30) color = "text-amber-500 bg-amber-500/10 border-amber-500/20";

    return { daysLeft, date: latestEvent.nextDueDate, color };
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <DiscoverPage page="garage" />
      {/* NAGŁÓWEK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-white shadow-inner">
            <CarFront className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("garage_page.title")}</h1>
            <p className="text-sm text-zinc-500">{t("garage_page.subtitle")}</p>
          </div>
        </div>
        <button onClick={openAddModal} className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t("garage_page.btn_add_car")}
        </button>
      </div>

      {/* LISTA POJAZDÓW */}
      {loading ? (
        <p className="text-center text-zinc-500 py-12 animate-pulse">{t("garage_page.loading")}</p>
      ) : cars.length === 0 ? (
        <div className="text-center py-20 bg-white/60 dark:bg-black/40 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
          <CarFront className="w-12 h-12 mx-auto text-zinc-400 mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{t("garage_page.empty_title")}</h3>
          <p className="text-zinc-500">{t("garage_page.empty_subtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cars.map(car => {
            const oc = getDeadlineInfo(car.events, "INSURANCE");
            const inspection = getDeadlineInfo(car.events, "INSPECTION");
            const oil = getDeadlineInfo(car.events, "OIL");

            return (
              <Link href={`/garage/${car.id}`} key={car.id} className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm flex flex-col group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                
                <div className="p-6 border-b border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/20 relative flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm">
                      <CarFront className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-none group-hover:text-indigo-500 transition-colors">{car.make} {car.model}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm font-bold text-zinc-500">
                        {car.plate && <span className="px-2 py-0.5 border-2 border-zinc-300 dark:border-zinc-700 rounded text-zinc-700 dark:text-zinc-300 tracking-wider bg-white dark:bg-black">{car.plate}</span>}
                        {car.year && <span>{car.year}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-black/5 dark:divide-white/5 bg-white dark:bg-zinc-950">
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1"><Shield className="w-3 h-3"/> OC / AC</p>
                    {oc ? (
                      <div className={`inline-flex flex-col px-3 py-1 rounded-xl border ${oc.color}`}>
                        <span className="font-black text-sm">{oc.daysLeft >= 0 ? `${oc.daysLeft} dni` : "Wygasło"}</span>
                      </div>
                    ) : <span className="text-xs font-bold text-zinc-300 dark:text-zinc-700">Brak danych</span>}
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1"><CalendarDays className="w-3 h-3"/> Przegląd</p>
                    {inspection ? (
                      <div className={`inline-flex flex-col px-3 py-1 rounded-xl border ${inspection.color}`}>
                        <span className="font-black text-sm">{inspection.daysLeft >= 0 ? `${inspection.daysLeft} dni` : "Wygasło"}</span>
                      </div>
                    ) : <span className="text-xs font-bold text-zinc-300 dark:text-zinc-700">Brak danych</span>}
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1"><Droplet className="w-3 h-3"/> Olej</p>
                    {oil ? (
                      <div className={`inline-flex flex-col px-3 py-1 rounded-xl border ${oil.color}`}>
                        <span className="font-black text-sm">{oil.daysLeft >= 0 ? `${oil.daysLeft} dni` : "Po terminie"}</span>
                      </div>
                    ) : <span className="text-xs font-bold text-zinc-300 dark:text-zinc-700">Brak danych</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* MODAL: DODAWANIE AUTA Z DATAMI */}
      {isCarModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-lg flex items-center gap-2"><CarFront className="w-5 h-5 text-zinc-500" /> {t("garage_page.btn_add_car")}</h3>
              <button onClick={() => setIsCarModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Sekcja Podstawowa */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">{t("garage_page.label_make")}</label>
                  <input type="text" value={carForm.make} onChange={e => setCarForm({...carForm, make: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-bold" placeholder="np. Toyota" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">{t("garage_page.label_model")}</label>
                  <input type="text" value={carForm.model} onChange={e => setCarForm({...carForm, model: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-bold" placeholder="np. Yaris" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Rejestracja</label>
                  <input type="text" value={carForm.plate} onChange={e => setCarForm({...carForm, plate: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-mono uppercase" placeholder="GD 12345" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Rocznik</label>
                  <input type="number" value={carForm.year} onChange={e => setCarForm({...carForm, year: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500" placeholder="np. 2018" />
                </div>
              </div>

              {/* Sekcja Ważności */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">Ważność dokumentów (Opcjonalne)</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-zinc-500">OC / AC do kiedy?</label>
                      <input type="date" value={carForm.ocDate} onChange={e => setCarForm({...carForm, ocDate: e.target.value})} className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none text-sm font-medium" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-zinc-500">Przegląd techniczny do kiedy?</label>
                      <input type="date" value={carForm.inspectionDate} onChange={e => setCarForm({...carForm, inspectionDate: e.target.value})} className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none text-sm font-medium" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Droplet className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-zinc-500">Wymiana oleju do kiedy?</label>
                      <input type="date" value={carForm.oilDate} onChange={e => setCarForm({...carForm, oilDate: e.target.value})} className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none text-sm font-medium" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => setIsCarModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100">{t("garage_page.btn_cancel")}</button>
              <button onClick={handleAddCar} className="flex-1 py-3 px-4 rounded-xl font-bold bg-zinc-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity">Dodaj pojazd</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}