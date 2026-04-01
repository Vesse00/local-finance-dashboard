"use client";

import { useState, useEffect, useRef } from "react";
import { format, isSameDay, isSameMonth } from "date-fns";
import { pl } from "date-fns/locale";
import Link from "next/link";
import { 
  ChevronLeft, Flame, Droplet, Search, Plus, X, ArrowLeft, 
  Beef, Wheat, Activity, Target, Utensils, Settings, Info, Loader2, Trash2, Cpu
} from "lucide-react";

// Przykładowa baza "Fejkowa" - z produktów z których zaraz zbudujemy wyszukiwarkę
const MOCK_DATABASE = [
  { id: "M1", name: "Pierś z kurczaka (surowa)", proteins: 21.5, carbs: 0, fats: 1.3, kcal: 98 },
  { id: "M2", name: "Ryż basmati biały (suchy)", proteins: 6.7, carbs: 78.9, fats: 0.7, kcal: 344 }
];

export default function AdvancedHealthPage() {
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  // Stan ładownia bazy
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ZMIENNE DO NOWEGO API ŻYWNOŚCIOWEGO
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [customMeals, setCustomMeals] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ZMIENNE DO KREATORA DALA
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [newMealIngredients, setNewMealIngredients] = useState<any[]>([]);
  const [builderQuery, setBuilderQuery] = useState("");
  const [builderResults, setBuilderResults] = useState<any[]>([]);

  // Stan wyszukiwarki/Kreatora
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMealType, setActiveMealType] = useState<string | null>(null);
  
  // Proces dodawania elementu -> wybór wagi
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [weightGrams, setWeightGrams] = useState<number>(100);

  // Ustawienia Celu - SMART vs MANUAL
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calcMode, setCalcMode] = useState<"MANUAL" | "SMART">("SMART");
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Stany Kalkulatora
  const [manualKcal, setManualKcal] = useState<number>(2500);
  const [smartGender, setSmartGender] = useState<"MALE" | "FEMALE">("MALE");
  const [smartWeight, setSmartWeight] = useState<number>(80);
  const [smartHeight, setSmartHeight] = useState<number>(180);
  const [smartAge, setSmartAge] = useState<number>(30);
  const [smartActivity, setSmartActivity] = useState<number>(1.55); // 1.2 - 1.9
  const [smartGoal, setSmartGoal] = useState<number>(0); // -500, 0, 500

  // Pobrane docelowe Makro
  const [targetMacros, setTargetMacros] = useState<{kcal: number, proteins: number, carbs: number, fats: number}>({
    kcal: 2500, proteins: 160, carbs: 320, fats: 80
  });

  // Dodane posiłki danego dnia (wersja pobrana z API)
  const [meals, setMeals] = useState<{id: string, type: string, items: any[]}[]>([
    { id: "", type: "Śniadanie", items: [] },
    { id: "", type: "Drugie Śniadanie", items: [] },
    { id: "", type: "Obiad", items: [] },
    { id: "", type: "Kolacja", items: [] },
    { id: "", type: "Przekąski", items: [] },
  ]);

  // ======= POBIERANIE Z BAZY I LOCAL STORAGE =======
  useEffect(() => {
    // Odczyt z LocalStorage (Wymiary z /health/body)
    const savedHeight = localStorage.getItem("userHeight");
    const savedGender = localStorage.getItem("userGender") as "MALE" | "FEMALE";
    const savedAge = localStorage.getItem("userAge");
    
    if (savedHeight) setSmartHeight(parseInt(savedHeight));
    if (savedGender) setSmartGender(savedGender);
    if (savedAge) setSmartAge(parseInt(savedAge));

    const fetchEntries = async () => {
      setIsLoading(true);
      try {
        // 1. Pobieramy dzisiejsze wpisy posiłków
        const res = await fetch(`/api/health-entries?month=${format(selectedDay, "yyyy-MM")}`);
        if (res.ok) {
          const data = await res.json();
          const dayEntries = data.filter((e: any) => e.type === "CALORIES_PRO" && isSameDay(new Date(e.date), selectedDay));
          
          setMeals(prevMeals => prevMeals.map(meal => {
            const entry = dayEntries.find((e: any) => e.title === meal.type);
            return {
              id: entry ? entry.id : "",
              type: meal.type,
              items: entry && entry.detasils ? JSON.parse(entry.detasils) : []
            };
          }));
        }

        // 2. Pobieramy ostatnią wpisaną wagę z HealthDays (Widok Moje Ciało)
        const healthRes = await fetch(`/api/health`);
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          // Szukamy najświeższego wpisu posiadającego wagę
          const withWeight = healthData.filter((d: any) => d.weight).sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (withWeight.length > 0) {
            setSmartWeight(withWeight[0].weight);
          }
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntries();
  }, [selectedDay]);

  // ====== FUNKCJE OPEN FOOD FACTS I WŁASNYCH APLIKACJI ======
  useEffect(() => {
    const fetchCustom = async () => {
      try {
        const res = await fetch("/api/food/custom");
        if (res.ok) {
          const data = await res.json();
          setCustomMeals(data);
        }
      } catch (e) {
        console.error("Custom Meals Error:", e);
      }
    };
    fetchCustom();
  }, []);

  const searchFoodApi = async (query: string, setResults: any) => {
    if (!query) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchFoodApi(searchQuery, setSearchResults);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchFoodApi(builderQuery, setBuilderResults);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [builderQuery]);

  // Aktualizacja danych do LocalStorage na zmianę w interfejsie
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("userHeight", smartHeight.toString());
      localStorage.setItem("userGender", smartGender);
      localStorage.setItem("userAge", smartAge.toString());
    }
  }, [smartHeight, smartGender, smartAge, isLoading]);

  // ======= PRZELICZ TARGET (SMART Kcal API) =======
  useEffect(() => {
    if (calcMode === "MANUAL") {
      setTargetMacros({
        kcal: manualKcal,
        proteins: 160,
        carbs: Math.max(0, Math.round((manualKcal - (160*4) - (80*9))/4)),
        fats: 80
      });
      return;
    }

    const fetchSmart = async () => {
      setIsCalculating(true);
      try {
        const res = await fetch("/api/health/calculator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gender: smartGender,
            weight: smartWeight,
            height: smartHeight,
            age: smartAge,
            activity: smartActivity,
            goal: smartGoal
          })
        });
        const data = await res.json();
        if (data && data.targetKcal) {
          setTargetMacros({
            kcal: data.targetKcal,
            proteins: data.targetProteins,
            carbs: data.targetCarbs,
            fats: data.targetFats
          });
        }
      } catch (err) {
        console.error("Błąd kalkulatora", err);
      } finally {
        setIsCalculating(false);
      }
    };
    
    // Prosty debounce
    const timeoutId = setTimeout(fetchSmart, 300);
    return () => clearTimeout(timeoutId);
  }, [calcMode, smartGender, smartWeight, smartHeight, smartAge, smartActivity, smartGoal, manualKcal]);

  // Obliczenia BIZNESOWE (Makro podsumowanie całego dnia)
  const totalMacros = meals.reduce((acc, meal) => {
    meal.items.forEach(item => {
      const multiplier = item.amount / 100;
      acc.kcal += item.product.kcal * multiplier;
      acc.proteins += item.product.proteins * multiplier;
      acc.carbs += item.product.carbs * multiplier;
      acc.fats += item.product.fats * multiplier;
    });
    return acc;
  }, { kcal: 0, proteins: 0, carbs: 0, fats: 0 });

  const handleOpenSearch = (mealType: string) => {
    setActiveMealType(mealType);
    setIsSearchOpen(true);
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setWeightGrams(100); // domyślnie
  };

  const handleAddProductToMeal = async () => {
    if (!selectedProduct || !activeMealType) return;
    
    setIsSaving(true);
    let mealIndex = meals.findIndex(m => m.type === activeMealType);
    if (mealIndex === -1) return; // Niespodziewany błąd

    const meal = meals[mealIndex];
    const newItems = [...meal.items, { product: selectedProduct, amount: weightGrams }];
    
    // Oblicz nowe kalorie dla całego posiłku
    const totalMealKcal = newItems.reduce((sum, item) => sum + (item.product.kcal * (item.amount/100)), 0);

    try {
      let res;
      if (meal.id) {
        // Mamy już wpis, więc tylko aktualizujemy JSON
        res = await fetch(`/api/health-entries/${meal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: meal.type,
            calories: Math.round(totalMealKcal),
            details: JSON.stringify(newItems)
          })
        });
      } else {
        // Tworzymy nowy wpis dla tego posiłku w wyjbranym dniu
        res = await fetch(`/api/health-entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDay.toISOString(),
            type: "CALORIES_PRO",
            title: meal.type,
            calories: Math.round(totalMealKcal),
            details: JSON.stringify(newItems)
          })
        });
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error("Błąd podczas zapisywania posiłku");

      // Zaktualizuj stan lokalny by odświeżyć tabelę (bądź co bądź ID mogło dojść)
      const freshId = meal.id || data.entry.id;
      setMeals(prevMeals => {
        const copy = [...prevMeals];
        copy[mealIndex] = { ...copy[mealIndex], id: freshId, items: newItems };
        return copy;
      });

    } catch (err) {
      console.error(err);
      alert("Nie udało się zapisać posiłku");
    } finally {
      setIsSaving(false);
      setSelectedProduct(null);
      setIsSearchOpen(false);
    }
  };

  const handleDeleteItem = async (mealType: string, itemIndex: number) => {
    const mealIndex = meals.findIndex(m => m.type === mealType);
    if (mealIndex === -1) return;
    const meal = meals[mealIndex];
    if (!meal.id) return; // Jak nie ma wpisu to nie ma czego usuwać z backendu

    setIsSaving(true);
    const newItems = meal.items.filter((_, idx) => idx !== itemIndex);
    const totalMealKcal = newItems.reduce((sum, item) => sum + (item.product.kcal * (item.amount/100)), 0);

    try {
      if (newItems.length === 0) {
        // Jeżeli usuwamy ostatni element, zróbmy DELETE całego wpisu z bazy
        await fetch(`/api/health-entries/${meal.id}`, { method: "DELETE" });
        setMeals(prevMeals => {
          const copy = [...prevMeals];
          copy[mealIndex] = { ...copy[mealIndex], id: "", items: [] };
          return copy;
        });
      } else {
        // Podmieniamy items
        const res = await fetch(`/api/health-entries/${meal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: meal.type,
            calories: Math.round(totalMealKcal),
            details: JSON.stringify(newItems)
          })
        });
        if (!res.ok) throw new Error("Błąd modyfikacji");
        setMeals(prevMeals => {
          const copy = [...prevMeals];
          copy[mealIndex] = { ...copy[mealIndex], items: newItems };
          return copy;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ======= KREATOR WŁASNEGO POSIŁKU (CUSTOM PRODUCT/MEAL) =======
  const handleSaveCustomMeal = async () => {
    if (!newMealName.trim() || newMealIngredients.length === 0) {
      alert("Dodaj nazwę posiłku i przynajmniej 1 składnik!");
      return;
    }
    
    // Obliczamy makro całego stworzonego "posiłku" lub "produktu" bazując na składnikach
    const customKcal = newMealIngredients.reduce((sum, item) => sum + (item.product.kcal * (item.amount/100)), 0);
    const customProt = newMealIngredients.reduce((sum, item) => sum + (item.product.proteins * (item.amount/100)), 0);
    const customCarb = newMealIngredients.reduce((sum, item) => sum + (item.product.carbs * (item.amount/100)), 0);
    const customFat = newMealIngredients.reduce((sum, item) => sum + (item.product.fats * (item.amount/100)), 0);

    try {
      const res = await fetch("/api/food/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMealName.trim(),
          kcal: Number(customKcal.toFixed(1)),
          proteins: Number(customProt.toFixed(1)),
          carbs: Number(customCarb.toFixed(1)),
          fats: Number(customFat.toFixed(1))
        })
      });
      if (res.ok) {
        const saved = await res.json();
        // Aktualizacja listy CustomMeals o ten nowo stworzony
        setCustomMeals(prev => [...prev, saved]);
        // Reset i zamknięcie writera
        setNewMealName("");
        setNewMealIngredients([]);
        setBuilderQuery("");
        setIsBuilderOpen(false);
        alert("Pomyślnie zapisano własny posiłek/produkt!");
      }
    } catch (err) {
      console.error("Save custom error", err);
    }
  };

  const handleBuilderAddIngredient = (product: any, amount: number) => {
    setNewMealIngredients(prev => [...prev, { product, amount }]);
  };

  const handleBuilderRemoveIngredient = (index: number) => {
    setNewMealIngredients(prev => prev.filter((_, i) => i !== index));
  };


  // Render podsumowania kółkowego (Simple Donut) makro składników
  const ProBar = ({ current, max, colorClass, label, icon: Icon }: any) => {
    const percent = Math.min(Math.round((current / max) * 100), 100);
    return (
      <div className="flex flex-col gap-2 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
          <span className="flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</span>
          <span className="text-white">{Math.round(current)}g / {max}g</span>
        </div>
        <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER -> Nawigacja powrotna */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/health/daily" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" /> 
              Tryb PRO: Makro Tracker
            </h1>
            <p className="text-sm font-bold text-zinc-500">{format(selectedDay, "EEEE, d MMMM yyyy", { locale: pl }).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest">
          Professional Fit
        </div>
      </div>

      {/* DASHBOARD GŁÓWNY (Makro + Donut Ring) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-start">
        
        {/* LEWA KOLUMNA: Wykresy + Ring */}
        <div className="lg:col-span-4 bg-zinc-950 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center self-start">
          {/* Tło glowing */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none blur-3xl"></div>
          
          <div className="w-full flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-zinc-500 font-extrabold uppercase tracking-widest text-xs">Cel Kaloryczny</h2>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 bg-white/5 hover:bg-orange-500/20 text-zinc-400 hover:text-orange-500 rounded-lg transition-all border border-white/5"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          {/* Główny pierścień zrobiony na brudno SVGcem dla klimatu PRO */}
          <div className="relative w-48 h-48 flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={`${2 * Math.PI * 88}`} 
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - Math.min(totalMacros.kcal / targetMacros.kcal, 1))}`}
                className="text-orange-500 transition-all duration-1000 ease-out" 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
               <span className="text-4xl font-black text-white">{Math.round(totalMacros.kcal)}</span>
               <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">/ {targetMacros.kcal} kcal</span>
            </div>
          </div>

          <div className="w-full space-y-3 mt-10">
            <ProBar current={totalMacros.proteins} max={targetMacros.proteins} colorClass="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" label="Białko" icon={Beef} />
            <ProBar current={totalMacros.carbs} max={targetMacros.carbs} colorClass="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" label="Węglowodany" icon={Wheat} />
            <ProBar current={totalMacros.fats} max={targetMacros.fats} colorClass="bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" label="Tłuszcze" icon={Droplet} />
          </div>
        </div>

        {/* PRAWA KOLUMNA: TABLICA POSIŁKÓW */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {["Śniadanie", "Drugie Śniadanie", "Obiad", "Kolacja", "Przekąski"].map((mealType) => {
            const currentMeal = meals.find(m => m.type === mealType);
            const totalMealKcal = currentMeal ? currentMeal.items.reduce((sum, item) => sum + (item.product.kcal * (item.amount/100)), 0) : 0;

            return (
              <div key={mealType} className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-3xl p-4 sm:p-6 transition-all hover:bg-zinc-800/60 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner ${totalMealKcal > 0 ? 'bg-orange-500/20 border-orange-500/30' : 'bg-zinc-800 border-white/5'}`}>
                      <Utensils className={`w-4 h-4 ${totalMealKcal > 0 ? 'text-orange-500' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-zinc-100 font-black tracking-tight">{mealType}</h3>
                      <p className="text-xs text-orange-400 font-bold">{Math.round(totalMealKcal)} kcal</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenSearch(mealType)}
                    disabled={isSaving}
                    className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                  >
                    {isSaving && activeMealType === mealType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span className="hidden sm:inline">Dodaj Produkt</span>
                  </button>
                </div>

                {/* Lista składników w tym posiłku */}
                {currentMeal?.items.length ? (
                  <div className="space-y-2 mt-4">
                    {currentMeal.items.map((item, idx) => {
                      const itemKcal = item.product.kcal * (item.amount/100);
                      const itemP = item.product.proteins * (item.amount/100);
                      const itemC = item.product.carbs * (item.amount/100);
                      const itemF = item.product.fats * (item.amount/100);
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-200">{item.product.name}</span>
                            <span className="text-[11px] text-zinc-500 font-medium">{item.amount}g • <span className="text-blue-400">{Math.round(itemP)}B</span> • <span className="text-emerald-400">{Math.round(itemC)}W</span> • <span className="text-amber-400">{Math.round(itemF)}T</span></span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 sm:mt-0">
                            <span className="text-sm font-black text-zinc-300">{Math.round(itemKcal)} kcal</span>
                            <button 
                              onClick={() => handleDeleteItem(mealType, idx)}
                              disabled={isSaving}
                              className="p-1.5 bg-black/20 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg transition-colors border border-white/5 hover:border-red-500/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center opacity-40 grayscale group-hover:opacity-60 transition-opacity">
                    <Target className="w-6 h-6 text-zinc-600 mb-2" />
                    <span className="text-xs font-bold text-zinc-500">Brak posiłków... jeszcze!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* OVERLAY SEARCH / SELECTOR WAGI (Jak w Fitatu) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsSearchOpen(false); setSelectedProduct(null); }}></div>
          
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-black text-white">
                {selectedProduct ? `Ile zjadłeś? (${selectedProduct.name})` : `Wyszukaj produkt dla: ${activeMealType}`}
              </h2>
              <button onClick={() => { setIsSearchOpen(false); setSelectedProduct(null); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              
              {!selectedProduct ? (
                <>
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                      type="text"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder:text-zinc-600 transition"
                      placeholder="Wpisz nazwę produktu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  
                  {/* PRZYCISK STWÓRZ WŁASNY PRODUKT */}
                  <button
                    onClick={() => setIsBuilderOpen(true)}
                    className="w-full mt-6 flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 text-zinc-400 hover:text-orange-400 transition-all gap-2"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="font-bold">Stwórz własny posiłek (Custom)</span>
                  </button>

                  <div className="space-y-4 mt-6">
                    {/* Własne / Zapisane posiłki */}
                    {customMeals.length > 0 && searchQuery === "" && (
                      <div className="mb-4">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 pl-2">Moje ulubione potrawy</div>
                        <div className="space-y-2">
                          {customMeals.map(product => (
                            <button 
                              key={`c-${product.id}`} 
                              onClick={() => handleSelectProduct(product)}
                              className="w-full text-left p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all flex items-center justify-between"
                            >
                              <div>
                                <div className="font-bold text-orange-400 flex items-center gap-2">
                                  <Utensils className="w-4 h-4" />
                                  {product.name}
                                </div>
                                <div className="text-xs text-orange-400/80 font-medium mt-1">100g: {product.kcal} kcal • B:{product.proteins}g W:{product.carbs}g T:{product.fats}g</div>
                              </div>
                              <Plus className="w-5 h-5 text-orange-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isSearching ? (
                       <div className="flex justify-center p-8">
                         <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                       </div>
                    ) : (
                      <>
                        {searchResults.length > 0 ? (
                           <>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-2">Baza ogólna (OpenFoodFacts)</div>
                            {searchResults.map(product => (
                              <button 
                                key={product.id} 
                                onClick={() => handleSelectProduct(product)}
                                className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-orange-500/50 transition-all flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-bold text-zinc-200">{product.name}</div>
                                  <div className="text-xs text-zinc-500 font-medium mt-1">100g: {product.kcal} kcal • B:{product.proteins}g W:{product.carbs}g T:{product.fats}g</div>
                                </div>
                                <Plus className="w-5 h-5 text-orange-500 opacity-50" />
                              </button>
                            ))}
                           </>
                        ) : (
                           searchQuery.length > 2 && !isSearching && (
                             <div className="text-center text-zinc-500 py-8 text-sm">Nic nie znaleziono w bazie. Spróbuj poszukać po polsku lub po kodzie kreskowym.</div>
                           )
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* WIDOK WYBORU GRAMATURY (Slide Kcal) */
                <div className="flex flex-col items-center py-6">
                  
                  <div className="text-7xl font-black text-orange-500 mb-2 font-mono">
                    {weightGrams} <span className="text-2xl text-zinc-500">g</span>
                  </div>
                  <div className="text-zinc-400 font-bold mb-10">
                    Daje to łącznie: <span className="text-white">{Math.round(selectedProduct.kcal * (weightGrams/100))} kcal</span>
                  </div>

                  <input 
                    type="range"
                    min="1"
                    max="500"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(parseInt(e.target.value))}
                    className="w-full h-3 bg-zinc-800 rounded-full appearance-none outline-none accent-orange-500"
                  />
                  
                  <div className="grid grid-cols-3 w-full gap-4 mt-12 bg-black/40 p-4 rounded-2xl border border-white/5">
                     <div className="flex flex-col items-center">
                       <span className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Białko</span>
                       <span className="text-blue-400 font-bold">{Math.round(selectedProduct.proteins * (weightGrams/100))}g</span>
                     </div>
                     <div className="flex flex-col items-center border-x border-white/5">
                       <span className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Węgle</span>
                       <span className="text-emerald-400 font-bold">{Math.round(selectedProduct.carbs * (weightGrams/100))}g</span>
                     </div>
                     <div className="flex flex-col items-center">
                       <span className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Tłuszcz</span>
                       <span className="text-amber-400 font-bold">{Math.round(selectedProduct.fats * (weightGrams/100))}g</span>
                     </div>
                  </div>

                  <button 
                    onClick={handleAddProductToMeal}
                    className="w-full py-4 mt-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl text-white font-black text-lg shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    Dodaj produkt
                  </button>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="w-full py-4 mt-3 bg-transparent text-zinc-500 hover:text-white font-bold rounded-2xl transition"
                  >
                    Wróć do wyszukiwarki
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* OVERLAY BUILDER (Tworzenie Własnego Posiłku/Produktu) */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBuilderOpen(false)}></div>
          
          <div className="w-full max-w-xl bg-zinc-950 border border-orange-500/20 rounded-[2rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-in slide-in-from-bottom-8">
             <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900/50">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                Kreator Posiłku
              </h2>
              <button onClick={() => setIsBuilderOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
               
               {/* Nazwa posiłku */}
               <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Nazwa Posiłku / Produktu</label>
                  <input 
                    type="text" 
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    placeholder="np. Omlet Białkowy, Naleśniki..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder:text-zinc-700"
                  />
               </div>

               {/* Lista dodanych składników */}
               <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                 <h3 className="text-sm font-bold text-zinc-400 mb-4">Dodane składniki:</h3>
                 {newMealIngredients.length === 0 ? (
                   <p className="text-xs text-zinc-600 text-center py-4">Nie dodano jeszcze żadnych składników.</p>
                 ) : (
                   <div className="space-y-2">
                     {newMealIngredients.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                         <div>
                           <div className="font-bold text-sm text-zinc-200">{item.product.name}</div>
                           <div className="text-xs text-orange-400">{item.amount}g</div>
                         </div>
                         <button onClick={() => handleBuilderRemoveIngredient(idx)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
                 <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 text-xs font-mono text-zinc-500">
                    <span className="text-white">Suma kcal: {Math.round(newMealIngredients.reduce((s,i) => s + i.product.kcal*(i.amount/100), 0))}</span>
                 </div>
               </div>

               {/* Wyszukiwarka do dodawania do buildera */}
               <div>
                 <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Dodaj składnik</label>
                 <div className="relative mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                      placeholder="Szukaj w bazie OpenFoodFacts..."
                      value={builderQuery}
                      onChange={(e) => setBuilderQuery(e.target.value)}
                    />
                 </div>
                 
                 <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                   {builderResults.map(product => (
                     <button 
                       key={`b-${product.id}`}
                       onClick={() => {
                         const amt = prompt(`Ile gram produktu: ${product.name}?`, "100");
                         if (amt && !isNaN(Number(amt))) {
                           handleBuilderAddIngredient(product, Number(amt));
                           setBuilderQuery("");
                           setBuilderResults([]);
                         }
                       }}
                       className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between text-sm"
                     >
                       <span className="text-zinc-200 truncate pr-2">{product.name}</span>
                       <Plus className="w-4 h-4 text-orange-500 shrink-0" />
                     </button>
                   ))}
                 </div>
               </div>

            </div>
            
            <div className="p-6 border-t border-white/5 bg-zinc-900/50">
              <button 
                onClick={handleSaveCustomMeal}
                disabled={!newMealName || newMealIngredients.length === 0}
                className="w-full py-4 bg-orange-500 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-2xl text-white font-black text-lg transition-all disabled:cursor-not-allowed shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Zapisz Posilek do Ulubionych
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY USTAWIENIA CELU KALORYCZNEGO */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
          
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl relative z-10 flex flex-col transform transition-all animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900/50 rounded-t-[2rem]">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Ustawienia Celu
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              
              {/* Przełącznik trybów kalkulatora */}
              <div className="flex p-1.5 bg-black/40 rounded-2xl mb-8 border border-white/5">
                <button 
                  onClick={() => setCalcMode("SMART")}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${calcMode === "SMART" ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-zinc-400'}`}
                >
                  <Activity className="w-4 h-4" />
                  Smart (Osobisty)
                </button>
                <button 
                  onClick={() => setCalcMode("MANUAL")}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${calcMode === "MANUAL" ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-400'}`}
                >
                  Ręczny cel
                </button>
              </div>

              {calcMode === "MANUAL" ? (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Dzienny Cel Kcal</label>
                    <input 
                      type="number" 
                      value={manualKcal}
                      onChange={(e) => setManualKcal(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white font-black text-2xl text-center focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 text-blue-400">
                    <Info className="w-5 h-5 shrink-0" />
                    <p className="text-xs leading-relaxed font-medium">
                      Makroskładniki dla tego trybu zostały ustalone na domyślny poziom (Classic balanced). Aby system celniej dopasował proporcje pod twoje ciało, zalecamy użycie trybu SMART.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in custom-scrollbar max-h-[50vh] overflow-y-auto pr-2">
                  
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-emerald-400">
                    <Target className="w-5 h-5 shrink-0" />
                    <div className="flex flex-col gap-1 text-xs">
                      <strong className="tracking-wide uppercase">Wyznacznik SMART</strong>
                      <p className="opacity-80">
                        System oblicza twoje BMR (Mifflin-St Jeor) i TDEE. Zalecamy aktualizację "Wagi i Wymiarów" w sekcji <Link href="/health/body" className="underline font-bold text-emerald-300">Moje Ciało</Link>. Obliczenia są wartością teoretyczną, obserwuj organizm!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Płeć</label>
                      <select 
                        value={smartGender}
                        onChange={(e) => setSmartGender(e.target.value as "MALE"|"FEMALE")}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3 text-white font-medium focus:outline-none focus:border-orange-500"
                      >
                        <option value="MALE">Mężczyzna</option>
                        <option value="FEMALE">Kobieta</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Wiek</label>
                      <input 
                        type="number" value={smartAge} onChange={(e) => setSmartAge(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3 text-white font-medium focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Waga (kg)</label>
                      <input 
                        type="number" value={smartWeight} onChange={(e) => setSmartWeight(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3 text-white font-medium focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Wzrost (cm)</label>
                      <input 
                        type="number" value={smartHeight} onChange={(e) => setSmartHeight(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3 text-white font-medium focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Aktywność Fizyczna</label>
                    <select 
                      value={smartActivity}
                      onChange={(e) => setSmartActivity(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3 text-white font-medium focus:outline-none focus:border-orange-500"
                    >
                      <option value="1.2">Brak ruchu / Praca siedząca (1.2)</option>
                      <option value="1.375">Niska (1-2 treningi w tyg) (1.375)</option>
                      <option value="1.55">Średnia (3-4 treningi w tyg) (1.55)</option>
                      <option value="1.725">Wysoka (Trening niemal codzień) (1.72)</option>
                      <option value="1.9">Bardzo wysoka (Praca fizyczna) (1.9)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Cel sylwetkowy</label>
                    <select 
                      value={smartGoal}
                      onChange={(e) => setSmartGoal(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3 text-white font-medium focus:outline-none focus:border-orange-500"
                    >
                      <option value="-500">Redukcja tłuszczu (-500 kcal)</option>
                      <option value="-300">Lekka Redukcja (-300 kcal)</option>
                      <option value="0">Utrzymanie wagi (0 kcal)</option>
                      <option value="300">Lekka Masa (+300 kcal)</option>
                      <option value="500">Budowa masy (+500 kcal)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-zinc-900 border border-orange-500/20 rounded-2xl">
                     <span className="text-sm font-bold text-zinc-400">Wyznaczony SMART Cel:</span>
                     <span className="text-2xl font-black text-orange-500">
                        {isCalculating ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500" /> : `${targetMacros.kcal} kcal`}
                     </span>
                  </div>

                </div>
              )}

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full mt-6 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-colors"
              >
                Zapisz Ustawienia
              </button>
              
            </div>
          </div>
        </div>
      )}

    </div>
  );
}