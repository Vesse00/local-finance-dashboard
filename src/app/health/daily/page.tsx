"use client";

import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, setYear, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Droplet, Save, X, Settings, Plus, Trash2, Activity } from "lucide-react";

export default function DailyHealthPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Dane z API
  const [healthDays, setHealthDays] = useState<any[]>([]);       
  const [healthEntries, setHealthEntries] = useState<any[]>([]); 
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
          title: addTitle || (addType === "WORKOUT" ? "Trening" : "Posiłek"),
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
      <div className="flex items-center gap-3 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dziennik Aktywności</h1>
          <p className="text-sm text-zinc-500">Dodawaj treningi z detalami i posiłki, używając plusika w kalendarzu.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* LEWA STRONA: Kalendarz (2 Kolumny) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
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
              {loading && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center"><span className="font-medium animate-pulse bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">Wczytywanie...</span></div>}

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
                          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate" title="Trening">
                            <Dumbbell className="w-3 h-3 inline mr-1" />{cDayWorkouts.length} Trening(i)
                          </div>
                        )}
                        {cDayCalories > 0 && (
                          <div className="text-[10px] font-bold text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded truncate" title="Kalorie">
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

        {/* PRAWA STRONA: ZMODYFIKOWANA BUTELKA */}
        <div className="xl:col-span-1 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10 shadow-sm p-6 flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
              <Droplet className="w-5 h-5 text-blue-500" /> Woda <span className="text-sm font-normal text-zinc-500 ml-1">({format(selectedDay, "dd.MM")})</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg uppercase">Cel: {targetWater}</span>
              <button onClick={() => setIsGoalModalOpen(true)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* NOWY REALISTYCZNY KSZTAŁT BUTELKI */}
          <div className="relative flex flex-col items-center mt-2">
            
            {/* Kapsel/Zakrętka */}
            <div className="w-12 h-4 bg-blue-500 rounded-t-md z-20 shadow-sm border-b border-black/20"></div>
            
            {/* Szyjka Butelki */}
            <div className="w-10 h-6 border-x-4 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 z-10 relative"></div>
            
            {/* Główny zbiornik (Body) - Skrócony i zaokrąglony */}
            <div className="relative w-36 h-48 border-4 border-zinc-300 dark:border-zinc-700 rounded-3xl rounded-t-[2rem] flex justify-center overflow-hidden bg-white dark:bg-zinc-900 shadow-inner -mt-1">
              
              {/* Nakładka łącząca płynnie szyjkę z ramionami butelki */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[32px] h-[6px] bg-white dark:bg-zinc-900 z-10"></div>

              {/* Woda wypełniająca */}
              <div 
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700 ease-in-out absolute bottom-0 flex items-start justify-center z-20"
                style={{ height: `${Math.min(waterFillPercentage, 100)}%` }}
              >
                {/* Fala na wierzchu wody */}
                <div className="absolute top-0 w-[200%] h-3 bg-white/30 rounded-full blur-[2px] -translate-y-1/2 animate-pulse"></div>
                
                {waterFillPercentage > 15 && (
                  <span className="mt-2 text-white font-black text-xl drop-shadow-md">
                    {currentWater}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Odchudzone, bardziej eleganckie przyciski akcji */}
          <div className="flex items-center gap-3 w-full mt-6">
            <button onClick={() => changeWater(-1)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl font-black text-2xl text-zinc-600 dark:text-zinc-400 transition-colors shadow-sm">-</button>
            <button onClick={() => changeWater(1)} className="flex-[2] py-3 bg-blue-500 hover:bg-blue-600 rounded-2xl font-black text-xl text-white transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2">
              + <Droplet className="w-5 h-5 fill-white" />
            </button>
          </div>
        </div>

      </div>

      {/* ==============================================
          MODAL 1: SZCZEGÓŁY DNIA (LISTA WPISÓW I ĆWICZEŃ)
      =============================================== */}
      {isDayDetailsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 bg-emerald-500/5">
              <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                Zapisy z: {format(selectedDay, "dd MMMM yyyy", { locale: pl })}
              </h3>
              <button onClick={() => setIsDayDetailsOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-500" /> Twoje Treningi
                </h4>
                {dayWorkouts.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">Brak treningów w tym dniu.</p>
                ) : (
                  <div className="space-y-3">
                    {dayWorkouts.map(w => {
                      let parsedDetails = [];
                      if (w.details) {
                        try { parsedDetails = JSON.parse(w.details); } catch(e) {}
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
                  <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Posiłki / Kalorie</span>
                  <span className="bg-orange-500/10 text-orange-600 px-2 py-1 rounded-md text-[10px]">Suma: {totalDayCalories} kcal</span>
                </h4>
                {dayMeals.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">Brak wpisów kalorycznych.</p>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                Dodaj wpis: <span className="text-emerald-500">{format(selectedDay, "dd.MM", { locale: pl })}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                <button onClick={() => setAddType("WORKOUT")} className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${addType === "WORKOUT" ? "bg-white dark:bg-zinc-950 shadow-md text-emerald-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                  <Dumbbell className="w-4 h-4" /> Trening
                </button>
                <button onClick={() => setAddType("CALORIES")} className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${addType === "CALORIES" ? "bg-white dark:bg-zinc-950 shadow-md text-orange-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                  <Flame className="w-4 h-4" /> Kalorie
                </button>
              </div>

              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase">{addType === "WORKOUT" ? "Nazwa Treningu" : "Co zjadłeś? (Opcjonalnie)"}</label>
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
                      Lista ćwiczeń
                      <span className="text-[10px] bg-black/5 dark:bg-white/5 px-2 py-1 rounded">Opcjonalnie</span>
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
                      <Plus className="w-4 h-4" /> Dodaj kolejne ćwiczenie
                    </button>
                  </div>
                )}

                {addType === "CALORIES" && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase">Ilość kalorii</label>
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
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition-colors">Anuluj</button>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 bg-blue-500/5">
              <h3 className="font-bold text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2"><Settings className="w-5 h-5" /> Cel nawodnienia</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-500">Ustaw, ile szklanek wody dziennie chcesz wypijać (1 szklanka to ok. 250ml).</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setTempGoal(Math.max(1, tempGoal - 1))} className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xl hover:bg-zinc-200">-</button>
                <div className="flex-1 text-center font-black text-3xl text-blue-600 dark:text-blue-400">{tempGoal}</div>
                <button onClick={() => setTempGoal(tempGoal + 1)} className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-xl hover:bg-blue-500/30">+</button>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={saveWaterGoal} className="w-full py-3 px-4 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"><Save className="w-5 h-5" /> Zapisz Cel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}