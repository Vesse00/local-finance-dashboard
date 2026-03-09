"use client";

import { useState, useMemo } from "react";
import { Wallet, TrendingDown, PiggyBank, AlertCircle, ArrowRightLeft, ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { transferToSavings } from "@/lib/actions";
import { AddIncomeModal } from "./add-income-modal";

interface MonthSummary {
  monthYear: string;
  leftToSpend: number;
  savingsTotal: number;
}

interface MainWidgetProps {
  currentStats: {
    kwotaWolna: number;
    wydano: number;
    wplywy: number;
    oszczednosci: number;
  };
  summaries: MonthSummary[];
}

export function MainWidget({ currentStats, summaries }: MainWidgetProps) {
  // OŚ CZASU: 5 miesięcy w tył, aktualny, 5 miesięcy w przód = 11 slajdów
  const REQUIRED_HISTORY = 5;
  const REQUIRED_FUTURE = 5;
  const totalSlides = REQUIRED_HISTORY + 1 + REQUIRED_FUTURE; // 11
  
  // Domyślnie startujemy na środku (Aktualny miesiąc = indeks 5)
  const [slide, setSlide] = useState(REQUIRED_HISTORY);

  const nextSlide = () => setSlide(p => (p < totalSlides - 1 ? p + 1 : p));
  const prevSlide = () => setSlide(p => (p > 0 ? p - 1 : p));

  const maPieniadzeDoOszczedzania = currentStats.kwotaWolna > 0;

  // Przygotowanie osi czasu (Timeline)
  const timelineData = useMemo(() => {
    const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    const result: any[] = [];
    
    let baseDate = new Date(); // Punkt odniesienia - dzisiaj

    for (let i = -REQUIRED_HISTORY; i <= REQUIRED_FUTURE; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const expectedMonthYear = `${months[d.getMonth()]} ${d.getFullYear()}`;
      
      if (i < 0) {
        // --- HISTORIA ---
        const foundInDb = summaries.find(s => s.monthYear.includes(months[d.getMonth()]));
        if (foundInDb) {
          result.push({
            type: "HISTORY",
            monthYear: expectedMonthYear,
            leftToSpend: foundInDb.leftToSpend,
            savingsTotal: foundInDb.savingsTotal,
            isEmpty: false
          });
        } else {
          result.push({
            type: "HISTORY",
            monthYear: expectedMonthYear,
            leftToSpend: 0,
            savingsTotal: 0,
            isEmpty: true
          });
        }
      } else if (i === 0) {
        // --- TERAŹNIEJSZOŚĆ ---
        result.push({
          type: "CURRENT",
          monthYear: "Aktualny",
          leftToSpend: currentStats.kwotaWolna,
          savingsTotal: currentStats.oszczednosci,
          isEmpty: false
        });
      } else {
        // --- PRZYSZŁOŚĆ ---
        result.push({
          type: "FUTURE",
          monthYear: expectedMonthYear,
          leftToSpend: 0, // W przyszłości na start kwota do wydania to 0
          savingsTotal: currentStats.oszczednosci, // Oszczędności pozostają aktualne w przyszłości
          isEmpty: false
        });
      }
    }
    return result;
  }, [summaries, currentStats]);

  // Dane dla aktualnie wybranego slajdu (lewa i prawa strona pobierają z tego samego obiektu)
  const activeData = timelineData[slide];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-8 shadow-2xl transition-all min-h-[320px] md:min-h-[220px] flex flex-col group">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary opacity-20 blur-[80px] dark:opacity-30 pointer-events-none"></div>
      
      <div className="relative flex flex-col md:flex-row justify-between gap-8 flex-1">
        
        {/* ========================================== */}
        {/* LEWA STRONA: KARUZELA (SLIDER)             */}
        {/* ========================================== */}
        <div className="relative flex-1 overflow-hidden flex flex-col">
          <div 
            className="flex transition-transform duration-500 ease-out h-full"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {timelineData.map((data, idx) => (
              <div key={idx} className="min-w-full flex flex-col flex-1 pb-16 md:pb-10 relative shrink-0 pr-4 justify-center">
                
                {/* NAGŁÓWEK ZE STRZAŁKAMI NAWIGACJI */}
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={prevSlide} disabled={slide === 0} className="p-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 transition-colors z-10">
                    <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                  </button>
                  
                  {/* Dynamiczny kolor "pastylki" zależny od czasu */}
                  <span className={`text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm border ${
                    data.type === "CURRENT" ? "text-primary bg-primary/10 border-primary/10" : 
                    data.type === "HISTORY" ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/10" : 
                    "text-blue-500 bg-blue-500/10 border-blue-500/10"
                  }`}>
                    {data.type === "CURRENT" ? "Możesz wydać" : data.type === "FUTURE" ? `Plan: ${data.monthYear}` : `Miesiąc: ${data.monthYear}`}
                  </span>
                  
                  <button onClick={nextSlide} disabled={slide === totalSlides - 1} className="p-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 transition-colors z-10">
                    <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                  </button>
                </div>

                {/* ZAWARTOŚĆ SLAJDU ZALEŻNA OD CZASU */}
                {data.type === "CURRENT" && (
                  <>
                    {currentStats.wplywy === 0 ? (
                      <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 w-fit">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Dodaj wpływy, aby zacząć!</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-2">
                          {data.leftToSpend.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                        </div>
                        <div className="flex items-center gap-3 mt-4 text-sm">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium border border-red-500/20">
                            <TrendingDown className="w-4 h-4" />
                            Wydano: {currentStats.wydano.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                          </div>
                          
                        </div>
                      </>
                    )}
                    {/* PRZYCISK DODAJ WPŁYW TYLKO W TERAŹNIEJSZOŚCI */}
                    <div className="absolute bottom-0 right-4 md:right-8 z-10">
                       <AddIncomeModal />
                    </div>
                  </>
                )}

                {data.type === "HISTORY" && (
                  <>
                    <h2 className="text-zinc-500 dark:text-zinc-400 font-bold text-sm mb-1 ml-1">
                      {data.isEmpty ? "Brak zapisanych danych z tego miesiąca" : "W tym miesiącu zostało ci"}
                    </h2>
                    <div className={`text-5xl md:text-6xl font-extrabold tracking-tight mt-2 ${data.isEmpty ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-900 dark:text-white"}`}>
                      {data.leftToSpend.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                    </div>
                  </>
                )}

                {data.type === "FUTURE" && (
                  <>
                    <h2 className="text-blue-500 dark:text-blue-400 font-bold text-sm mb-1 ml-1 flex items-center gap-2">
                      <CalendarClock className="w-4 h-4" /> Ten miesiąc dopiero nadejdzie
                    </h2>
                    <div className="text-5xl md:text-6xl font-extrabold tracking-tight mt-2 text-zinc-300 dark:text-zinc-600">
                      0,00 zł
                    </div>
                  </>
                )}

              </div>
            ))}
          </div>
          
          {/* KROPKI NAWIGACYJNE NA DOLE */}
          <div className="absolute bottom-0 left-1/4 md:left-1/4 translate-x-1/32 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${slide === i ? "w-4 bg-primary" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"}`} />
            ))}
          </div>
        </div>

        {/* ========================================== */}
        {/* PRAWA STRONA: OSZCZĘDNOŚCI (STATYCZNA)     */}
        {/* ========================================== */}
        <div className="flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10 pt-6 md:pt-0 md:pl-8 min-w-[220px] shrink-0 z-10 bg-white/30 dark:bg-black/20 md:bg-transparent md:dark:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0">
          <div className={`flex items-center gap-4 transition-opacity duration-300 ${activeData.isEmpty ? "opacity-50 grayscale" : "opacity-100"}`}>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-500/20 shadow-inner">
              <PiggyBank className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-all">
                {activeData.type === "HISTORY" ? "Oszczędności wtedy" : "Oszczędności"}
              </p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white transition-all">
                {activeData.savingsTotal.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
              </p>
            </div>
          </div>
          
          {/* Formularz "Przenieś resztę" pokazywany TYLKO na aktualnym miesiącu */}
          {activeData.type === "CURRENT" ? (
            <form action={transferToSavings} className="animate-in fade-in zoom-in-95 duration-300">
              <input type="hidden" name="amount" value={currentStats.kwotaWolna} />
              <button 
                type="submit" 
                disabled={!maPieniadzeDoOszczedzania}
                className="w-full group flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-all text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightLeft className="w-4 h-4 text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
                Przenieś resztę
              </button>
            </form>
          ) : (
            <div className="py-2.5 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 animate-in fade-in border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
              {activeData.type === "HISTORY" ? "Zapis historyczny" : "Jeszcze niedostępne"}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}