"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Scale, Ruler, Plus, Calendar as CalendarIcon, TrendingDown, TrendingUp, Save, X, Activity, Trash2, Edit } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function BodyMeasurementsPage() {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dane w ciele (LS)
  const [userHeight, setUserHeight] = useState<number>(0);
  const [userAge, setUserAge] = useState<number>(30);
  const [userGender, setUserGender] = useState<"MALE"|"FEMALE">("MALE");

  // Stan Modala
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    weight: "", chest: "", waist: "", hips: "", biceps: "", thigh: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/health`);
      if (res.ok) {
        const data = await res.json();
        const filteredData = data.filter((d: any) => d.weight || d.chest || d.waist || d.hips || d.biceps || d.thigh);
        setHealthData(filteredData);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const savedHeight = localStorage.getItem("userHeight");
    const savedAge = localStorage.getItem("userAge");
    const savedGender = localStorage.getItem("userGender") as "MALE"|"FEMALE";

    if (savedHeight) setUserHeight(parseInt(savedHeight));
    if (savedAge) setUserAge(parseInt(savedAge));
    if (savedGender) setUserGender(savedGender);
  }, []);

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setUserHeight(val);
    localStorage.setItem("userHeight", val.toString());
  };
  
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setUserAge(val);
    localStorage.setItem("userAge", val.toString());
  };
  
  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "MALE"|"FEMALE";
    setUserGender(val);
    localStorage.setItem("userGender", val);
  };

  // --- AKCJE CRUD (Zapis, Edycja, Usuwanie) ---
  const handleSave = async () => {
    try {
      const res = await fetch("/api/health", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData)
      });
      if (res.ok) { setIsAddModalOpen(false); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const openAddModal = () => {
    setFormData({ date: format(new Date(), "yyyy-MM-dd"), weight: "", chest: "", waist: "", hips: "", biceps: "", thigh: "" });
    setIsAddModalOpen(true);
  };

  const handleEdit = (entry: any) => {
    setFormData({
      date: format(new Date(entry.date), "yyyy-MM-dd"),
      weight: entry.weight?.toString() || "",
      chest: entry.chest?.toString() || "",
      waist: entry.waist?.toString() || "",
      hips: entry.hips?.toString() || "",
      biceps: entry.biceps?.toString() || "",
      thigh: entry.thigh?.toString() || ""
    });
    setIsAddModalOpen(true);
  };

  const handleClearMetrics = async (entry: any) => {
    if (!confirm("Czy na pewno chcesz usunąć pomiary z tego dnia? (Wypita woda i treningi z tego dnia zostaną zachowane)")) return;
    try {
      const res = await fetch("/api/health", {
        method: "POST", // Używamy POST, by nadpisać wymiary nullem, nie usuwając całego rekordu dnia!
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: entry.date,
          weight: null, chest: null, waist: null, hips: null, biceps: null, thigh: null
        })
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  // --- PRZETWARZANIE DANYCH ---
  const sortedData = [...healthData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const weightChartData = sortedData.filter(d => d.weight).map(d => ({
    dateLabel: format(new Date(d.date), "dd.MM.yy"),
    waga: d.weight
  }));

  const weightsOnly = weightChartData.map(d => d.waga);
  const minWeight = weightsOnly.length > 0 ? Math.floor(Math.min(...weightsOnly) - 1) : 0;
  const maxWeight = weightsOnly.length > 0 ? Math.ceil(Math.max(...weightsOnly) + 1) : 100;

  const latestWeightEntry = sortedData.filter(d => d.weight).pop();
  const firstWeightEntry = sortedData.filter(d => d.weight)[0];
  const currentWeight = latestWeightEntry?.weight || 0;
  const weightDiff = firstWeightEntry?.weight ? (currentWeight - firstWeightEntry.weight).toFixed(1) : 0;
  const isWeightDown = Number(weightDiff) < 0;
  const currentWaist = sortedData.filter(d => d.waist).pop()?.waist || "---";

  const historyList = [...sortedData].reverse();

  // --- BMI OBLICZENIA ---
  let bmiValue = 0;
  let bmiCategory = "Brak danych";
  let bmiColor = "text-zinc-500";
  let markerPosition = 0;

  if (userHeight > 0 && currentWeight > 0) {
    bmiValue = parseFloat((currentWeight / Math.pow(userHeight / 100, 2)).toFixed(1));
    if (bmiValue < 18.5) { bmiCategory = "Niedowaga"; bmiColor = "text-blue-500"; }
    else if (bmiValue < 25) { bmiCategory = "Prawidłowa"; bmiColor = "text-emerald-500"; }
    else if (bmiValue < 30) { bmiCategory = "Nadwaga"; bmiColor = "text-amber-500"; }
    else { bmiCategory = "Otyłość"; bmiColor = "text-red-500"; }
    markerPosition = Math.min(Math.max(((bmiValue - 15) / 25) * 100, 0), 100);
  }

  // --- BMI MODAL OBLICZENIA ---
  let modalBmi = 0; let modalBmiCategory = ""; let modalBmiColor = "text-zinc-500";
  const weightNum = parseFloat(formData.weight);
  if (userHeight > 0 && weightNum > 0) {
    modalBmi = parseFloat((weightNum / Math.pow(userHeight / 100, 2)).toFixed(1));
    if (modalBmi < 18.5) { modalBmiCategory = "Niedowaga"; modalBmiColor = "text-blue-500"; }
    else if (modalBmi < 25) { modalBmiCategory = "Prawidłowa"; modalBmiColor = "text-emerald-500"; }
    else if (modalBmi < 30) { modalBmiCategory = "Nadwaga"; modalBmiColor = "text-amber-500"; }
    else { modalBmiCategory = "Otyłość"; modalBmiColor = "text-red-500"; }
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* NAGŁÓWEK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Waga i Wymiary</h1>
            <p className="text-sm text-zinc-500">Śledź swój progres i kształtowanie sylwetki</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
          <button onClick={() => setIsSettingsOpen(true)} className="w-full md:w-auto px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center">
            Płeć / Wiek / Wzrost
          </button>
          <button onClick={openAddModal} className="w-full md:w-auto px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Dodaj pomiar
          </button>
        </div>
      </div>

      {/* KPI KARTY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-zinc-500 flex items-center gap-2 mb-2"><Scale className="w-4 h-4 text-indigo-500" /> Aktualna Waga</p>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-black text-zinc-900 dark:text-white">{currentWeight > 0 ? currentWeight : "--"}</p>
            <span className="text-xl font-bold text-zinc-400 mb-1">kg</span>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-zinc-500 flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-emerald-500" /> Zmiana całkowita</p>
          <div className="flex items-center gap-3">
            <p className="text-4xl font-black text-zinc-900 dark:text-white">{weightDiff !== 0 ? Math.abs(Number(weightDiff)) : "--"}</p>
            <span className="text-xl font-bold text-zinc-400">kg</span>
            {Number(weightDiff) !== 0 && (
              <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold ${isWeightDown ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                {isWeightDown ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {isWeightDown ? "Spadek" : "Wzrost"}
              </span>
            )}
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2"><Ruler className="w-4 h-4" /> Ostatni pomiar pasa</p>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{currentWaist}</p>
            {currentWaist !== "---" && <span className="text-xl font-bold text-indigo-400/50 mb-1">cm</span>}
          </div>
        </div>
      </div>

      {/* GŁÓWNA ZWARTOŚĆ: 2 KOLUMNY Z LEWEJ, 1 Z PRAWEJ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEWA STRONA: HISTORIA I BMI (Szeroka na 2 kolumny) */}
        <div className="xl:col-span-2 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-[600px]">
          
          {/* POZIOMY WIDŻET BMI (Zajmuje całą szerokość lewej sekcji) */}
          <div className="p-6 border-b border-black/5 dark:border-white/10 bg-indigo-50/30 dark:bg-indigo-950/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" /> Twój Wskaźnik BMI
              </h3>
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
                <span className="text-xs font-bold text-zinc-500 uppercase">Wzrost:</span>
                <input 
                  type="number" 
                  value={userHeight || ""} 
                  onChange={handleHeightChange} 
                  placeholder="np. 175"
                  className="w-16 p-1 text-sm bg-transparent outline-none font-bold text-center text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-xs text-zinc-400">cm</span>
              </div>
            </div>

            {userHeight > 0 && currentWeight > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-6 mt-2">
                <div className="text-center md:text-left min-w-[100px]">
                  <span className="font-black text-4xl text-zinc-900 dark:text-white">{bmiValue}</span>
                  <span className={`block text-xs font-bold px-2 py-0.5 mt-1 rounded-md text-center ${bmiColor.replace('text', 'bg').replace('500', '500/10')} ${bmiColor}`}>{bmiCategory}</span>
                </div>
                
                <div className="flex-1 w-full relative h-4 rounded-full bg-gradient-to-r from-blue-400 via-emerald-500 via-amber-500 to-red-500 shadow-inner">
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-[4px] border-zinc-800 dark:border-zinc-200 rounded-full shadow-lg transition-all duration-700 ease-out"
                    style={{ left: `calc(${markerPosition}% - 12px)` }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Wpisz swój wzrost u góry, by zobaczyć pasek BMI.</p>
            )}
          </div>
          
          {/* SIATKA HISTORII POMIARÓW */}
          <div className="flex-1 overflow-y-auto p-6 bg-black/5 dark:bg-white/5">
            {loading ? (
              <p className="text-center text-zinc-500 animate-pulse mt-4">Wczytywanie...</p>
            ) : historyList.length === 0 ? (
              <p className="text-center text-zinc-500 mt-4 text-sm">Brak wpisów.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyList.map((entry) => (
                  <div key={entry.id} className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> {format(new Date(entry.date), "dd MMM yyyy", { locale: pl })}</span>
                      <div className="flex items-center gap-1.5">
                        {entry.weight && <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-black text-sm">{entry.weight} kg</span>}
                        <button onClick={() => handleEdit(entry)} className="p-1.5 text-zinc-400 hover:text-indigo-500 transition-colors bg-black/5 dark:bg-white/5 rounded-lg ml-1"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleClearMetrics(entry)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors bg-black/5 dark:bg-white/5 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    
                    {(entry.chest || entry.waist || entry.hips || entry.biceps || entry.thigh) && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-black/5 dark:border-white/5">
                        {entry.chest && <div className="text-xs flex justify-between"><span className="text-zinc-500">Klatka:</span><span className="font-bold">{entry.chest} cm</span></div>}
                        {entry.waist && <div className="text-xs flex justify-between"><span className="text-zinc-500">Pas:</span><span className="font-bold">{entry.waist} cm</span></div>}
                        {entry.hips && <div className="text-xs flex justify-between"><span className="text-zinc-500">Biodra:</span><span className="font-bold">{entry.hips} cm</span></div>}
                        {entry.biceps && <div className="text-xs flex justify-between"><span className="text-zinc-500">Biceps:</span><span className="font-bold">{entry.biceps} cm</span></div>}
                        {entry.thigh && <div className="text-xs flex justify-between"><span className="text-zinc-500">Udo:</span><span className="font-bold">{entry.thigh} cm</span></div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PRAWA STRONA: WYKRES (Węższy, na 1 kolumnę) */}
        <div className="xl:col-span-1 p-6 rounded-3xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-sm flex flex-col h-[600px]">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">Wykres zmian</h3>
          <p className="text-xs text-zinc-500 mb-6">Historia Twojej wagi.</p>
          
          <div className="flex-1 min-h-[350px]">
            {weightChartData.length < 2 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 text-sm text-center">
                <Scale className="w-8 h-8 opacity-20 mb-2" /> Dodaj pomiary,<br/>aby zobaczyć wykres.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeightBody" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis dataKey="dateLabel" tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={15} />
                  <YAxis domain={[minWeight, maxWeight]} tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}kg`} />
                  <RechartsTooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl shadow-xl text-xs font-bold border border-zinc-100 dark:border-zinc-800">{payload[0].payload.dateLabel}: <span className="text-indigo-500 text-sm ml-1">{payload[0].value}kg</span></div>;
                    } return null;
                  }} />
                  <Area type="monotone" dataKey="waga" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWeightBody)" activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
       {/* USTAWIENIA CIAŁA (PŁEĆ/WIEK) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
          
          <div className="bg-white dark:bg-zinc-950 border border-black/10 dark:border-white/10 rounded-[3rem] w-full max-w-sm relative z-10 shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
              <h2 className="text-xl font-black flex items-center gap-2 text-zinc-900 dark:text-white">
                Parametry Podstawowe
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-zinc-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Płeć</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                  <button 
                    onClick={() => { setUserGender("MALE"); localStorage.setItem("userGender", "MALE"); }}
                    className={`py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${userGender === "MALE" ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-black/5 dark:border-white/10 shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >Mężczyzna</button>
                  <button 
                    onClick={() => { setUserGender("FEMALE"); localStorage.setItem("userGender", "FEMALE"); }}
                    className={`py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${userGender === "FEMALE" ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-black/5 dark:border-white/10 shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >Kobieta</button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Wiek</label>
                <input 
                  type="number" 
                  value={userAge || ""} 
                  onChange={handleAgeChange}
                  className="w-full relative appearance-none bg-zinc-100 dark:bg-zinc-900 border-none outline-none focus:ring-4 ring-indigo-500/20 text-3xl font-black rounded-2xl p-4 text-center"
                  placeholder="30"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block flex items-center justify-between">Wzrost (cm)</label>
                <input 
                  type="number" 
                  value={userHeight || ""} 
                  onChange={handleHeightChange}
                  className="w-full relative appearance-none bg-zinc-100 dark:bg-zinc-900 border-none outline-none focus:ring-4 ring-indigo-500/20 text-3xl font-black rounded-2xl p-4 text-center disabled:opacity-50"
                  placeholder="180"
                />
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 p-4 rounded-xl text-xs font-medium">
                Te dane zostaną wykorzystane automatycznie w Kalkulatorze Makroskładników.
              </div>

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-4 mt-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl transition"
              >
                Zapisz
              </button>

            </div>
          </div>
        </div>
      )}
      {/* ==============================================
          MODAL DODAWANIA / EDYCJI POMIARU
      =============================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 bg-indigo-500/5">
              <h3 className="font-bold text-lg text-indigo-700 dark:text-indigo-400 flex items-center gap-2"><Plus className="w-5 h-5" /> Zapisz Pomiar</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Data pomiaru</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 transition-all font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Ruler className="w-3 h-3 text-indigo-500" /> Wzrost (cm)</label>
                  <input type="number" value={userHeight || ""} onChange={handleHeightChange} className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black text-xl text-center text-zinc-700 dark:text-zinc-300" placeholder="np. 175" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Scale className="w-3 h-3 text-indigo-500" /> Waga (kg)</label>
                  <input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black text-xl text-center text-indigo-600 dark:text-indigo-400" placeholder="np. 82.5" />
                </div>
              </div>

              {/* PODGLĄD BMI W MODALU */}
              {userHeight > 0 && formData.weight && (
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Wyliczone BMI:</span>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-2xl text-zinc-900 dark:text-white">{modalBmi}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${modalBmiColor.replace('text', 'bg').replace('500', '500/10')} ${modalBmiColor}`}>{modalBmiCategory}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1 mb-3"><Ruler className="w-3 h-3" /> Wymiary (Opcjonalnie, w cm)</label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400">Klatka piersiowa</span>
                    <input type="number" step="0.5" value={formData.chest} onChange={(e) => setFormData({...formData, chest: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-mono" placeholder="cm" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400">Pas / Talia</span>
                    <input type="number" step="0.5" value={formData.waist} onChange={(e) => setFormData({...formData, waist: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-mono" placeholder="cm" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400">Biodra</span>
                    <input type="number" step="0.5" value={formData.hips} onChange={(e) => setFormData({...formData, hips: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-mono" placeholder="cm" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400">Udo</span>
                    <input type="number" step="0.5" value={formData.thigh} onChange={(e) => setFormData({...formData, thigh: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-mono" placeholder="cm" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] font-bold text-zinc-400">Biceps / Ramię</span>
                    <input type="number" step="0.5" value={formData.biceps} onChange={(e) => setFormData({...formData, biceps: e.target.value})} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 font-mono" placeholder="cm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition-colors">Anuluj</button>
              <button onClick={handleSave} className={`flex-1 py-3 px-4 rounded-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-2 shadow-lg bg-indigo-500 shadow-indigo-500/20`}>
                <Save className="w-5 h-5" /> Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}