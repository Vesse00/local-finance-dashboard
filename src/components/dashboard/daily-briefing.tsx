"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Moon, Sun, X, HeartPulse, MapPin, ThermometerSun, CloudRain } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import Link from "next/link";

const getWeatherInfo = (code: number) => {
  if (code === 0) return { icon: "☀️", text: "Bezchmurnie" };
  if (code === 1 || code === 2 || code === 3) return { icon: "⛅", text: "Częściowe zachmurzenie" };
  if (code === 45 || code === 48) return { icon: "🌫️", text: "Mgliście" };
  if (code >= 51 && code <= 67) return { icon: "🌧️", text: "Deszczowo" };
  if (code >= 71 && code <= 77) return { icon: "🌨️", text: "Śnieg" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", text: "Przelotne ulewy" };
  if (code >= 95 && code <= 99) return { icon: "⛈️", text: "Burzowo" };
  return { icon: "☁️", text: "Pochmurno" };
};

// ZMIANA: Przyjmujemy dane prosto z serwera przez Props!
export function DailyBriefing({ initialData }: { initialData: any }) {
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  
  // Zabezpieczenie przed Hydration Error (Sprawdzamy czas dopiero po załadowaniu na kliencie)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = initialData || {};
  const hour = new Date().getHours();
  // Zawsze zakładaj, że jest dzień podczas budowania na serwerze, klient zmieni to na wieczór jeśli trzeba (płynnie)
  const isEvening = mounted ? hour >= 20 : false; 
  const dateString = mounted ? format(new Date(), "EEEE, d MMMM", { locale: pl }) : "";

  const displayItems: any[] = [];

  if (isEvening) {
    if (data.workTomorrow) {
      if (data.workTomorrow.shiftType === "REGULAR") displayItems.push({ icon: "💼", title: `Jutro: ${data.workTomorrow.startTime} - ${data.workTomorrow.endTime}`, priority: "normal", type: "Praca" });
      else if (data.workTomorrow.shiftType === "VACATION") displayItems.push({ icon: "🌴", title: "Jutro urlop", priority: "low", type: "Praca" });
      else if (data.workTomorrow.shiftType === "SICK") displayItems.push({ icon: "🩺", title: "Jutro L4", priority: "low", type: "Praca" });
    } else {
      displayItems.push({ icon: "🌙", title: "Jutro wolne (brak zmiany)", priority: "low", type: "Praca" });
    }
    if (data.healthToday?.calories > 0 || (data.healthToday?.workouts && data.healthToday.workouts.length > 0)) {
      const workoutText = data.healthToday.workouts.length > 0 ? `Trening: ${data.healthToday.workouts.join(", ")}` : "Brak treningu";
      displayItems.push({ icon: "💪", title: `Dziś: ${data.healthToday.calories} kcal | ${workoutText}`, priority: "normal", type: "Zdrowie" });
    }
    if (data.upcomingItems) {
      data.upcomingItems.filter((item: any) => item.daysLeft <= 2).forEach((item: any) => displayItems.push(item));
    }
  } else {
    if (data.workToday) {
      if (data.workToday.shiftType === "REGULAR") displayItems.push({ icon: "💼", title: `Dzisiaj: ${data.workToday.startTime} - ${data.workToday.endTime}`, priority: "normal", type: "Praca" });
      else if (data.workToday.shiftType === "VACATION") displayItems.push({ icon: "🌴", title: "Dzisiaj urlop", priority: "low", type: "Praca" });
      else if (data.workToday.shiftType === "SICK") displayItems.push({ icon: "🩺", title: "Dzisiaj L4", priority: "low", type: "Praca" });
    }
    if (data.upcomingItems) {
      data.upcomingItems.forEach((item: any) => displayItems.push(item));
    }
  }

  displayItems.sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (a.priority !== "high" && b.priority === "high") return 1;
    return 0;
  });

  const activeWeather = isEvening && data.weather ? data.weather.tomorrow : data.weather ? data.weather.today : null;
  const weatherDetails = activeWeather ? getWeatherInfo(activeWeather.code) : null;

  return (
    <>
      <div className={`rounded-3xl p-6 shadow-sm text-white relative overflow-hidden group mb-6 transition-colors duration-1000 ${
        isEvening ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-black border border-indigo-900/50" : "bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-800/50"
      }`}>
        <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000 ${isEvening ? "bg-indigo-500/10" : "bg-purple-500/20"}`}></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
          
          <div className="space-y-4 lg:w-5/12 flex flex-col justify-between">
            <div className={`transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
              <div className="flex items-center gap-1.5 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                {isEvening ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />} 
                Daily Briefing
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                {isEvening ? "Przygotuj się na jutro!" : "Dzień dobry!"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 min-h-[30px]">
                <p className="text-indigo-200 text-xs font-medium capitalize">{dateString}</p>
                {isEvening && (
                  <button onClick={() => setIsMoodModalOpen(true)} className="flex items-center gap-1.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 px-2.5 py-1 rounded-md transition-all text-[10px] font-bold text-pink-200 shadow-sm hover:scale-105">
                    <HeartPulse className="w-3.5 h-3.5 text-pink-400" />
                    Jak minął dzień?
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2">
              {!data.userLocation ? (
                <Link href="/settings?tab=utilities" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl transition-all text-xs font-bold text-indigo-200 hover:scale-105 hover:shadow-lg">
                  <MapPin className="w-4 h-4 text-amber-400" /> Skonfiguruj miasto, by widzieć pogodę
                </Link>
              ) : activeWeather && weatherDetails ? (
                <div className="flex flex-col gap-2">
                  <span className={`text-[10px] font-bold text-indigo-300/80 uppercase tracking-widest pl-1 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
                    {isEvening ? "Jutro w:" : "Dziś w:"} <span className="text-indigo-200">{data.weather.city}</span>
                  </span>
                  <div className="flex flex-wrap items-stretch gap-3">
                    <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 transition-colors border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-sm h-full">
                      <ThermometerSun className="w-5 h-5 text-amber-400" />
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center leading-none">
                          <span className="text-sm font-black text-white">{activeWeather.maxTemp}°C</span>
                          <span className="text-[9px] text-indigo-200 font-bold uppercase tracking-wider mt-0.5">Dzień</span>
                        </div>
                        <div className="w-px h-6 bg-white/20"></div>
                        <div className="flex flex-col items-center leading-none">
                          <span className="text-sm font-black text-indigo-300">{activeWeather.minTemp}°C</span>
                          <span className="text-[9px] text-indigo-300/70 font-bold uppercase tracking-wider mt-0.5">Noc</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 transition-colors border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-sm h-full">
                      <span className="text-2xl leading-none drop-shadow-md">{weatherDetails.icon}</span>
                      <span className="text-xs font-bold text-indigo-100">{weatherDetails.text}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-indigo-300 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl w-fit">
                  <CloudRain className="w-4 h-4" /> Brak prognozy dla tej lokalizacji
                </div>
              )}
            </div>
            
          </div>

          <div className="lg:w-7/12 flex flex-col gap-2.5 justify-center">
            {displayItems.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md rounded-2xl py-3 px-4 flex items-center gap-3 border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-white">Wszystko pod kontrolą!</p>
                  <p className="text-xs font-medium text-indigo-200/70">Brak pilnych powiadomień na radarze.</p>
                </div>
              </div>
            ) : (
              displayItems.slice(0, 4).map((item, idx) => (
                <div key={idx} className={`bg-white/5 backdrop-blur-md rounded-xl py-2.5 px-4 flex items-center justify-between border transition-all hover:bg-white/10 hover:scale-[1.01] ${item.priority === "high" ? "border-red-500/40 bg-red-500/5 shadow-md shadow-red-500/10" : "border-white/5"}`}>
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div className="text-xl flex-shrink-0 drop-shadow-sm">{item.icon}</div>
                    <p className={`font-semibold text-sm truncate ${item.priority === "high" ? "text-red-200" : "text-white"}`}>
                      <span className="opacity-60 mr-2 text-[10px] font-bold uppercase tracking-wider hidden md:inline-block">{item.type}</span>
                      {item.title}
                    </p>
                  </div>
                  {item.priority === "high" && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isMoodModalOpen && (
        // ... (Tu zostaje Modal Mood Trackera bez żadnych zmian)
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95"><div className="p-6 text-center relative"><button onClick={() => setIsMoodModalOpen(false)} className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"><X className="w-5 h-5" /></button><div className="w-16 h-16 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"><HeartPulse className="w-8 h-8" /></div><h3 className="font-black text-xl text-zinc-900 dark:text-white">Podsumowanie dnia</h3><p className="text-sm text-zinc-500 mt-2">Jak oceniasz swoje samopoczucie po dzisiejszym dniu?</p></div><div className="p-6 pt-0 flex justify-between gap-2">{[{ emoji: "😫", label: "Okropnie" },{ emoji: "😔", label: "Słabo" },{ emoji: "😐", label: "Neutralnie" },{ emoji: "🙂", label: "Dobrze" },{ emoji: "🤩", label: "Super" }].map((mood) => (<button key={mood.label} onClick={() => setSelectedMood(mood.emoji)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${selectedMood === mood.emoji ? "bg-pink-500/10 border-2 border-pink-500 scale-110" : "bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105"}`}><span className="text-3xl drop-shadow-sm">{mood.emoji}</span></button>))}</div><div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900"><button onClick={() => { alert(`DODANO DO TODO: Zapisywanie nastroju ${selectedMood} w bazie danych!`); setIsMoodModalOpen(false); }} disabled={!selectedMood} className="w-full py-3 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50">Zapisz w dzienniku</button></div></div></div>
      )}
    </>
  );
}