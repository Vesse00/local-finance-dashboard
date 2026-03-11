"use client";

import { useState, useEffect, use } from "react";
import { format, differenceInDays, addYears } from "date-fns";
import { pl } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { CarFront, Plus, Wrench, Shield, Droplet, CalendarDays, Wallet, Trash2, X, ArrowLeft, Fuel, GaugeCircle, LineChart, PiggyBank } from "lucide-react";
import Link from "next/link";

const Odometer = ({ mileage }: { mileage: number }) => {
  const digits = String(mileage).padStart(6, '0').split('');
  return (
    <div className="flex flex-col items-end sm:items-start xl:items-end">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 pr-1">Aktualny przebieg</span>
      <div className="flex items-center bg-zinc-950 dark:bg-black p-1.5 rounded-xl shadow-inner border border-zinc-800">
        <div className="flex gap-[2px]">
          {digits.map((digit, idx) => (
            <div key={idx} className="relative w-7 h-10 sm:w-8 sm:h-12 bg-gradient-to-b from-zinc-800 via-zinc-600 to-zinc-900 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-900 rounded-[3px] flex items-center justify-center overflow-hidden border-y border-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-0 top-1/2 h-[1px] bg-black/60 w-full z-10 shadow-[0_1px_1px_rgba(255,255,255,0.15)]"></div>
              <span className="text-white font-mono text-xl sm:text-2xl font-black z-0 relative top-[1px]" style={{ textShadow: "0 2px 2px rgba(0,0,0,1)" }}>{digit}</span>
            </div>
          ))}
        </div>
        <span className="text-xs font-black text-zinc-500 ml-3 mr-1 uppercase tracking-widest">km</span>
      </div>
    </div>
  );
};

