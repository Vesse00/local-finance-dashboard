"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, setYear, isSameDay, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Droplet, Save, X, Settings, Plus, Trash2, Activity, CalendarDays, TrendingUp } from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";

export function DailyPageClient({ initialDays, initialEntries }: { initialDays?: any[], initialEntries?: any[] }) {
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"ZEN" | "CALENDAR">("ZEN");
  
  // Dane z API
  const [healthDays, setHealthDays] = useState<any[]>(initialDays || []);       
  const [healthEntries, setHealthEntries] = useState<any[]>(initialEntries || []); 
  const [loading, setLoading] = useState(true);
  
  // Stany Modali
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  // Zmienne do "Dodawania"
  const [addType, setAddType] = useState<"WORKOUT" | "CALORIES">("WORKOUT");
  const [addTitle, setAddTitle] = useState("");
  const [addCalories, setAddCalories] = useState("");
  const [exercises, setExercises] = useState([{ name: "", weight: "", sets: "", reps: "" }]);
  
  // Cel i Woda
  const [targetWater, setTargetWater] = useState(10);
  const [tempGoal, setTempGoal] = useState(10);
  const [currentWater, setCurrentWater] = useState(0);

  useEffect(() => {
    const savedGoal = localStorage.getItem("waterGoal");
    if (savedGoal) {
      setTargetWater(parseInt(savedGoal));
      setTempGoal(parseInt(savedGoal));
    }
  }, []);

  const saveWaterGoal = () => {
    setTargetWater(tempGoal);
    localStorage.setItem("waterGoal", tempGoal.toString());
    setIsGoalModalOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);
    const monthStr = format(currentMonth, "yyyy-MM");
    try {
      const [daysRes, entriesRes] = await Promise.all([
        fetch(`/api/health?month=${monthStr}`),
        fetch(`/api/health-entries?month=${monthStr}`)
      ]);
      
      if (daysRes.ok && entriesRes.ok) {
        const daysData = await daysRes.json();
        setHealthDays(daysData);
        setHealthEntries(await entriesRes.json());
        
        const dayData = daysData.find((hd: any) => isSameDay(new Date(hd.date), selectedDay));
        setCurrentWater(dayData ? dayData.waterGlasses : 0);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [currentMonth]);

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
    const dayData = healthDays.find(hd => isSameDay(new Date(hd.date), date));
    setCurrentWater(dayData ? dayData.waterGlasses : 0);
    setIsDayDetailsOpen(true);
  };

  const openAddModal = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDay(date);
    setAddTitle("");
    setAddCalories("");
    setExercises([{ name: "", weight: "", sets: "", reps: "" }]);
    setIsAddModalOpen(true);
  };

  const handleAddEntry = async () => {
    try {
      const validExercises = exercises.filter(ex => ex.name.trim() !== "");
      const detailsJson = validExercises.length > 0 ? JSON.stringify(validExercises) : null;

      const res = await fetch("/api/health-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDay.toISOString(),
          type: addType,
          title: addTitle || (addType === "WORKOUT" ? t("health_daily.workout") : "Posiłek"),
          calories: addCalories,
          details: addType === "WORKOUT" ? detailsJson : null
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleAddZenEntry = async () => {
    try {
      const validExercises = exercises.filter(ex => ex.name.trim() !== "");
      const detailsJson = validExercises.length > 0 ? JSON.stringify(validExercises) : null;

      const res = await fetch("/api/health-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDay.toISOString(),
          type: addType,
          title: addTitle || (addType === "WORKOUT" ? t("health_daily.workout") : "Posiłek"),
          calories: addCalories,
          details: addType === "WORKOUT" ? detailsJson : null
        })
      });

      if (res.ok) {
        setAddTitle("");
        setAddCalories("");
        setExercises([{ name: "", weight: "", sets: "", reps: "" }]);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const res = await fetch("/api/health-entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const changeWater = async (amount: number) => {
    const newAmount = Math.max(0, currentWater + amount);
    setCurrentWater(newAmount); 
    try {
      await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDay.toISOString(), waterGlasses: newAmount })
      });
      fetchData(); 
    } catch (err) { console.error(err); }
  };

  const updateExercise = (index: number, field: string, value: string) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };
  const addExerciseRow = () => setExercises([...exercises, { name: "", weight: "", sets: "", reps: "" }]);
  const removeExerciseRow = (index: number) => setExercises(exercises.filter((_, i) => i !== index));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) });
  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const waterFillPercentage = Math.min((currentWater / targetWater) * 100, 100);

  const dayEntries = healthEntries.filter(e => isSameDay(new Date(e.date), selectedDay));
  const dayWorkouts = dayEntries.filter(e => e.type === "WORKOUT");
  const dayMeals = dayEntries.filter(e => e.type === "CALORIES");
  const totalDayCalories = dayMeals.reduce((acc, curr) => acc + curr.calories, 0);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* NAGŁÓWEK */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl p-4 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("health_daily.title")}</h1>
            <p className="text-sm text-zinc-500">{t("health_daily.subtitle")}</p>
          </div>
        </div>

        {/* PILL PRZEŁĄCZNIK TRYBÓW */}
        <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-full md:w-auto shadow-inner overflow-x-auto">
          <button 
            onClick={() => setViewMode("ZEN")}
            className={`flex-1 min-w-[130px] md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === "ZEN" ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-md' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <Activity className="w-4 h-4" />
            Zwyczajnie
          </button>
          <button 
            onClick={() => setViewMode("CALENDAR")}
            className={`flex-1 min-w-[130px] md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === "CALENDAR" ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-md' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <CalendarDays className="w-4 h-4" />
            Kalendarz
          </button>
          <Link 
            href="/health/daily/advanced"
            className="flex-1 min-w-[130px] md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 text-zinc-500 hover:text-orange-500 bg-gradient-to-r hover:from-orange-500/10 hover:to-red-500/10"
          >
            <TrendingUp className="w-4 h-4" />
            Tryb PRO
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* LEWA STRONA: Kalendarz LUB Zen (2 Kolumny) */}
        {viewMode === "CALENDAR" ? (
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex items-center gap-2 font-bold text-lg capitalize">
                {format(currentMonth, 'LLLL', { locale: pl })}
                <select value={currentMonth.getFullYear()} onChange={(e) => setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)))} className="bg-transparent outline-none cursor-pointer">
                  {years.map(y => <option key={y} value={y} className="bg-white dark:bg-zinc-900">{y}</option>)}
                </select>
              </div>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
              {weekDays.map(day => <div key={day} className="py-3 text-center text-xs font-bold uppercase text-zinc-500">{day}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-black/5 dark:bg-white/10 relative">
              {loading && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center"><span className="font-medium animate-pulse bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">{t("health_daily.loading")}</span></div>}

              {calendarDays.map((date, i) => {
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const dayData = healthDays.find(wd => isSameDay(new Date(wd.date), date));
                const cDayEntries = healthEntries.filter(e => isSameDay(new Date(e.date), date));
                const cDayWorkouts = cDayEntries.filter(e => e.type === "WORKOUT");
                const cDayCalories = cDayEntries.filter(e => e.type === "CALORIES").reduce((a, b) => a + b.calories, 0);

                return (
                  <div 
                    key={i} 
                    onClick={() => isCurrentMonth && handleDayClick(date)}
                    className={`group relative min-h-[120px] p-2 transition-all cursor-pointer
                      ${!isCurrentMonth ? "bg-zinc-50/50 dark:bg-zinc-900/30 opacity-50" : "bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900"}
                    `}
                  >
                    <span className={`text-sm font-bold ${isToday(date) ? "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {format(date, 'd')}
                    </span>
                    
                    {isCurrentMonth && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {cDayWorkouts.length > 0 && (
                          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate" title={t("health_daily.workout")}>
                            <Dumbbell className="w-3 h-3 inline mr-1" />{cDayWorkouts.length} {t("health_daily.workout")}(i)
                          </div>
                        )}
                        {cDayCalories > 0 && (
                          <div className="text-[10px] font-bold text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded truncate" title={t("health_daily.calories")}>
                            <Flame className="w-3 h-3 inline mr-1" />{cDayCalories} kcal
                          </div>
                        )}
                        {dayData?.waterGlasses > 0 && (
                          <div className="w-full h-1.5 bg-blue-500 rounded-full mt-1" title={`${dayData.waterGlasses} szklanek`}></div>
                        )}
                      </div>
                    )}

                    {isCurrentMonth && (
                      <div 
                        onClick={(e) => openAddModal(date, e)}
                        className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white opacity-0 shadow-lg transition-all transform scale-90 opacity-100 md:opacity-0 md:group-hover:opacity-100 group-hover:scale-100 z-10"
                      >
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        ) : (
        <div className="xl:col-span-2 space-y-8 animate-in fade-in-50 duration-500">
          
          {/* NOWY TRYB ZEN */}
          <div className="relative overflow-hidden bg-white/40 dark:bg-zinc-950/20 backdrop-blur-[40px] rounded-[2rem] border border-white/60 dark:border-white/5 shadow-lg p-6 md:p-8">
            {/* Tło Gradientowe */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/15 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-orange-500/15 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

            <div className="relative z-10 space-y-8">
              
              {/* Datownik */}
              <div className="flex flex-col items-center justify-center space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Wybierz Datę</span>
                <input 
                  type="date"
                  value={format(selectedDay, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const parsed = parseISO(e.target.value);
                    if (!isNaN(parsed.getTime())) setSelectedDay(parsed);
                  }}
                  className="bg-transparent text-2xl md:text-3xl font-black text-center text-zinc-900 dark:text-white outline-none cursor-pointer hover:opacity-80 transition-opacity"
                />
              </div>

              {/* Wybór: {t("health_daily.workout")} vs {t("health_daily.calories")} */}
              <div className="flex bg-white/50 dark:bg-black/20 p-1.5 rounded-3xl shadow-inner max-w-sm mx-auto relative z-20">
                <button 
                  onClick={() => setAddType("WORKOUT")} 
                  className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-2xl font-bold text-base transition-all duration-500 ${addType === "WORKOUT" ? "bg-emerald-500 text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)] scale-[1.02]" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                >
                  <Dumbbell className="w-4 h-4" /> {t("health_daily.workout")}
                </button>
                <button 
                  onClick={() => setAddType("CALORIES")} 
                  className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-2xl font-bold text-base transition-all duration-500 ${addType === "CALORIES" ? "bg-orange-500 text-white shadow-[0_4px_10px_rgba(249,115,22,0.3)] scale-[1.02]" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                >
                  <Flame className="w-4 h-4" /> {t("health_daily.calories")}
                </button>
              </div>

              {/* Formularz Wewnętrzny */}
              <div className="max-w-xl mx-auto space-y-6 rounded-3xl bg-white/30 dark:bg-black/10 p-5 md:p-6 backdrop-blur-md shadow-inner border border-white/20 dark:border-white/5">
                
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest pl-2 flex items-center justify-between">
                    {addType === "WORKOUT" ? `Nazwa ${t("health_daily.workout")}u` : t("health_daily.meal_name")}
                  </label>
                  <input 
                    type="text" 
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    className={`w-full px-5 py-4 rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-sm text-base font-medium outline-none focus:ring-2 transition-all text-zinc-900 dark:text-white ${addType === "WORKOUT" ? "focus:ring-emerald-500" : "focus:ring-orange-500"}`}
                    placeholder={addType === "WORKOUT" ? t("health_daily.workout_placeholder") : t("health_daily.meal_placeholder")} 
                  />
                </div>

                {addType === "WORKOUT" && (
                  <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                    <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest pl-2">{t("health_daily.exercise_list")}</label>
                    <div className="space-y-2">
                      {exercises.map((ex, index) => {
                        const totalVol = (parseInt(ex.sets) || 0) * (parseInt(ex.reps) || 0);
                        let intensityClass = "bg-white/50 dark:bg-zinc-900/50";
                        let FireIcon = null;
                        
                        if (totalVol >= 100) {
                          intensityClass = "bg-orange-500/15 dark:bg-orange-500/15 border-orange-500/40 shadow-orange-500/20";
                          FireIcon = <Flame className="w-5 h-5 text-orange-500 animate-pulse absolute -top-1.5 -right-1.5 drop-shadow-md z-10" />;
                        } else if (totalVol >= 50) {
                          intensityClass = "bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/30";
                          FireIcon = <Flame className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 opacity-80 z-10" />;
                        }

                        return (
                        <div key={index} className={`relative flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-2xl shadow-sm border border-transparent transition-all duration-500 ${intensityClass}`}>
                          {FireIcon}
                          <input type="text" value={ex.name} onChange={(e) => updateExercise(index, "name", e.target.value)} placeholder="Wymachy ramion" className="flex-[2] px-3 py-2.5 text-sm font-medium rounded-xl border-0 bg-transparent outline-none focus:bg-white dark:focus:bg-zinc-800 transition-colors w-full min-w-0" />
                          <input type="number" value={ex.weight} onChange={(e) => updateExercise(index, "weight", e.target.value)} placeholder="Kg" className="w-14 md:w-16 px-1 md:px-2 py-2.5 text-sm font-medium rounded-xl border-0 bg-white/60 dark:bg-zinc-800/60 outline-none text-center" />
                          <input type="number" value={ex.sets} onChange={(e) => updateExercise(index, "sets", e.target.value)} placeholder="Serie" className="w-14 md:w-16 px-1 md:px-2 py-2.5 text-sm font-medium rounded-xl border-0 bg-white/60 dark:bg-zinc-800/60 outline-none text-center" />
                          <input type="number" value={ex.reps} onChange={(e) => updateExercise(index, "reps", e.target.value)} placeholder="Powt." className="w-14 md:w-16 px-1 md:px-2 py-2.5 text-sm font-medium rounded-xl border-0 bg-white/60 dark:bg-zinc-800/60 outline-none text-center" />
                          {exercises.length > 1 && (
                            <button onClick={() => removeExerciseRow(index)} className="p-2.5 text-zinc-400 hover:text-red-500 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors z-10"><X className="w-4 h-4" /></button>
                          )}
                        </div>
                      )})}
                    </div>
                    <button onClick={addExerciseRow} className="w-full py-3 mt-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-2xl border border-dashed border-emerald-500/30 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> {t("health_daily.add_exercise_btn")}
                    </button>
                  </div>
                )}

                {addType === "CALORIES" && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest pl-2">{t("health_daily.calories_amount")}</label>
                    <div className="relative flex justify-center">
                      <input 
                        type="number" 
                        value={addCalories}
                        onChange={(e) => setAddCalories(e.target.value)}
                        className="w-full max-w-sm px-6 py-5 rounded-[1.5rem] border-0 bg-white/80 dark:bg-zinc-900/80 shadow-inner text-3xl font-black text-center text-orange-600 dark:text-orange-400 outline-none focus:ring-4 focus:ring-orange-500/30 transition-all z-10" 
                        placeholder="0" 
                      />
                      <span className="absolute right-1/4 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-lg pointer-events-none z-20">kcal</span>
                    </div>
                  </div>
                )}

                {/* PRZYCISK ZAPISU */}
                <button 
                  onClick={handleAddZenEntry} 
                  className={`w-full py-5 rounded-2xl font-black text-lg text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-2 ${addType === "WORKOUT" ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-emerald-500/30" : "bg-gradient-to-r from-orange-400 to-orange-600 shadow-orange-500/30"}`}
                >
                  <Plus className="w-5 h-5" /> {t("health_daily.save_journal_btn")}
                </button>
                
              </div>
            </div>
          </div>

          {/* LISTA WPISÓW NA DOLE DLA ZEN MODE */}
          <div className="bg-white/40 dark:bg-zinc-950/20 backdrop-blur-3xl rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-sm p-8">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-blue-500" /> {t("health_daily.entries_from")} {format(selectedDay, "dd.MM.yyyy")}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* KOLUMNA TRENINGÓW */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-500" /> {t("health_daily.workout")}i
                </h4>
                {dayWorkouts.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">{t("health_daily.no_workouts")}</p>
                ) : (
                  <div className="space-y-3">
                    {dayWorkouts.map(w => {
                      let parsedDetails = [];
                      if (w.details) { try { parsedDetails = JSON.parse(w.details); } catch { /* ignore */ } }

                      return (
                        <div key={w.id} className="p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/50 shadow-sm border border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{w.title}</span>
                            <button onClick={() => handleDeleteEntry(w.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-2"><Trash2 className="w-5 h-5" /></button>
                          </div>
                          {parsedDetails.length > 0 && (
                            <ul className="space-y-2 mt-2 bg-black/5 dark:bg-white/5 p-3 rounded-2xl">
                              {parsedDetails.map((ex: any, idx: number) => (
                                <li key={idx} className="text-sm flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                                  <span className="font-medium text-zinc-900 dark:text-zinc-300">{ex.name}</span>
                                  <span className="font-mono text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded-lg font-bold shadow-sm">
                                    {ex.weight ? `${ex.weight}kg | ` : ""} {ex.sets}s x {ex.reps}p
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* KOLUMNA POSIŁKÓW */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" /> Posiłki
                  </h4>
                  <span className="bg-orange-500/10 text-orange-600 px-3 py-1 rounded-xl text-xs font-bold">{t("health_daily.total")}: {totalDayCalories} kcal</span>
                </div>
                {dayMeals.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">{t("health_daily.no_meals")}</p>
                ) : (
                  <div className="space-y-3">
                    {dayMeals.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-4 rounded-3xl bg-white/70 dark:bg-zinc-900/50 shadow-sm border border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col">
                          <span className="font-medium text-lg">{m.title}</span>
                          <span className="text-sm text-orange-500 font-bold">{m.calories} kcal</span>
                        </div>
                        <button onClick={() => handleDeleteEntry(m.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-500/10"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
        )}

        {/* PRAWA STRONA: NOWOCZESNY WIDOK WODY (ZEN FLUID CAPSULE) */}
        <div className="xl:col-span-1 relative overflow-hidden bg-white/40 dark:bg-zinc-950/20 backdrop-blur-[40px] rounded-[2rem] border border-white/60 dark:border-white/5 shadow-lg p-6 md:p-8 flex flex-col items-center">
          
          {/* Tło Gradientowe dla wody */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/15 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          
          <div className="w-full flex items-center justify-between mb-8 relative z-10">
             <div className="flex flex-col gap-0.5">
               <h2 className="text-xs font-black flex items-center gap-2 text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">
                 {t("health_daily.hydration")}
               </h2>
               <span className="font-medium text-[10px] text-zinc-400 dark:text-zinc-500 pl-1 uppercase tracking-wider">{format(selectedDay, "dd.MM.yyyy")}</span>
             </div>
             
             <div className="flex items-center gap-2">
               <button onClick={() => setIsGoalModalOpen(true)} className="p-2.5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-[1rem] border border-white/40 dark:border-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                 <Settings className="w-4 h-4" />
               </button>
             </div>
          </div>

          {/* SZKLANA KAPSUŁA (GLASS CAPSULE) */}
          <div className="relative flex flex-col items-center justify-center mb-8 z-10 min-h-[300px] w-full">
            
            {/* Tekst Poziomu - Dynamicznie nad lub w kapsule (ale by ładnie działały kolory) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 drop-shadow-md">
               <span className={`text-6xl font-black transition-colors duration-1000 ${waterFillPercentage > 40 ? 'text-white' : 'text-cyan-500 dark:text-cyan-400'}`}>
                 {currentWater}
               </span>
               <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors duration-1000 ${waterFillPercentage > 30 ? 'text-white/80' : 'text-zinc-400 dark:text-zinc-500'}`}>
                 / {targetWater} {t("health_daily.glasses")}
               </span>
            </div>

            {/* Kapsuła główna */}
            <div className="relative w-32 md:w-36 h-[260px] rounded-[4rem] border border-white/40 dark:border-white/5 bg-white/20 dark:bg-zinc-900/30 backdrop-blur-md shadow-[inset_0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden ring-4 ring-white/30 dark:ring-white/5">
              
              {/* Nakładka szklana dająca głębię w tle (tylna ścianka butelki) */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 pointer-events-none"></div>

              {/* Woda wypełniająca kapsułę płynnie z falami */}
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-400 transition-all duration-[1200ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] box-border"
                style={{ height: `${Math.min(waterFillPercentage, 100)}%` }}
              >
                {/* Organiczne nakładające się fale przy wierzchołku */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-cyan-300 mix-blend-screen opacity-50 blur-[2px] rounded-t-[50%] -translate-y-1/2"></div>
                <div className="absolute top-0 left-1/4 right-1/4 h-2 bg-white rounded-[50%] mix-blend-overlay blur-[1px] opacity-80 -translate-y-1/2"></div>
                {/* Wewnętrzne "bąbelki" (światło) w wodzie */}
                <div className="absolute bottom-10 right-4 w-4 h-4 rounded-full bg-white blur-[4px] mix-blend-overlay opacity-30"></div>
                <div className="absolute bottom-20 left-6 w-8 h-8 rounded-full bg-white blur-[10px] mix-blend-overlay opacity-20"></div>
              </div>

              {/* Szklane odbicie z boku (Glass Glare) na całej wysokości (przednia szyba goniąca krągłości kapsuły) */}
              <div className="absolute top-3 bottom-3 left-2 w-3 md:w-4 rounded-[4rem] bg-gradient-to-b from-white/60 via-white/10 to-transparent pointer-events-none blur-[1px]"></div>
            </div>
            
            {/* Animowany Pierścień Podstawy (Cień rzucany na biurko) */}
            <div className="w-24 h-6 bg-cyan-500/30 dark:bg-cyan-500/20 rounded-[50%] blur-xl mt-4 transition-opacity duration-1000" style={{ opacity: Math.max(0.3, waterFillPercentage / 100) }}></div>
          </div>

          {/* ODDZIELNE DUŻE PRZYCISKI -|+ */}
          <div className="flex items-center gap-3 w-full max-w-[240px] z-10 mt-auto">
            <button 
              onClick={() => changeWater(-1)} 
              disabled={currentWater === 0}
              className="flex items-center justify-center w-14 h-14 shrink-0 rounded-[1.2rem] bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md shadow-sm border border-white/40 dark:border-white/5 font-black text-3xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100"
            >
              -
            </button>
            <button 
              onClick={() => changeWater(1)} 
              className="flex-1 h-14 rounded-[1.2rem] bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_10px_20px_-10px_rgba(6,182,212,0.6)] font-black text-xl text-white transition-all hover:scale-[1.02] hover:shadow-[0_15px_25px_-10px_rgba(6,182,212,0.8)] active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden relative group border border-white/10"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <Plus className="w-5 h-5 relative z-10" />
              <Droplet className="w-5 h-5 fill-white/80 relative z-10 drop-shadow-sm" />
            </button>
          </div>
        </div>

      </div>

      {/* ==============================================
          MODAL 1: SZCZEGÓŁY DNIA (LISTA WPISÓW I ĆWICZEŃ)
      =============================================== */}
      {isDayDetailsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-200 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-black/5 dark:border-white/10 bg-emerald-500/5">
              <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                Zapisy z: {format(selectedDay, "dd MMMM yyyy", { locale: pl })}
              </h3>
              <button onClick={() => setIsDayDetailsOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-500" /> Twoje {t("health_daily.workout")}i
                </h4>
                {dayWorkouts.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">{t("health_daily.no_workouts")}</p>
                ) : (
                  <div className="space-y-3">
                    {dayWorkouts.map(w => {
                      let parsedDetails = [];
                      if (w.details) {
                        try { parsedDetails = JSON.parse(w.details); } catch { /* ignore */ }
                      }

                      return (
                        <div key={w.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{w.title}</span>
                            <button onClick={() => handleDeleteEntry(w.id)} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          
                          {parsedDetails.length > 0 ? (
                            <ul className="space-y-1.5 mt-3">
                              {parsedDetails.map((ex: any, idx: number) => (
                                <li key={idx} className="text-sm flex items-center justify-between text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-1.5 first:border-0 first:pt-0">
                                  <span><span className="font-medium text-zinc-900 dark:text-zinc-300">{ex.name}</span></span>
                                  <span className="font-mono text-xs bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                                    {ex.weight ? `${ex.weight}kg | ` : ""} {ex.sets}s x {ex.reps}p
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-zinc-400 italic">Brak zapisanych ćwiczeń.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Posiłki / {t("health_daily.calories")}</span>
                  <span className="bg-orange-500/10 text-orange-600 px-2 py-1 rounded-md text-[10px]">Suma: {totalDayCalories} kcal</span>
                </h4>
                {dayMeals.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">{t("health_daily.no_meals")}</p>
                ) : (
                  <div className="space-y-2">
                    {dayMeals.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col">
                          <span className="font-medium">{m.title}</span>
                          <span className="text-xs text-orange-500 font-bold">{m.calories} kcal</span>
                        </div>
                        <button onClick={() => handleDeleteEntry(m.id)} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL 2: DODAWANIE (TRENING Z ĆWICZENIAMI / KALORIE)
      =============================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                Dodaj wpis: <span className="text-emerald-500">{format(selectedDay, "dd.MM", { locale: pl })}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                <button onClick={() => setAddType("WORKOUT")} className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${addType === "WORKOUT" ? "bg-white dark:bg-zinc-950 shadow-md text-emerald-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                  <Dumbbell className="w-4 h-4" /> {t("health_daily.workout")}
                </button>
                <button onClick={() => setAddType("CALORIES")} className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${addType === "CALORIES" ? "bg-white dark:bg-zinc-950 shadow-md text-orange-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                  <Flame className="w-4 h-4" /> {t("health_daily.calories")}
                </button>
              </div>

              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase">{addType === "WORKOUT" ? `Nazwa ${t("health_daily.workout")}u` : t("health_daily.meal_name")}</label>
                  <input 
                    type="text" 
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-emerald-500 focus:ring-1 transition-all font-medium" 
                    placeholder={addType === "WORKOUT" ? "np. Split (Góra), FBW" : "np. Śniadanie, Obiad"} 
                  />
                </div>

                {addType === "WORKOUT" && (
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="text-sm font-bold text-zinc-500 uppercase flex items-center justify-between">
                      {t("health_daily.exercise_list")}
                      <span className="text-[10px] bg-black/5 dark:bg-white/5 px-2 py-1 rounded">{t("health_daily.optional")}</span>
                    </label>
                    
                    {exercises.map((ex, index) => (
                      <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                        <input type="text" value={ex.name} onChange={(e) => updateExercise(index, "name", e.target.value)} placeholder="Wymachy ramion" className="flex-[2] p-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-emerald-500" />
                        <input type="number" value={ex.weight} onChange={(e) => updateExercise(index, "weight", e.target.value)} placeholder="Kg" className="w-16 p-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-emerald-500 text-center" />
                        <input type="number" value={ex.sets} onChange={(e) => updateExercise(index, "sets", e.target.value)} placeholder="Serie" className="w-16 p-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-emerald-500 text-center" />
                        <input type="number" value={ex.reps} onChange={(e) => updateExercise(index, "reps", e.target.value)} placeholder="Powt." className="w-16 p-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-emerald-500 text-center" />
                        
                        {exercises.length > 1 && (
                          <button onClick={() => removeExerciseRow(index)} className="p-3 text-zinc-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                    ))}
                    
                    <button onClick={addExerciseRow} className="w-full py-3 mt-2 text-sm font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-dashed border-emerald-500/30 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> {t("health_daily.add_exercise_btn")}
                    </button>
                  </div>
                )}

                {addType === "CALORIES" && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase">{t("health_daily.calories_amount")}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={addCalories}
                        onChange={(e) => setAddCalories(e.target.value)}
                        className="w-full p-4 pr-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-orange-500 focus:ring-1 transition-all font-mono text-lg font-bold text-orange-600 dark:text-orange-400" 
                        placeholder="np. 500" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">kcal</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition-colors">{t("health_daily.cancel")}</button>
              <button onClick={handleAddEntry} className={`flex-1 py-3 px-4 rounded-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-2 shadow-lg ${addType === "WORKOUT" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-orange-500 shadow-orange-500/20"}`}>
                <Plus className="w-5 h-5" /> Zapisz w dzienniku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: CEL NAWODNIENIA (ZĘBATKA)
      =============================================== */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-200 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-black/5 dark:border-white/10 bg-blue-500/5">
              <h3 className="font-bold text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2"><Settings className="w-5 h-5" /> {t("health_daily.water_target")}</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-zinc-500">{t("health_daily.water_desc")}</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setTempGoal(Math.max(1, tempGoal - 1))} className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xl hover:bg-zinc-200">-</button>
                <div className="flex-1 text-center font-black text-3xl text-blue-600 dark:text-blue-400">{tempGoal}</div>
                <button onClick={() => setTempGoal(tempGoal + 1)} className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-xl hover:bg-blue-500/30">+</button>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={saveWaterGoal} className="w-full py-3 px-4 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"><Save className="w-5 h-5" /> {t("health_daily.save_target")}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}



