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
  const isEvening = hour >= 20;
  const dateString = format(new Date(), "EEEE, d MMMM", { locale: pl });

  if (loading || !data) return <div className="animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl h-24 w-full mb-6"></div>;

  const displayItems: any[] = [];

  if (isEvening) {
    if (data.workTomorrow) {
      if (data.workTomorrow.shiftType === "REGULAR") displayItems.push({ icon: "💼", title: `Jutro: ${data.workTomorrow.startTime} - ${data.workTomorrow.endTime}`, priority: "normal", type: "Praca" });
      else if (data.workTomorrow.shiftType === "VACATION") displayItems.push({ icon: "🌴", title: "Jutro urlop", priority: "low", type: "Praca" });
      else if (data.workTomorrow.shiftType === "SICK") displayItems.push({ icon: "🩺", title: "Jutro L4", priority: "low", type: "Praca" });
    } else {
      displayItems.push({ icon: "🌙", title: "Jutro wolne (brak zmiany)", priority: "low", type: "Praca" });
    }

    if (data.healthToday.calories > 0 || data.healthToday.workouts.length > 0) {
      const workoutText = data.healthToday.workouts.length > 0 ? `Trening: ${data.healthToday.workouts.join(", ")}` : "Brak treningu";
      displayItems.push({ icon: "💪", title: `Dziś: ${data.healthToday.calories} kcal | ${workoutText}`, priority: "normal", type: "Zdrowie" });
    }

    data.upcomingItems.filter((item: any) => item.daysLeft <= 2).forEach((item: any) => displayItems.push(item));
  } else {
    if (data.workToday) {
      if (data.workToday.shiftType === "REGULAR") displayItems.push({ icon: "💼", title: `Dzisiaj: ${data.workToday.startTime} - ${data.workToday.endTime}`, priority: "normal", type: "Praca" });
      else if (data.workToday.shiftType === "VACATION") displayItems.push({ icon: "🌴", title: "Dzisiaj urlop", priority: "low", type: "Praca" });
      else if (data.workToday.shiftType === "SICK") displayItems.push({ icon: "🩺", title: "Dzisiaj L4", priority: "low", type: "Praca" });
    }
    data.upcomingItems.forEach((item: any) => displayItems.push(item));
  }

  displayItems.sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (a.priority !== "high" && b.priority === "high") return 1;
    return 0;
  });

  return (
    <>
      <div className={`rounded-2xl p-5 shadow-sm text-white relative overflow-hidden group mb-6 transition-colors duration-1000 ${
        isEvening 
          ? "bg-gradient-to-r from-indigo-950 via-slate-900 to-black border border-indigo-900/50" 
          : "bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-800/50"
      }`}>
        
        {/* Delikatne tło */}
        <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full blur-[70px] pointer-events-none ${isEvening ? "bg-indigo-500/10" : "bg-purple-500/20"}`}></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Lewa strona: Kompaktowe powitanie */}
          <div className="space-y-1 lg:w-5/12">
            <div className="flex items-center gap-1.5 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
              {isEvening ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />} 
              Daily Briefing
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              {isEvening ? "Przygotuj się na jutro!" : "Dzień dobry!"}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-indigo-200 text-xs font-medium capitalize">{dateString}</p>
              
              {/* Kompaktowy Mood Tracker */}
              {isEvening && (
                <button 
                  onClick={() => setIsMoodModalOpen(true)}
                  className="flex items-center gap-1.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 px-2.5 py-1 rounded-md transition-all text-[10px] font-bold text-pink-200"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-pink-400" />
                  Jak minął dzień?
                </button>
              )}
            </div>
          </div>

          {/* Prawa strona: Cienkie paski powiadomień */}
          <div className="lg:w-7/12 flex flex-col gap-2">
            {displayItems.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md rounded-xl py-2.5 px-4 flex items-center gap-3 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p className="text-xs font-medium text-indigo-100">Brak powiadomień. Wszystko pod kontrolą!</p>
              </div>
            ) : (
              displayItems.slice(0, 4).map((item, idx) => (
                <div key={idx} className={`bg-white/5 backdrop-blur-md rounded-xl py-2 px-3 flex items-center justify-between border transition-colors hover:bg-white/10 ${item.priority === "high" ? "border-red-500/40 bg-red-500/5" : "border-white/5"}`}>
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div className="text-lg flex-shrink-0">{item.icon}</div>
                    <p className={`font-medium text-xs truncate ${item.priority === "high" ? "text-red-200" : "text-white"}`}>
                      <span className="opacity-50 mr-2 text-[9px] uppercase tracking-wider hidden md:inline-block">{item.type}</span>
                      {item.title}
                    </p>
                  </div>
                  {item.priority === "high" && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                </div>
              ))
            )}
            
            {displayItems.length > 4 && (
              <p className="text-[10px] text-indigo-300 text-right mt-0.5 font-medium">
                + {displayItems.length - 4} w tle
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODAL MOOD TRACKERA */}
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