"use client";

import { useState, useMemo } from "react";
import { CalendarDays, Dumbbell, Flame, Droplet, Scale, Activity, TrendingDown, TrendingUp } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { 
  ComposedChart, AreaChart, Area, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip as RechartsTooltip, PieChart, Pie, Cell 
} from 'recharts';

interface HealthAnalysisProps {
  healthDays: any[];
  healthEntries: any[];
}

export function HealthAnalysis({ healthDays, healthEntries }: HealthAnalysisProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // --- FILTROWANIE DANYCH DLA WYBRANEGO MIESIĄCA ---
  const currentMonthDays = useMemo(() => healthDays.filter(d => {
    const date = new Date(d.date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  }), [healthDays, selectedMonth, selectedYear]);

  const currentMonthEntries = useMemo(() => healthEntries.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  }), [healthEntries, selectedMonth, selectedYear]);

  // --- OBLICZENIA KPI ---
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  
  let totalWorkouts = 0;
  let totalCalories = 0;
  let daysWithCalories = 0;
  let totalWater = 0;
  let daysWithWater = 0;

  // Przetwarzanie wpisów (Treningi i Kalorie)
  currentMonthEntries.forEach(entry => {
    if (entry.type === "WORKOUT") totalWorkouts++;
    if (entry.type === "CALORIES") totalCalories += entry.calories;
  });

  // Przetwarzanie Dni (Woda i Waga)
  const weightPoints: {day: number, waga: number}[] = [];
  
  currentMonthDays.forEach(day => {
    if (day.waterGlasses > 0) {
      totalWater += day.waterGlasses;
      daysWithWater++;
    }
    if (day.weight) {
      weightPoints.push({ day: new Date(day.date).getDate(), waga: day.weight });
    }
  });

  // Kalorie: dni, w których wpisano posiłki
  const uniqueDaysWithCalories = new Set(currentMonthEntries.filter(e => e.type === "CALORIES").map(e => new Date(e.date).getDate()));
  daysWithCalories = uniqueDaysWithCalories.size;

  const avgCalories = daysWithCalories > 0 ? Math.round(totalCalories / daysWithCalories) : 0;
  const avgWater = daysWithWater > 0 ? (totalWater / daysWithWater).toFixed(1) : 0;

  // Waga zmiana i aktualna waga w miesiącu
  weightPoints.sort((a, b) => a.day - b.day);
  const firstWeight = weightPoints.length > 0 ? weightPoints[0].waga : 0;
  const lastWeight = weightPoints.length > 0 ? weightPoints[weightPoints.length - 1].waga : 0;
  const weightDiff = firstWeight > 0 ? (lastWeight - firstWeight).toFixed(1) : "0";

  // --- DANE DO WYKRESÓW ---
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(selectedYear, selectedMonth, dayNum);
    const dayLabel = `${dayNum} ${months[selectedMonth].substring(0,3)}`;
    
    const dayData = currentMonthDays.find(d => isSameDay(new Date(d.date), dateObj));
    const dayEntries = currentMonthEntries.filter(e => isSameDay(new Date(e.date), dateObj));
    
    const cals = dayEntries.filter(e => e.type === "CALORIES").reduce((sum, e) => sum + e.calories, 0);
    const workouts = dayEntries.filter(e => e.type === "WORKOUT").length;

    return {
      day: `${dayNum}`,
      dateLabel: dayLabel,
      kalorie: cals,
      woda: dayData?.waterGlasses || 0,
      waga: dayData?.weight || null,
      treningi: workouts
    };
  });

  // Dane do Pie Chart
  const activeDaysCount = chartData.filter(d => d.treningi > 0).length;
  const restDaysCount = daysInMonth - activeDaysCount;
  const pieData = [
    { name: "Dni Treningowe", value: activeDaysCount, color: "#10b981" },
    { name: "Regeneracja", value: restDaysCount, color: "#3f3f46" }       
  ];

  const HabitTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-black/10 dark:border-white/10 p-3 rounded-xl shadow-xl text-sm font-semibold">
          <p className="text-zinc-500 mb-2">{payload[0].payload.dateLabel}</p>
          <p className="text-orange-500 flex items-center gap-1"><Flame className="w-3 h-3"/> Kalorie: {payload[0].payload.kalorie} kcal</p>
          <p className="text-blue-500 flex items-center gap-1"><Droplet className="w-3 h-3"/> Woda: {payload[0].payload.woda} szklanek</p>
        </div>
      );
    }
    return null;
  };

  const WeightTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0].value) {
      return (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-black/10 dark:border-white/10 p-2 rounded-xl shadow-lg text-xs font-bold">
          {payload[0].payload.dateLabel}: <span className="text-indigo-500 text-sm ml-1">{payload[0].value}kg</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* PASEK FILTRÓW */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl shadow-sm">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm shadow-sm">
          <CalendarDays className="w-4 h-4 text-zinc-400" />
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent outline-none cursor-pointer font-bold text-zinc-700 dark:text-zinc-300">
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent outline-none cursor-pointer font-bold text-zinc-700 dark:text-zinc-300 border-l border-black/10 dark:border-white/10 pl-2 ml-2">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KARTY KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-2"><Dumbbell className="w-4 h-4" /> Wykonane treningi</p>
          <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{totalWorkouts}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-zinc-500 flex items-center gap-2 mb-2"><Flame className="w-4 h-4 text-orange-500" /> Średnio kalorii</p>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">{avgCalories}<span className="text-base text-zinc-400 ml-1">kcal/dzień</span></p>
        </div>

        <div className="p-5 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-zinc-500 flex items-center gap-2 mb-2"><Droplet className="w-4 h-4 text-blue-500" /> Średnio wody</p>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">{avgWater}<span className="text-base text-zinc-400 ml-1">szkl.</span></p>
        </div>

        {/* POPRAWIONY KAFELEK WAGI */}
        <div className="p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2"><Scale className="w-4 h-4" /> Ostatnia waga</p>
          <div>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{lastWeight > 0 ? lastWeight : "--"}</p>
              {lastWeight > 0 && <span className="text-base font-bold text-indigo-500/70 mb-1">kg</span>}
            </div>
            
            {/* Informacja o zmianie w danym miesiącu */}
            {weightPoints.length > 1 ? (
              <p className="text-xs font-bold mt-1 flex items-center gap-1 text-indigo-500/80">
                {Number(weightDiff) > 0 ? <TrendingUp className="w-3 h-3" /> : Number(weightDiff) < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {Number(weightDiff) > 0 ? "+" : ""}{weightDiff} kg w tym miesiącu
              </p>
            ) : lastWeight > 0 ? (
              <p className="text-xs font-bold mt-1 text-indigo-500/80">Jeden pomiar w tym miesiącu</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* WYKRES 1: KALORIE I NAWODNIENIE */}
      <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" /> Nawodnienie i Kalorie (Nawyki)
        </h3>
        <p className="text-sm text-zinc-500 mb-6">Wykres łączący spożyte kalorie (słupki) z wypitą wodą (linia) w tym miesiącu.</p>
        
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
              <XAxis dataKey="day" tick={{ fill: '#888888', fontSize: 12 }} axisLine={false} tickLine={false} />
              
              <YAxis yAxisId="left" tickFormatter={(val) => `${val}`} tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 20]} hide />
              
              <RechartsTooltip content={<HabitTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              
              <Bar yAxisId="left" dataKey="kalorie" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="woda" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", stroke: "#fff" }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DOLNY RZĄD: TRENINGI I WAGA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* WYKRES KOŁOWY: TRENINGI */}
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col h-[350px]">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2"><Dumbbell className="w-5 h-5 text-emerald-500" /> Stosunek Aktywności</h3>
          <p className="text-xs text-zinc-500 mb-2">Porównanie dni treningowych do regeneracji.</p>
          
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-emerald-500">{activeDaysCount}</span>
              <span className="text-xs font-bold text-zinc-500">Dni Aktywnych</span>
            </div>
          </div>
        </div>

        {/* WYKRES LINIOWY: TREND WAGI W MIESIĄCU */}
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col h-[350px]">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2"><Scale className="w-5 h-5 text-indigo-500" /> Pomiary Wagi (Ten Miesiąc)</h3>
          <p className="text-xs text-zinc-500 mb-6">Wizualizacja zmian wagi w wybranym miesiącu.</p>
          
          <div className="flex-1">
            {weightPoints.length < 2 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 text-sm text-center">
                <Scale className="w-8 h-8 opacity-20 mb-2" /> Brak wystarczających danych o wadze<br/>w tym miesiącu.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.filter(d => d.waga !== null)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeightAn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis dataKey="day" tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}kg`} />
                  <RechartsTooltip content={<WeightTooltip />} />
                  <Area type="monotone" dataKey="waga" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWeightAn)" activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}