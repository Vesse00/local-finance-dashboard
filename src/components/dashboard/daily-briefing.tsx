"use client";

import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, Moon, Sun, X, HeartPulse } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export function DailyBriefing() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/briefing")
      .then(res => res.json())
      .then(fetchedData => {
        setData(fetchedData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  // Aktywacja trybu wieczornego po 20:00
  const isEvening = true;

  const dateString = format(new Date(), "EEEE, d MMMM", { locale: pl });

  if (loading || !data) return <div className="animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-3xl h-40 w-full mb-8"></div>;

  // Logika decydująca co pokazać w asystencie
  const displayItems: any[] = [];

  if (isEvening) {
    // ---- TRYB WIECZORNY ----
    
    // 1. Praca Jutro
    if (data.workTomorrow) {
      if (data.workTomorrow.shiftType === "REGULAR") {
        displayItems.push({ icon: "💼", title: `Jutro w pracy: ${data.workTomorrow.startTime} - ${data.workTomorrow.endTime}`, priority: "normal", type: "PLAN NA JUTRO" });
      } else if (data.workTomorrow.shiftType === "VACATION") {
        displayItems.push({ icon: "🌴", title: "Jutro masz urlop. Odpoczywaj!", priority: "low", type: "PLAN NA JUTRO" });
      } else if (data.workTomorrow.shiftType === "SICK") {
        displayItems.push({ icon: "🩺", title: "Jutro jesteś na L4. Kuruj się!", priority: "low", type: "PLAN NA JUTRO" });
      }
    } else {
      displayItems.push({ icon: "🌙", title: "Jutro brak wpisanej zmiany w grafiku (Wolne?)", priority: "low", type: "PLAN NA JUTRO" });
    }

    // 2. Zdrowie Dzisiaj (Podsumowanie)
    if (data.healthToday.calories > 0 || data.healthToday.workouts.length > 0) {
      const workoutText = data.healthToday.workouts.length > 0 ? `Trening: ${data.healthToday.workouts.join(", ")}` : "Brak treningu";
      displayItems.push({ icon: "💪", title: `Dziś: ${data.healthToday.calories} kcal | ${workoutText}`, priority: "normal", type: "PODSUMOWANIE ZDROWIA" });
    }

    // 3. Nadchodzące rzeczy na jutro/pojutrze
    data.upcomingItems.filter((item: any) => item.daysLeft <= 2).forEach((item: any) => displayItems.push(item));

  } else {
    // ---- TRYB DZIENNY ----
    
    // 1. Praca Dzisiaj
    if (data.workToday) {
      if (data.workToday.shiftType === "REGULAR") {
        displayItems.push({ icon: "💼", title: `Praca dzisiaj: ${data.workToday.startTime} - ${data.workToday.endTime}`, priority: "normal", type: "AKTUALNIE" });
      } else if (data.workToday.shiftType === "VACATION") {
        displayItems.push({ icon: "🌴", title: "Masz dzisiaj urlop. Odpoczywaj!", priority: "low", type: "AKTUALNIE" });
      } else if (data.workToday.shiftType === "SICK") {
        displayItems.push({ icon: "🩺", title: "Jesteś na L4. Wracaj do zdrowia!", priority: "low", type: "AKTUALNIE" });
      }
    }
    
    // 2. Wszystkie nadchodzące rzeczy
    data.upcomingItems.forEach((item: any) => displayItems.push(item));
  }

  // Sortowanie (Najważniejsze na górze)
  displayItems.sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (a.priority !== "high" && b.priority === "high") return 1;
    return 0;
  });

  return (
    <>
      <div className={`rounded-3xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden group mb-8 transition-colors duration-1000 ${
        isEvening 
          ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-black" // Mroczny wieczorny klimat
          : "bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950" // Dzienny klimat
      }`}>
        
        {/* Dynamiczne efekty świetlne */}
        <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full blur-[80px] pointer-events-none ${isEvening ? "bg-indigo-500/20" : "bg-purple-500/30"}`}></div>
        <div className={`absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 rounded-full blur-[80px] pointer-events-none ${isEvening ? "bg-slate-500/20" : "bg-blue-500/30"}`}></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Lewa strona: Powitanie */}
          <div className="space-y-2 lg:w-1/3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              {isEvening ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} 
              Asystent Daily Briefing
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-tight">
              {isEvening ? "Dobry wieczór.\nPrzygotuj się na jutro!" : "Dzień dobry!"}
            </h1>
            <p className="text-indigo-200 capitalize font-medium">{dateString}</p>

            {/* MOOD TRACKER BUTTON (Widoczny tylko wieczorem) */}
            {isEvening && (
              <button 
                onClick={() => setIsMoodModalOpen(true)}
                className="mt-6 flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl transition-all border border-white/10 text-sm font-bold shadow-lg w-full md:w-auto"
              >
                <HeartPulse className="w-5 h-5 text-pink-400" />
                Jak się dzisiaj czujesz?
              </button>
            )}
          </div>

          {/* Prawa strona: Dynamiczna lista zadań */}
          <div className="lg:w-2/3 flex flex-col gap-3">
            {displayItems.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/5">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Wszystko pod kontrolą!</p>
                  <p className="text-xs text-indigo-200">Brak powiadomień. Możesz spokojnie odpoczywać.</p>
                </div>
              </div>
            ) : (
              displayItems.slice(0, 3).map((item, idx) => (
                <div key={idx} className={`bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 flex items-center justify-between border transition-colors hover:bg-white/20 ${item.priority === "high" ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border-white/5"}`}>
                  <div className="flex items-center gap-4 truncate pr-4">
                    <div className="text-2xl flex-shrink-0">{item.icon}</div>
                    <div className="truncate">
                      <p className={`font-bold text-sm truncate ${item.priority === "high" ? "text-red-200" : "text-white"}`}>{item.title}</p>
                      <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">{item.type}</p>
                    </div>
                  </div>
                  {item.priority === "high" && <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                </div>
              ))
            )}
            
            {displayItems.length > 3 && (
              <p className="text-xs text-indigo-300 text-right mt-1 font-medium">
                + {displayItems.length - 3} innych powiadomień w tle
              </p>
            )}
          </div>
        </div>
      </div>

      {/* =========================================
          MODAL MOOD TRACKERA (Wersja v1 - UI)
      ========================================= */}
      {isMoodModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center relative">
              <button onClick={() => setIsMoodModalOpen(false)} className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-16 h-16 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartPulse className="w-8 h-8" />
              </div>
              <h3 className="font-black text-xl text-zinc-900 dark:text-white">Podsumowanie dnia</h3>
              <p className="text-sm text-zinc-500 mt-2">Jak oceniasz swoje samopoczucie po dzisiejszym dniu?</p>
            </div>
            
            <div className="p-6 pt-0 flex justify-between gap-2">
              {[
                { emoji: "😫", label: "Okropnie" },
                { emoji: "😔", label: "Słabo" },
                { emoji: "😐", label: "Neutralnie" },
                { emoji: "🙂", label: "Dobrze" },
                { emoji: "🤩", label: "Super" },
              ].map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.emoji)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                    selectedMood === mood.emoji 
                      ? "bg-pink-500/10 border-2 border-pink-500 scale-110" 
                      : "bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105"
                  }`}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                </button>
              ))}
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900">
              <button 
                onClick={() => {
                  alert(`DODANO DO TODO: Zapisywanie nastroju ${selectedMood} w bazie danych!`);
                  setIsMoodModalOpen(false);
                }}
                disabled={!selectedMood}
                className="w-full py-3 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50"
              >
                Zapisz w dzienniku
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}