export default function CarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Dodatkowy stan dla interwału oleju (domyślnie co 10 000 km)
  const [oilInterval, setOilInterval] = useState("10000");

  const [mainCategory, setMainCategory] = useState<"SERVICE" | "REFUELING">("SERVICE");
  const [eventForm, setEventForm] = useState({
    type: "REPAIR", 
    date: format(new Date(), "yyyy-MM-dd"),
    nextDueDate: "",
    nextDueMileage: "",
    cost: "", description: "", createExpense: true, mileage: "", liters: "", pricePerLiter: ""
  });

  const fetchCar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cars/${resolvedParams.id}`);
      if (res.ok) setCar(await res.json()); else router.push("/garage");
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchCar(); }, []);

  const handleDeleteCar = async () => {
    if (!confirm("Na pewno usunąć auto i CAŁĄ jego historię?")) return;
    try {
      const res = await fetch("/api/cars", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: car.id }) });
      if (res.ok) router.push("/garage");
    } catch (err) { console.error(err); }
  };

  const handleAddEvent = async () => {
    try {
      const payload = { ...eventForm, carId: car.id };
      if (mainCategory === "REFUELING") payload.type = "REFUELING";
      const res = await fetch("/api/cars/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setIsEventModalOpen(false); fetchCar(); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Usunąć ten wpis?")) return;
    try {
      await fetch("/api/cars/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      fetchCar();
    } catch (err) { console.error(err); }
  };

  const openEventModal = () => {
    setMainCategory("SERVICE");
    setEventForm({ type: "REPAIR", date: format(new Date(), "yyyy-MM-dd"), nextDueDate: "", nextDueMileage: "", cost: "", description: "", createExpense: true, mileage: "", liters: "", pricePerLiter: "" });
    setOilInterval("10000");
    setIsEventModalOpen(true);
  };

  // --- AUTOMATYKA MODALA ---
  const handleTypeChange = (newType: string) => {
    let nextDue = eventForm.nextDueDate;
    let nextKm = eventForm.nextDueMileage;
    let currentKm = eventForm.mileage;
    
    // Obliczanie daty (+1 rok) dla ubezpieczenia i przeglądu (wywalamy z Oleju)
    if ((newType === "INSURANCE" || newType === "INSPECTION") && eventForm.date) {
      nextDue = format(addYears(new Date(eventForm.date), 1), "yyyy-MM-dd");
    } else {
      nextDue = ""; 
    }
    
    // Przebieg na bazie interwału
    if (newType === "OIL" && eventForm.mileage) {
      nextKm = (parseInt(eventForm.mileage) + parseInt(oilInterval || "0")).toString();
    } else if (newType !== "OIL") {
      nextKm = "";
    }

    if (newType === "INSURANCE") currentKm = ""; 

    setEventForm({ ...eventForm, type: newType, nextDueDate: nextDue, nextDueMileage: nextKm, mileage: currentKm });
  };

  const handleDateChange = (newDate: string) => {
    let nextDue = eventForm.nextDueDate;
    if (eventForm.type === "INSURANCE" || eventForm.type === "INSPECTION") {
      if (newDate) nextDue = format(addYears(new Date(newDate), 1), "yyyy-MM-dd");
    }
    setEventForm({ ...eventForm, date: newDate, nextDueDate: nextDue });
  };

  const handleMileageChange = (newMileage: string) => {
    let nextKm = eventForm.nextDueMileage;
    if (eventForm.type === "OIL" && newMileage) {
      nextKm = (parseInt(newMileage) + parseInt(oilInterval || "0")).toString();
    }
    setEventForm({ ...eventForm, mileage: newMileage, nextDueMileage: nextKm });
  };

  const handleOilIntervalChange = (newInterval: string) => {
    setOilInterval(newInterval);
    if (eventForm.type === "OIL" && eventForm.mileage) {
      const nextKm = (parseInt(eventForm.mileage) + parseInt(newInterval || "0")).toString();
      setEventForm({ ...eventForm, nextDueMileage: nextKm });
    }
  };

  const handleFuelCalc = (field: string, val: string) => {
    let l = field === 'liters' ? parseFloat(val) : parseFloat(eventForm.liters);
    let p = field === 'pricePerLiter' ? parseFloat(val) : parseFloat(eventForm.pricePerLiter);
    let c = field === 'cost' ? parseFloat(val) : parseFloat(eventForm.cost);
    let newForm = { ...eventForm, [field]: val };

    if (field === 'liters' || field === 'pricePerLiter') {
      if (!isNaN(l) && !isNaN(p)) newForm.cost = (l * p).toFixed(2);
    } else if (field === 'cost') {
      if (!isNaN(c) && !isNaN(l) && l > 0) newForm.pricePerLiter = (c / l).toFixed(2);
      else if (!isNaN(c) && !isNaN(p) && p > 0 && isNaN(l)) newForm.liters = (c / p).toFixed(2);
    }
    setEventForm(newForm);
  };

  if (loading || !car) return <div className="p-12 text-center text-zinc-500 animate-pulse">Wczytywanie pojazdu...</div>;

  const latestMileage = car.events.reduce((max: number, ev: any) => (ev.mileage && ev.mileage > max ? ev.mileage : max), 0);

  const getDeadlineInfo = (events: any[], type: string) => {
    const latestEvent = events.filter(e => e.type === type && (e.nextDueDate || e.nextDueMileage)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (!latestEvent) return null;
    
    let daysLeft = latestEvent.nextDueDate ? differenceInDays(new Date(latestEvent.nextDueDate), new Date()) : null;
    let kmLeft = latestEvent.nextDueMileage ? latestEvent.nextDueMileage - latestMileage : null;

    let color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if ((daysLeft !== null && daysLeft < 0) || (kmLeft !== null && kmLeft < 0)) color = "text-red-500 bg-red-500/10 border-red-500/20";
    else if ((daysLeft !== null && daysLeft <= 30) || (kmLeft !== null && kmLeft <= 1000)) color = "text-amber-500 bg-amber-500/10 border-amber-500/20";

    return { daysLeft, kmLeft, date: latestEvent.nextDueDate, targetKm: latestEvent.nextDueMileage, color };
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "INSURANCE": return <Shield className="w-5 h-5 text-blue-500" />;
      case "INSPECTION": return <CalendarDays className="w-5 h-5 text-emerald-500" />;
      case "OIL": return <Droplet className="w-5 h-5 text-amber-500" />;
      case "REFUELING": return <Fuel className="w-5 h-5 text-indigo-500" />;
      default: return <Wrench className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getTypeName = (type: string) => {
    switch(type) {
      case "INSURANCE": return "Ubezpieczenie (OC/AC)";
      case "INSPECTION": return "Przegląd techniczny";
      case "OIL": return "Wymiana oleju";
      case "REFUELING": return "Tankowanie";
      default: return "Serwis / Naprawa";
    }
  };

  const oc = getDeadlineInfo(car.events, "INSURANCE");
  const inspection = getDeadlineInfo(car.events, "INSPECTION");
  const oil = getDeadlineInfo(car.events, "OIL");
  const totalSpent = car.events.reduce((acc: number, ev: any) => acc + (ev.cost || 0), 0);
  const refuelingEvents = car.events.filter((e: any) => e.type === "REFUELING" && e.mileage && e.liters).sort((a: any, b: any) => a.mileage - b.mileage);

  let avgFuelConsumption = "--";
  if (refuelingEvents.length >= 2) {
    const totalDistance = refuelingEvents[refuelingEvents.length - 1].mileage - refuelingEvents[0].mileage;
    const totalLiters = refuelingEvents.slice(1).reduce((sum: number, ev: any) => sum + ev.liters, 0);
    if (totalDistance > 0) avgFuelConsumption = ((totalLiters / totalDistance) * 100).toFixed(1);
  }

  let avgMonthlyCost = "--";
  const costEvents = car.events.filter((e: any) => e.cost > 0);
  if (costEvents.length > 0) {
    const dates = costEvents.map((e: any) => new Date(e.date).getTime());
    dates.push(new Date(car.createdAt).getTime()); 
    const diffMonths = Math.max(differenceInDays(new Date(), new Date(Math.min(...dates))) / 30.44, 1); 
    avgMonthlyCost = (totalSpent / diffMonths).toFixed(0);
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <Link href="/garage" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Wróć do Garażu
      </Link>

      <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm relative">
        <button onClick={handleDeleteCar} className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-red-500 bg-black/5 dark:bg-white/5 rounded-xl transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
        
        <div className="p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-white shadow-lg">
              <CarFront className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white leading-tight">{car.make} {car.model}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm font-bold text-zinc-500">
                {car.plate && <span className="px-3 py-1 border-2 border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 tracking-widest bg-white dark:bg-black">{car.plate}</span>}
                {car.year && <span className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-lg">{car.year}</span>}
              </div>
            </div>
          </div>
          <div className="xl:mr-16">
             <Odometer mileage={latestMileage} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5 bg-white dark:bg-zinc-950 border-t border-black/5 dark:border-white/10">
          <div className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield className="w-4 h-4 text-blue-500"/> Ważność OC</p>
            {oc ? (
              <div className={`px-4 py-1.5 rounded-xl border ${oc.color} flex flex-col items-center`}>
                <span className="font-black">{oc.daysLeft !== null && oc.daysLeft >= 0 ? `Zostało ${oc.daysLeft} dni` : "Wygasło!"}</span>
                <span className="text-xs opacity-80">{oc.date && format(new Date(oc.date), "dd MMMM yyyy", { locale: pl })}</span>
              </div>
            ) : <span className="text-sm font-bold text-zinc-300 dark:text-zinc-700">Brak danych</span>}
          </div>
          <div className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-emerald-500"/> Przegląd</p>
            {inspection ? (
              <div className={`px-4 py-1.5 rounded-xl border ${inspection.color} flex flex-col items-center`}>
                <span className="font-black">{inspection.daysLeft !== null && inspection.daysLeft >= 0 ? `Zostało ${inspection.daysLeft} dni` : "Brak badań!"}</span>
                <span className="text-xs opacity-80">{inspection.date && format(new Date(inspection.date), "dd MMMM yyyy", { locale: pl })}</span>
              </div>
            ) : <span className="text-sm font-bold text-zinc-300 dark:text-zinc-700">Brak danych</span>}
          </div>
          <div className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Droplet className="w-4 h-4 text-amber-500"/> Wymiana oleju</p>
            {oil ? (
              <div className={`px-4 py-1.5 rounded-xl border ${oil.color} flex flex-col items-center`}>
                {oil.kmLeft !== null ? (
                  <span className="font-black">{oil.kmLeft >= 0 ? `Zostało ${oil.kmLeft.toLocaleString()} km` : "Przekroczono limit!"}</span>
                ) : oil.daysLeft !== null ? (
                  <span className="font-black">{oil.daysLeft >= 0 ? `Zostało ${oil.daysLeft} dni` : "Zrób to natychmiast"}</span>
                ) : <span className="font-black">Brak limitu</span>}
                <span className="text-xs opacity-80">{oil.targetKm ? `Limit: ${oil.targetKm.toLocaleString()} km` : oil.date ? format(new Date(oil.date), "dd MMMM yyyy", { locale: pl }) : ""}</span>
              </div>
            ) : <span className="text-sm font-bold text-zinc-300 dark:text-zinc-700">Brak danych</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl shadow-sm flex flex-col h-full">
          <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Wrench className="w-5 h-5 text-indigo-500" /> Książka Serwisowa</h3>
            <button onClick={openEventModal} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-colors">
              <Plus className="w-4 h-4" /> Nowy wpis
            </button>
          </div>
          <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
            {car.events.map((ev: any) => (
              <div key={ev.id} className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/30 group">
                <div className="flex items-start md:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    {ev.type === "INSURANCE" ? <Shield className="w-5 h-5 text-blue-500" /> : ev.type === "INSPECTION" ? <CalendarDays className="w-5 h-5 text-emerald-500" /> : ev.type === "OIL" ? <Droplet className="w-5 h-5 text-amber-500" /> : ev.type === "REFUELING" ? <Fuel className="w-5 h-5 text-indigo-500" /> : <Wrench className="w-5 h-5 text-zinc-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-zinc-900 dark:text-white">{ev.type === "INSURANCE" ? "Ubezpieczenie" : ev.type === "INSPECTION" ? "Przegląd" : ev.type === "OIL" ? "Wymiana oleju" : ev.type === "REFUELING" ? "Tankowanie" : "Serwis"}</p>
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded text-[10px] font-bold text-zinc-500">{format(new Date(ev.date), "dd.MM.yyyy")}</span>
                    </div>
                    {ev.type === "REFUELING" ? (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        {ev.mileage && <span className="flex items-center gap-1 text-indigo-500"><GaugeCircle className="w-3.5 h-3.5"/> {ev.mileage} km</span>}
                        {ev.liters && <span>⛽ {ev.liters} L</span>}
                        {ev.pricePerLiter && <span>🏷️ {ev.pricePerLiter} zł/L</span>}
                        {ev.description && <span className="opacity-70">- {ev.description}</span>}
                      </div>
                    ) : (
                      <>
                        {ev.description && <p className="text-sm text-zinc-600 dark:text-zinc-400">{ev.description}</p>}
                        {(ev.nextDueDate || ev.nextDueMileage) && (
                          <div className="flex gap-3 mt-1">
                            {ev.nextDueDate && <p className="text-xs text-indigo-500 font-medium flex items-center gap-1"><CalendarDays className="w-3 h-3" /> do {format(new Date(ev.nextDueDate), "dd.MM.yyyy")}</p>}
                            {ev.nextDueMileage && <p className="text-xs text-amber-500 font-medium flex items-center gap-1"><GaugeCircle className="w-3 h-3" /> do {ev.nextDueMileage} km</p>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-black/5 dark:border-white/5 pt-3 md:pt-0">
                  {ev.cost && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Koszt</p>
                      <p className="font-black text-lg text-zinc-900 dark:text-white">{ev.cost} zł</p>
                    </div>
                  )}
                  <button onClick={() => handleDeleteEvent(ev.id)} className="p-2.5 text-zinc-400 hover:text-red-500 bg-black/5 dark:bg-white/5 rounded-xl opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2"><LineChart className="w-5 h-5 text-indigo-500" /> Raport Kosztów</h3>
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><GaugeCircle className="w-6 h-6" /></div>
                <div><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Średnie spalanie</p>
                  <div className="flex items-baseline gap-1"><p className="text-2xl font-black text-zinc-900 dark:text-white">{avgFuelConsumption}</p>{avgFuelConsumption !== "--" && <span className="text-xs font-bold text-zinc-500">L/100km</span>}</div>
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Wallet className="w-6 h-6" /></div>
                <div><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Średni koszt auta</p>
                  <div className="flex items-baseline gap-1"><p className="text-2xl font-black text-zinc-900 dark:text-white">{avgMonthlyCost}</p>{avgMonthlyCost !== "--" && <span className="text-xs font-bold text-zinc-500">zł / mies.</span>}</div>
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><PiggyBank className="w-6 h-6" /></div>
                <div><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Całkowite wydatki</p>
                  <div className="flex items-baseline gap-1"><p className="text-2xl font-black text-zinc-900 dark:text-white">{totalSpent.toFixed(2)}</p><span className="text-xs font-bold text-zinc-500">zł</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ==============================================
          INTELIGENTNY MODAL
      =============================================== */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 bg-indigo-500/5">
              <h3 className="font-bold text-lg flex items-center gap-2"><Wrench className="w-5 h-5 text-indigo-500" /> Nowy Wpis</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 space-y-5 overflow-y-auto">
              
              <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
                <button onClick={() => setMainCategory("SERVICE")} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${mainCategory === "SERVICE" ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}><Wrench className="w-3.5 h-3.5"/> Serwis i Opłaty</button>
                <button onClick={() => setMainCategory("REFUELING")} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${mainCategory === "REFUELING" ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/20" : "text-zinc-500"}`}><Fuel className="w-3.5 h-3.5"/> Tankowanie</button>
              </div>

              {mainCategory === "SERVICE" && (
                <>
                  <div className="space-y-2 animate-in fade-in">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Podkategoria</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleTypeChange("REPAIR")} className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${eventForm.type === "REPAIR" ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><Wrench className="w-3 h-3"/> Naprawa</button>
                      <button onClick={() => handleTypeChange("INSURANCE")} className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${eventForm.type === "INSURANCE" ? "bg-blue-500 text-white border-blue-500" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><Shield className="w-3 h-3"/> OC/AC</button>
                      <button onClick={() => handleTypeChange("INSPECTION")} className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${eventForm.type === "INSPECTION" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><CalendarDays className="w-3 h-3"/> Przegląd</button>
                      <button onClick={() => handleTypeChange("OIL")} className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${eventForm.type === "OIL" ? "bg-amber-500 text-white border-amber-500" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><Droplet className="w-3 h-3"/> Olej</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 animate-in fade-in bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className={`space-y-1 ${eventForm.type === "REPAIR" ? "col-span-2" : "col-span-1"}`}>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Data wykonania</label>
                      <input type="date" value={eventForm.date} onChange={e => handleDateChange(e.target.value)} className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none text-sm font-medium" />
                    </div>
                    
                    {(eventForm.type === "INSURANCE" || eventForm.type === "INSPECTION") && (
                      <div className="space-y-1 col-span-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1 text-indigo-500"><CalendarDays className="w-3 h-3"/> Kolejny termin</label>
                        <input type="date" value={eventForm.nextDueDate} onChange={e => setEventForm({...eventForm, nextDueDate: e.target.value})} className="w-full p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 outline-none text-sm font-medium text-indigo-700 dark:text-indigo-400" />
                      </div>
                    )}

                    {eventForm.type !== "INSURANCE" && (
                      <>
                        <div className={`space-y-1 ${eventForm.type === "OIL" ? "col-span-1" : "col-span-2"}`}>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><GaugeCircle className="w-3 h-3"/> Obecny przebieg {eventForm.type !== "OIL" && "(Opcjonalnie)"}</label>
                          <input type="number" value={eventForm.mileage} onChange={e => handleMileageChange(e.target.value)} className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none text-sm font-medium" placeholder={`np. ${latestMileage || 150000}`} />
                        </div>
                        
                        {eventForm.type === "OIL" && (
                          <div className="space-y-1 col-span-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1 text-amber-600"><GaugeCircle className="w-3 h-3"/> Za ile km wymiana?</label>
                            <input type="number" value={oilInterval} onChange={e => handleOilIntervalChange(e.target.value)} className="w-full p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 outline-none text-sm font-medium text-amber-700 dark:text-amber-400" placeholder="np. 10000" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {mainCategory === "REFUELING" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Data tankowania</label>
                      <input type="date" value={eventForm.date} onChange={e => handleDateChange(e.target.value)} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none text-sm font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1 text-indigo-500"><GaugeCircle className="w-3 h-3"/> Przebieg</label>
                      <input type="number" value={eventForm.mileage} onChange={e => handleMileageChange(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 outline-none text-sm font-bold text-indigo-700 dark:text-indigo-400" placeholder={`np. ${latestMileage || 150000}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Litry (L)</label>
                      <input type="number" step="0.01" value={eventForm.liters} onChange={e => handleFuelCalc('liters', e.target.value)} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-mono font-bold" placeholder="0.00" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Cena / Litr (zł)</label>
                      <input type="number" step="0.01" value={eventForm.pricePerLiter} onChange={e => handleFuelCalc('pricePerLiter', e.target.value)} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-mono font-bold" placeholder="0.00" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Opis / Stacja (Opcjonalnie)</label>
                <input type="text" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-medium text-sm" placeholder={mainCategory === "REFUELING" ? "np. Orlen, pełny bak" : "np. Wymiana klocków przód"} />
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Koszt całkowity (PLN)</label>
                <input type="number" step="0.01" value={eventForm.cost} onChange={e => handleFuelCalc('cost', e.target.value)} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-mono text-xl font-black" placeholder="0.00" />
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-amber-700 dark:text-amber-500 text-sm flex items-center gap-2"><Wallet className="w-4 h-4"/> Zapisz w wydatkach (Kalendarz)</span>
                  <input type="checkbox" checked={eventForm.createExpense} onChange={(e) => setEventForm({...eventForm, createExpense: e.target.checked})} className="w-5 h-5 rounded border-zinc-300 text-amber-500 focus:ring-amber-500" />
                </label>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => setIsEventModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition-colors">Anuluj</button>
              <button onClick={handleAddEvent} className="flex-1 py-3 px-4 rounded-xl font-bold bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-colors">Zapisz Wpis</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}