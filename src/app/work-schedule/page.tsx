"use client";

import { useState, useEffect } from "react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isToday, setYear, isSameDay, differenceInCalendarWeeks 
} from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Briefcase, Save, X, Wand2, Trash2, Umbrella, Stethoscope, Coffee } from "lucide-react";

// Funkcje pomocnicze do obliczeń godzin i nadgodzin
const calculateHours = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; 
  return diff / 60;
};

const addHoursToTime = (time: string, hoursToAdd: number) => {
  if (!time) return "00:00";
  const [h, m] = time.split(':').map(Number);
  let totalMins = Math.round(h * 60 + m + hoursToAdd * 60);
  let newH = Math.floor(totalMins / 60) % 24;
  let newM = totalMins % 60;
  if (newH < 0) newH += 24;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

import { useLanguage } from "@/components/LanguageProvider";
import { DiscoverPage } from "@/components/DiscoverPage";

export default function WorkSchedulePage() {
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workDays, setWorkDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal pojedynczego dnia
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    shiftType: "REGULAR", // "REGULAR", "VACATION", "SICK"
    startTime: "06:00", 
    endTime: "14:00", 
    isOvertime: false, 
    actualEndTime: "14:00", // Zamiast wpisywania nadgodzin - faktyczny czas wyjścia
    notes: ""
  });

  // Modal Kreatora (Bulk)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<"generate" | "delete">("generate"); 
  const [bulkEntryType, setBulkEntryType] = useState<"REGULAR" | "VACATION" | "SICK" | "DAY_OFF">("REGULAR");
  const [bulkData, setBulkData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(addMonths(new Date(), 3)), 'yyyy-MM-dd'),
    shiftType: "1",
    shift1Start: "06:00", shift1End: "14:00",
    shift2Start: "14:00", shift2End: "22:00",
    shift3Start: "22:00", shift3End: "06:00",
    startingShift: "1",
    selectedWeekDays: [1, 2, 3, 4, 5] 
  });

  const fetchWorkDays = async () => {
    setLoading(true);
    const monthStr = format(currentMonth, "yyyy-MM");
    try {
      const res = await fetch(`/api/work-days?month=${monthStr}`);
      if (res.ok) setWorkDays(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchWorkDays(); }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = [t("work_schedule.days_short_mon"), t("work_schedule.days_short_tue"), t("work_schedule.days_short_wed"), t("work_schedule.days_short_thu"), t("work_schedule.days_short_fri"), t("work_schedule.days_short_sat"), t("work_schedule.days_short_sun")];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // === OBSŁUGA POJEDYNCZEGO DNIA ===
  const handleDayClick = (date: Date) => {
    const dayData = workDays.find(wd => isSameDay(new Date(wd.date), date));
    setSelectedDay(date);
    if (dayData) {
      setFormData({
        shiftType: dayData.shiftType || "REGULAR",
        startTime: dayData.startTime || "06:00", 
        endTime: dayData.endTime || "14:00",
        isOvertime: dayData.isOvertime || false, 
        actualEndTime: dayData.isOvertime ? addHoursToTime(dayData.endTime, dayData.overtimeHours) : (dayData.endTime || "14:00"),
        notes: dayData.notes || ""
      });
    } else {
      setFormData({ shiftType: "REGULAR", startTime: "06:00", endTime: "14:00", isOvertime: false, actualEndTime: "14:00", notes: "" });
    }
  };

  const handleSave = async () => {
    if (!selectedDay) return;
    try {
      // Wyliczamy matematycznie nadgodziny na podstawie podanej faktycznej godziny
      const otHours = formData.isOvertime ? calculateHours(formData.endTime, formData.actualEndTime) : 0;

      const res = await fetch("/api/work-days", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          date: selectedDay.toISOString(),
          shiftType: formData.shiftType,
          startTime: formData.shiftType === "REGULAR" ? formData.startTime : null,
          endTime: formData.shiftType === "REGULAR" ? formData.endTime : null,
          isOvertime: formData.shiftType === "REGULAR" ? formData.isOvertime : false,
          overtimeHours: otHours,
          notes: formData.notes
        })
      });
      if (res.ok) { setSelectedDay(null); fetchWorkDays(); }
    } catch (err) { console.error(err); }
  };

  // === MASOWE OPERACJE ===
  const toggleWeekDay = (dayIndex: number) => {
    setBulkData(prev => ({
      ...prev,
      selectedWeekDays: prev.selectedWeekDays.includes(dayIndex)
        ? prev.selectedWeekDays.filter(d => d !== dayIndex)
        : [...prev.selectedWeekDays, dayIndex]
    }));
  };

  const handleBulkGenerate = async () => {
    const startD = new Date(bulkData.startDate);
    const endD = new Date(bulkData.endDate);
    if (endD < startD) return alert(t("work_schedule.alert_date_order"));

    const allDays = eachDayOfInterval({ start: startD, end: endD });
    const daysToGenerate = allDays.filter(day => bulkData.selectedWeekDays.includes(day.getDay()));

    if (daysToGenerate.length === 0) return alert(t("work_schedule.alert_no_matching_days"));

    const payload = daysToGenerate.map(day => {
      // Jeżeli to Urlop, L4 lub Dzień Wolny, nie zapisujemy w ogóle logiki godzin
      if (bulkEntryType === "VACATION" || bulkEntryType === "SICK" || bulkEntryType === "DAY_OFF") {
      }

      // Logika dla zwykłej Pracy
      let sTime = bulkData.shift1Start; let eTime = bulkData.shift1End;
      if (bulkData.shiftType === "2" || bulkData.shiftType === "3") {
        const weeksDiff = Math.abs(differenceInCalendarWeeks(day, startD, { weekStartsOn: 1 }));
        const cycleLength = parseInt(bulkData.shiftType); 
        const startShiftIndex = parseInt(bulkData.startingShift) - 1; 
        const currentShiftIndex = (weeksDiff + startShiftIndex) % cycleLength;

        if (currentShiftIndex === 0) { sTime = bulkData.shift1Start; eTime = bulkData.shift1End; } 
        else if (currentShiftIndex === 1) { sTime = bulkData.shift2Start; eTime = bulkData.shift2End; } 
        else if (currentShiftIndex === 2) { sTime = bulkData.shift3Start; eTime = bulkData.shift3End; }
      }
      return { date: day.toISOString(), startTime: sTime, endTime: eTime, shiftType: "REGULAR" };
    });

    try {
      const res = await fetch("/api/work-days/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: payload })
      });
      if (res.ok) { setIsBulkModalOpen(false); fetchWorkDays(); alert(t("work_schedule.alert_generated").replace("{count}", payload.length.toString())); }
    } catch (err) { alert(t("work_schedule.alert_gen_error")); }
  };

  const handleBulkDelete = async () => {
    const startD = new Date(bulkData.startDate);
    const endD = new Date(bulkData.endDate);
    if (endD < startD) return alert(t("work_schedule.alert_date_order"));
    if(!confirm(t("work_schedule.alert_delete_confirm"))) return;

    try {
      const res = await fetch("/api/work-days/bulk", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: bulkData.startDate,
          endDate: bulkData.endDate,
          selectedWeekDays: bulkData.selectedWeekDays
        })
      });
      if (res.ok) { setIsBulkModalOpen(false); fetchWorkDays(); }
    } catch (err) { alert(t("work_schedule.alert_del_error")); }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <DiscoverPage page="work-schedule" />
      {/* NAGŁÓWEK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("work_schedule.title")}</h1>
            <p className="text-xs text-zinc-500">{t("work_schedule.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-200 dark:to-white text-white dark:text-zinc-900 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity mr-2 shadow-md"
          >
            <Wand2 className="w-4 h-4 text-primary dark:text-primary-dark" />
            {t("work_schedule.wizard_btn")}
          </button>

          <div className="flex items-center gap-2 border-l border-black/10 dark:border-white/10 pl-4">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <div className="flex items-center justify-center gap-2 min-w-[140px]">
              <h2 className="text-xl font-bold capitalize">{format(currentMonth, "LLLL", { locale: language === "pl" ? pl : enUS })}</h2>
              <select value={currentMonth.getFullYear()} onChange={handleYearChange} className="bg-transparent text-xl font-bold outline-none cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors appearance-none">
                {years.map(year => <option key={year} value={year} className="text-base bg-white dark:bg-zinc-900">{year}</option>)}
              </select>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* SIATKA KALENDARZA */}
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
          {weekDays.map(day => <div key={day} className="py-3 text-center text-xs font-semibold uppercase text-zinc-500">{day}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-black/5 dark:bg-white/10 relative">
          {loading && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center"><span className="font-medium animate-pulse bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">{t("work_schedule.loading")}</span></div>}

          {calendarDays.map((date, i) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isCurrentDay = isToday(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            const dayData = workDays.find(wd => isSameDay(new Date(wd.date), date));
            const dayType = dayData?.shiftType || "REGULAR";
            const dayHours = dayData && dayType === "REGULAR" ? calculateHours(dayData.startTime, dayData.endTime) + (dayData.isOvertime ? dayData.overtimeHours : 0) : 0;

            // Logika kolorów tła
            let bgClass = isCurrentMonth ? "bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900" : "bg-zinc-50/50 dark:bg-zinc-900/30";
            if (isCurrentMonth) {
              if (dayType === "VACATION") bgClass = "!bg-purple-50/80 dark:!bg-purple-900/20 hover:!bg-purple-100 dark:hover:!bg-purple-900/40 !border-purple-200 dark:!border-purple-800/50";
              else if (dayType === "SICK") bgClass = "!bg-amber-50/80 dark:!bg-amber-900/20 hover:!bg-amber-100 dark:hover:!bg-amber-900/40 !border-amber-200 dark:!border-amber-800/50";
              else if (dayType === "DAY_OFF") bgClass = "!bg-slate-50/80 dark:!bg-slate-900/20 hover:!bg-slate-100 dark:hover:!bg-slate-900/40 !border-slate-200 dark:!border-slate-800/50";
              else if (isWeekend) bgClass += " !bg-red-50/20 dark:!bg-red-950/10 hover:!bg-red-50/50 dark:hover:!bg-red-950/20";
            }

            return (
              <div 
                key={i} 
                onClick={() => isCurrentMonth && handleDayClick(date)}
                className={`group relative min-h-[120px] p-2 transition-colors border-t border-l border-transparent cursor-pointer ${bgClass}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium ${isCurrentDay ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/20" : isCurrentMonth ? (isWeekend && dayType === "REGULAR" ? "text-red-500/70" : "text-zinc-700 dark:text-zinc-300") : "text-zinc-400 dark:text-zinc-600"}`}>
                    {format(date, 'd')}
                  </span>
                  {isCurrentMonth && dayData && dayType === "REGULAR" && <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{dayHours}h</span>}
                </div>

                {isCurrentMonth && dayData && dayType === "REGULAR" && (
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-1.5 truncate rounded bg-blue-500/10 px-1.5 py-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium border border-blue-500/20">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{dayData.startTime} - {dayData.endTime}</span>
                    </div>
                    {dayData.isOvertime && (
                      <div className="truncate rounded bg-amber-500/10 px-1.5 py-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 text-center uppercase tracking-wider">
                        + {dayData.overtimeHours}h {t("work_schedule.overtime_badge").replace("+ {hours}h ", "")}
                      </div>
                    )}
                  </div>
                )}

                {isCurrentMonth && dayData && dayType === "VACATION" && (
                  <div className="mt-2 text-center rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold py-1 border border-purple-200 dark:border-purple-800/50 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Umbrella className="w-3 h-3" /> {t("work_schedule.vacation")}
                  </div>
                )}

                {isCurrentMonth && dayData && dayType === "SICK" && (
                  <div className="mt-2 text-center rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold py-1 border border-amber-200 dark:border-amber-800/50 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Stethoscope className="w-3 h-3" /> {t("work_schedule.sick_leave")}
                  </div>
                )}

                {isCurrentMonth && dayData && dayType === "DAY_OFF" && (
                  <div className="mt-2 text-center rounded bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-[11px] font-bold py-1 border border-slate-200 dark:border-slate-800/50 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Coffee className="w-3 h-3" /> {t("work_schedule.day_off")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ==============================================
          MODAL: KREATOR GRAFIKU BATCH (DODAWANIE / USUWANIE / URLOPY)
      =============================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-xl flex items-center gap-3">
                <Wand2 className="w-6 h-6 text-primary" />
                {t("work_schedule.bulk_modal_title")}
              </h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-zinc-400 hover:text-red-500 transition-colors bg-white dark:bg-zinc-800 p-2 rounded-full border border-zinc-200 dark:border-zinc-700"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                <button onClick={() => setBulkMode("generate")} className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${bulkMode === "generate" ? "bg-white dark:bg-zinc-950 shadow-md text-primary" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>
                  <Wand2 className="w-4 h-4" /> {t("work_schedule.tab_add")}
                </button>
                <button onClick={() => setBulkMode("delete")} className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${bulkMode === "delete" ? "bg-white dark:bg-zinc-950 shadow-md text-red-500" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>
                  <Trash2 className="w-4 h-4" /> {t("work_schedule.tab_clear")}
                </button>
              </div>

              {bulkMode === "generate" && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{t("work_schedule.entry_type")}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button onClick={() => setBulkEntryType("REGULAR")} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${bulkEntryType === "REGULAR" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-blue-500/50"}`}><Briefcase className="w-4 h-4" /> {t("work_schedule.work")}</button>
                    <button onClick={() => setBulkEntryType("VACATION")} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${bulkEntryType === "VACATION" ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-purple-500/50"}`}><Umbrella className="w-4 h-4" /> {t("work_schedule.vacation")}</button>
                    <button onClick={() => setBulkEntryType("SICK")} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${bulkEntryType === "SICK" ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-amber-500/50"}`}><Stethoscope className="w-4 h-4" /> {t("work_schedule.sick_leave")}</button>
                    <button onClick={() => setBulkEntryType("DAY_OFF")} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${bulkEntryType === "DAY_OFF" ? "border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300" : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-slate-500/50"}`}><Coffee className="w-4 h-4" /> {t("work_schedule.day_off")}</button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{t("work_schedule.active_period")}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("work_schedule.from_date")}</label>
                    <input type="date" value={bulkData.startDate} onChange={(e) => setBulkData({...bulkData, startDate: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("work_schedule.to_date")}</label>
                    <input type="date" value={bulkData.endDate} onChange={(e) => setBulkData({...bulkData, endDate: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none" />
                  </div>
                </div>
              </div>

              {bulkMode === "generate" && bulkEntryType === "REGULAR" && (
                <>
                  <div className="space-y-4 animate-in fade-in">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{t("work_schedule.work_system")}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex items-center justify-center ${bulkData.shiftType === "1" ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-800 bg-transparent"}`}><input type="radio" name="shiftType" value="1" checked={bulkData.shiftType === "1"} onChange={(e) => setBulkData({...bulkData, shiftType: e.target.value})} className="hidden" /><div className="font-bold text-sm">{t("work_schedule.shift_type_1")}</div></label>
                      <label className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex items-center justify-center ${bulkData.shiftType === "2" ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-800 bg-transparent"}`}><input type="radio" name="shiftType" value="2" checked={bulkData.shiftType === "2"} onChange={(e) => setBulkData({...bulkData, shiftType: e.target.value})} className="hidden" /><div className="font-bold text-sm">{t("work_schedule.shift_type_2")}</div></label>
                      <label className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex items-center justify-center ${bulkData.shiftType === "3" ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-800 bg-transparent"}`}><input type="radio" name="shiftType" value="3" checked={bulkData.shiftType === "3"} onChange={(e) => setBulkData({...bulkData, shiftType: e.target.value})} className="hidden" /><div className="font-bold text-sm">{t("work_schedule.shift_type_3")}</div></label>
                    </div>
                  </div>

                  <div className="animate-in fade-in">
                  {bulkData.shiftType === "1" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-sm font-medium">{t("work_schedule.start_time")}</label><input type="time" value={bulkData.shift1Start} onChange={(e) => setBulkData({...bulkData, shift1Start: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none" /></div>
                      <div className="space-y-2"><label className="text-sm font-medium">{t("work_schedule.end_time")}</label><input type="time" value={bulkData.shift1End} onChange={(e) => setBulkData({...bulkData, shift1End: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none" /></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
                        <div className="col-span-2 text-sm font-bold text-blue-800 dark:text-blue-300">{t("work_schedule.shift_1")}</div>
                        <input type="time" value={bulkData.shift1Start} onChange={(e) => setBulkData({...bulkData, shift1Start: e.target.value})} className="p-3 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-zinc-950 outline-none" />
                        <input type="time" value={bulkData.shift1End} onChange={(e) => setBulkData({...bulkData, shift1End: e.target.value})} className="p-3 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-zinc-950 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                        <div className="col-span-2 text-sm font-bold text-amber-800 dark:text-amber-300">{t("work_schedule.shift_2")}</div>
                        <input type="time" value={bulkData.shift2Start} onChange={(e) => setBulkData({...bulkData, shift2Start: e.target.value})} className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-zinc-950 outline-none" />
                        <input type="time" value={bulkData.shift2End} onChange={(e) => setBulkData({...bulkData, shift2End: e.target.value})} className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-zinc-950 outline-none" />
                      </div>
                      {bulkData.shiftType === "3" && (
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50">
                          <div className="col-span-2 text-sm font-bold text-purple-800 dark:text-purple-300">{t("work_schedule.shift_3")}</div>
                          <input type="time" value={bulkData.shift3Start} onChange={(e) => setBulkData({...bulkData, shift3Start: e.target.value})} className="p-3 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-white dark:bg-zinc-950 outline-none" />
                          <input type="time" value={bulkData.shift3End} onChange={(e) => setBulkData({...bulkData, shift3End: e.target.value})} className="p-3 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-white dark:bg-zinc-950 outline-none" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("work_schedule.start_from_shift")}</label>
                        <select value={bulkData.startingShift} onChange={(e) => setBulkData({...bulkData, startingShift: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none cursor-pointer">
                          <option value="1">{t("work_schedule.first_shift_opt")}</option><option value="2">{t("work_schedule.second_shift_opt")}</option>{bulkData.shiftType === "3" && <option value="3">{t("work_schedule.third_shift_opt")}</option>}
                        </select>
                      </div>
                    </div>
                  )}
                  </div>
                </>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{t("work_schedule.week_days_applied")}</h4>
                <div className="flex flex-wrap gap-2">
                  {[{ label: t("work_schedule.days_short_mon"), val: 1 }, { label: t("work_schedule.days_short_tue"), val: 2 }, { label: t("work_schedule.days_short_wed"), val: 3 }, { label: t("work_schedule.days_short_thu"), val: 4 }, { label: t("work_schedule.days_short_fri"), val: 5 }, { label: t("work_schedule.days_short_sat"), val: 6 }, { label: t("work_schedule.days_short_sun"), val: 0 }].map(day => {
                    const isSelected = bulkData.selectedWeekDays.includes(day.val);
                    return (
                      <button key={day.val} onClick={() => toggleWeekDay(day.val)} className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-bold transition-all border ${isSelected ? (bulkMode === "generate" ? "bg-primary text-white border-primary shadow-md" : "bg-red-500 text-white border-red-500 shadow-md") : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}>
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-4">
              <button onClick={() => setIsBulkModalOpen(false)} className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">{t("work_schedule.cancel_btn")}</button>
              {bulkMode === "generate" ? (
                <button onClick={handleBulkGenerate} className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 flex items-center justify-center gap-2 shadow-xl"><Wand2 className="w-5 h-5" /> {t("work_schedule.save_in_calendar")}</button>
              ) : (
                <button onClick={handleBulkDelete} className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-2 shadow-xl shadow-red-500/20"><Trash2 className="w-5 h-5" /> {t("work_schedule.clear_schedule")}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: EDYCJA POJEDYNCZEGO DNIA
      =============================================== */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {t("work_schedule.edit_modal_title")} <span className="text-primary">{format(selectedDay, "dd MMMM yyyy", { locale: pl })}</span>
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-zinc-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button onClick={() => setFormData({...formData, shiftType: "REGULAR"})} className={`py-2 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-1 ${formData.shiftType === "REGULAR" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><Briefcase className="w-4 h-4" /> {t("work_schedule.work")}</button>
                <button onClick={() => setFormData({...formData, shiftType: "VACATION"})} className={`py-2 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-1 ${formData.shiftType === "VACATION" ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><Umbrella className="w-4 h-4" /> {t("work_schedule.vacation")}</button>
                <button onClick={() => setFormData({...formData, shiftType: "SICK"})} className={`py-2 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-1 ${formData.shiftType === "SICK" ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><Stethoscope className="w-4 h-4" /> {t("work_schedule.sick_leave")}</button>
                <button onClick={() => setFormData({...formData, shiftType: "DAY_OFF"})} className={`py-2 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-1 ${formData.shiftType === "DAY_OFF" ? "border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300" : "border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><Coffee className="w-4 h-4" /> {t("work_schedule.day_off")}</button>
              </div>

              {formData.shiftType === "REGULAR" ? (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t("work_schedule.checkout_day")}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{t("work_schedule.total_work_time")}</div>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                      {formData.isOvertime ? calculateHours(formData.startTime, formData.actualEndTime) : calculateHours(formData.startTime, formData.endTime)}<span className="text-lg">h</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("work_schedule.std_start")}</label>
                      <input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-lg text-center" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("work_schedule.std_end")}</label>
                      <input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value, actualEndTime: formData.isOvertime ? formData.actualEndTime : e.target.value})} className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-lg text-center" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <span className="font-bold">{t("work_schedule.extended_shift")}</span>
                      <input type="checkbox" checked={formData.isOvertime} onChange={(e) => setFormData({...formData, isOvertime: e.target.checked, actualEndTime: e.target.checked ? formData.endTime : formData.endTime})} className="w-5 h-5 rounded border-zinc-300 text-primary focus:ring-primary" />
                    </label>

                    {formData.isOvertime && (
                      <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-bold text-amber-800 dark:text-amber-400">{t("work_schedule.actual_end_time")}</label>
                        <input type="time" value={formData.actualEndTime} onChange={(e) => setFormData({...formData, actualEndTime: e.target.value})} className="w-full p-3.5 mt-2 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-zinc-950 outline-none font-mono text-lg text-center text-amber-700 dark:text-amber-400 focus:ring-1 focus:ring-amber-500" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in">
                  <p className="font-bold text-zinc-600 dark:text-zinc-400">
                    {t("work_schedule.free_day_notice").replace("{type}", formData.shiftType === "VACATION" ? t("work_schedule.vacation") : formData.shiftType === "DAY_OFF" ? t("work_schedule.day_off") : t("work_schedule.sick_leave"))}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => setSelectedDay(null)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition-colors">{t("work_schedule.cancel_btn")}</button>
              <button onClick={handleSave} className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"><Save className="w-5 h-5" /> {t("work_schedule.save_entry")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}