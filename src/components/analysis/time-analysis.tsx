"use client";

import { useState, useMemo } from "react";
import { CalendarDays, Briefcase, Umbrella, Stethoscope, Clock, Zap } from "lucide-react";
import { 
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip 
} from 'recharts';

interface TimeAnalysisProps {
  workDays: any[];
}

const calculateHours = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; 
  return diff / 60;
};

export function TimeAnalysis({ workDays }: TimeAnalysisProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // --- FILTROWANIE ---
  const filteredDays = useMemo(() => {
    return workDays.filter(wd => {
      const d = new Date(wd.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [workDays, selectedMonth, selectedYear]);

  // --- KPI ---
  let totalWorkDays = 0;
  let totalVacationDays = 0;
  let totalSickDays = 0;
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;

  filteredDays.forEach(day => {
    if (day.shiftType === "VACATION") totalVacationDays++;
    else if (day.shiftType === "SICK") totalSickDays++;
    else if (day.shiftType === "REGULAR") {
      totalWorkDays++;
      totalRegularHours += calculateHours(day.startTime, day.endTime);
      if (day.isOvertime) totalOvertimeHours += day.overtimeHours;
    }
  });

  const totalAllHours = totalRegularHours + totalOvertimeHours;

  // --- DANE DO WYKRESU ZŁOŻONEGO ---
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayData = filteredDays.find(d => new Date(d.date).getDate() === dayNum);
    
    let praca = 0;
    let urlop = 0;
    let l4 = 0;
    let actualHours = 0; 
    let type = "Brak";
    
    if (dayData) {
      if (dayData.shiftType === "REGULAR") {
        actualHours = calculateHours(dayData.startTime, dayData.endTime) + (dayData.isOvertime ? dayData.overtimeHours : 0);
        praca = actualHours;
        type = "Praca";
      } else if (dayData.shiftType === "VACATION") {
        type = "Urlop";
        urlop = 8; // Rysuje 8-godzinny fioletowy słupek
      } else if (dayData.shiftType === "SICK") {
        type = "L4";
        l4 = 8;    // Rysuje 8-godzinny żółty słupek
      }
    }

    return { 
      day: `${dayNum}`, 
      dateLabel: `${dayNum} ${months[selectedMonth].substring(0,3)}`,
      godziny: actualHours, // używane tylko w Tooltipie
      praca,
      urlop,
      l4,
      type
    };
  });

  // Customowy Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-black/10 dark:border-white/10 p-3 rounded-xl shadow-xl text-sm font-semibold text-zinc-900 dark:text-white">
          <p className="text-zinc-500 mb-1">{data.dateLabel}</p>
          {data.type === "Praca" ? (
            <p className="text-blue-500">Przepracowano: {data.godziny}h</p>
          ) : data.type === "Urlop" ? (
            <p className="text-purple-500">Urlop Wypoczynkowy</p>
          ) : data.type === "L4" ? (
            <p className="text-amber-500">Zwolnienie Lekarskie (L4)</p>
          ) : (
            <p className="text-zinc-400">Dzień wolny</p>
          )}
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

      {/* KARTY PODSUMOWANIA (KPI) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4" /> Dni robocze</p>
          <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{totalWorkDays}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-zinc-500 flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-zinc-400" /> Łączny czas</p>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">{totalAllHours}<span className="text-lg text-zinc-500 font-semibold ml-1">h</span></p>
        </div>

        <div className="p-5 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-zinc-500 flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-amber-500" /> Nadgodziny</p>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">{totalOvertimeHours}<span className="text-lg text-zinc-500 font-semibold ml-1">h</span></p>
        </div>
        
        <div className="p-5 rounded-3xl bg-purple-500/10 border border-purple-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2"><Umbrella className="w-4 h-4" /> Urlop</p>
          <p className="text-4xl font-black text-purple-600 dark:text-purple-400">{totalVacationDays} <span className="text-lg font-semibold ml-1">dni</span></p>
        </div>

        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2 mb-2"><Stethoscope className="w-4 h-4" /> L4</p>
          <p className="text-4xl font-black text-amber-600 dark:text-amber-500">{totalSickDays} <span className="text-lg font-semibold ml-1">dni</span></p>
        </div>
      </div>

      {/* WYKRES CZASU PRACY ZŁOŻONY */}
      <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
          Aktywność w miesiącu (Trend i Nieobecności)
        </h3>
        <p className="text-sm text-zinc-500 mb-6">Wykres prezentujący trend przepracowanych godzin oraz dni wolne.</p>
        
        <div className="w-full h-[350px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPraca" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
              <XAxis dataKey="day" tick={{ fill: '#888888', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tickFormatter={(val) => `${val}h`} tick={{ fill: '#888888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<CustomTooltip />} />
              
              {/* Słupki (Bar) dla urlopów i L4 - będą tłem w miejscach, gdzie linia z godzinami ma przerwę */}
              <Bar dataKey="urlop" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="l4" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />

              {/* Obszar (Area) dla przepracowanych godzin, dokładnie jak w module finansowym */}
              <Area type="monotone" dataKey="praca" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPraca)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}