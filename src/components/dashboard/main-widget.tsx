"use client";

import { useState, useMemo } from "react";
import { TrendingDown, TrendingUp, PiggyBank, AlertCircle, ArrowRightLeft, ChevronLeft, ChevronRight, CalendarClock, Calendar, Sparkles } from "lucide-react";
import { transferToSavings } from "@/lib/actions";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

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
  currency: string;
  payday: number;
}

export function MainWidget({ currentStats, summaries, currency, payday }: MainWidgetProps) {
  // OŚ CZASU: 5 miesięcy w tył, aktualny, 5 miesięcy w przód = 11 slajdów
  const REQUIRED_HISTORY = 5;
  const REQUIRED_FUTURE = 5;
  const totalSlides = REQUIRED_HISTORY + 1 + REQUIRED_FUTURE; // 11
  
  // Domyślnie startujemy na środku (Aktualny miesiąc = indeks 5)
  const [slide, setSlide] = useState(REQUIRED_HISTORY);

  const nextSlide = () => setSlide(p => (p < totalSlides - 1 ? p + 1 : p));
  const prevSlide = () => setSlide(p => (p > 0 ? p - 1 : p));

  const maPieniadzeDoOszczedzania = currentStats.kwotaWolna > 0;
  const { t, language } = useLanguage();
  
  const today = new Date().getDate();
  const daysToPayday = payday - today;

  // Przygotowanie osi czasu (Timeline)
  const timelineData = useMemo(() => {
    const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    const result: any[] = [];
    
    let baseDate = new Date(); // Punkt odniesienia - dzisiaj
    const formatter = new Intl.DateTimeFormat(language === 'pl' ? 'pl-PL' : 'en-US', { month: 'long', year: 'numeric' });

    for (let i = -REQUIRED_HISTORY; i <= REQUIRED_FUTURE; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const expectedMonthYear = `${months[d.getMonth()]} ${d.getFullYear()}`;
      
      const displayMonthYear = formatter.format(d)
        .replace(/^./, (str) => str.toUpperCase()); // capitalizes first letter

      
      if (i < 0) {
        // --- HISTORIA ---
        const foundInDb = summaries.find(s => s.monthYear.includes(months[d.getMonth()]));
        if (foundInDb) {
          result.push({
            type: "HISTORY",
            monthYear: expectedMonthYear,
            displayMonthYear,
            leftToSpend: foundInDb.leftToSpend,
            savingsTotal: foundInDb.savingsTotal,
            isEmpty: false
          });
        } else {
          result.push({
            type: "HISTORY",
            monthYear: expectedMonthYear,
            displayMonthYear,
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
          displayMonthYear: t("dashboard.main.history_label"), // just using localized text separately later
          leftToSpend: currentStats.kwotaWolna,
          savingsTotal: currentStats.oszczednosci,
          isEmpty: false
        });
      } else {
        // --- PRZYSZŁOŚĆ ---
        result.push({
          type: "FUTURE",
          monthYear: expectedMonthYear,
          displayMonthYear,
          leftToSpend: 0, // W przyszłości na start kwota do wydania to 0
          savingsTotal: currentStats.oszczednosci, // Oszczędności pozostają aktualne w przyszłości
          isEmpty: false
        });
      }
    }
    return result;
  }, [summaries, currentStats, language, t]);

  // Dane dla aktualnie wybranego slajdu (lewa i prawa strona pobierają z tego samego obiektu)
  const activeData = timelineData[slide];

  return (
    <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl p-4 md:p-8 shadow-2xl shadow-indigo-500/5 transition-all min-h-[300px] md:min-h-[260px] flex flex-col group">
      {/* Bardziej wydajny radial gadiant zamiast filter: blur() */}
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full pointer-events-none opacity-20 dark:opacity-20" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, rgba(99,102,241,0) 70%)' }}></div>
      
      <div className="relative flex flex-col md:flex-row justify-between gap-8 flex-1">
        
        {/* ========================================== */}
        {/* LEWA STRONA: KARUZELA (SLIDER)             */}
        {/* ========================================== */}
        <div className="relative flex-1 overflow-hidden flex flex-col justify-between items-start w-full">
          <div 
            className="flex transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] h-full w-full"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {timelineData.map((data, idx) => (
              <div key={idx} className="min-w-full flex flex-col flex-1 pb-16 md:pb-6 relative shrink-0 justify-start w-full gap-4">
                
                {/* NAGŁÓWEK ZE STRZAŁKAMI NAWIGACJI */}
                <div className="flex items-center justify-between w-full z-10 pr-2">
                  <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-md">
                    <button onClick={prevSlide} disabled={slide === 0} className="p-2 rounded-xl bg-transparent hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 transition-all text-zinc-600 dark:text-zinc-300 disabled:hover:bg-transparent shadow-none hover:shadow-sm">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="px-3 md:px-5 py-1.5 flex items-center justify-center min-w-[108px] md:min-w-[160px]">
                      <span className={`text-[11px] md:text-xs font-black uppercase tracking-widest ${
                        data.type === "CURRENT" ? "text-indigo-600 dark:text-indigo-400" : 
                        data.type === "HISTORY" ? "text-emerald-600 dark:text-emerald-400" : 
                        "text-blue-500 dark:text-blue-400"
                      }`}>
                        {data.type === "CURRENT" ? t("dashboard.main.left_to_spend") : data.displayMonthYear}
                      </span>
                    </div>
                    
                    <button onClick={nextSlide} disabled={slide === totalSlides - 1} className="p-2 rounded-xl bg-transparent hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 transition-all text-zinc-600 dark:text-zinc-300 disabled:hover:bg-transparent shadow-none hover:shadow-sm">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {data.type === "CURRENT" && currentStats.wplywy > 0 && (
                     <Link href="/calendar" className="hidden lg:flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 w-10 h-10 rounded-2xl transition-all active:scale-95 group/cal" title={language === 'pl' ? "Kalendarz" : "Calendar"}>
                       <Calendar className="w-4 h-4 group-hover/cal:scale-110 transition-transform" />
                     </Link>
                  )}
                </div>

                {/* ZAWARTOŚĆ SLAJDU ZALEŻNA OD CZASU */}
                <div className="flex-1 flex flex-col justify-center w-full min-h-[140px] px-2 md:px-0">
                {data.type === "CURRENT" && (
                  <>
                    {currentStats.wplywy === 0 ? (
                      today < payday ? (
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 dark:border-indigo-500/10 flex flex-col gap-2 w-fit relative overflow-hidden mt-2">
                          <div className="absolute -right-4 -top-4 opacity-10"><Sparkles className="w-24 h-24 text-indigo-500" /></div>
                          <h2 className="text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" /> {language === 'pl' ? "Oczekujemy na wypłatę" : "Awaiting salary"}
                          </h2>
                          <div className="text-3xl md:text-5xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 mt-1 drop-shadow-sm">
                            Za {daysToPayday} {daysToPayday === 1 ? (language === 'pl' ? 'dzień' : 'day') : (language === 'pl' ? 'dni' : 'days')}
                          </div>
                          
                          {/* Saldo na przetrwanie (dodane na życzenie użytkownika) */}
                          <div className="mt-1 flex items-center justify-between gap-4 py-1.5 px-3 bg-white/40 dark:bg-black/20 rounded-xl border border-white/50 dark:border-white/5 w-fit shadow-sm relative z-10">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 dark:text-zinc-400">
                              {language === 'pl' ? "Pozostałe saldo" : "Left to spend"}
                            </span>
                            <span className="text-xs font-black text-zinc-700 dark:text-zinc-200">
                              {data.leftToSpend.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-amber-700 dark:text-amber-400 bg-amber-500/10 p-5 rounded-3xl border border-amber-500/20 w-fit mt-2">
                          <AlertCircle className="w-7 h-7 flex-shrink-0 opacity-80" />
                          <span className="text-sm font-bold tracking-wide">{t("dashboard.main.add_income_start")}</span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col gap-4 mt-2">
                        <div className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 drop-shadow-sm">
                          {data.leftToSpend.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                          <div className="flex items-center shadow-sm gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <TrendingUp className="w-4 h-4 opacity-70" />
                            {currentStats.wplywy.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                          </div>
                          <div className="flex items-center shadow-sm gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <TrendingDown className="w-4 h-4 opacity-70" />
                            {currentStats.wydano.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* MOBILNY PRZYCISK KALENDARZA */}
                    {currentStats.wplywy > 0 && (
                      <div className="lg:hidden absolute bottom-2 left-0 right-4 z-10">
                         <Link href="/calendar" className="active:scale-95 ease-in-out flex items-center justify-center gap-2 w-full py-4 text-sm font-bold rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:shadow-lg transition-all border border-zinc-800 dark:border-white">
                           <Calendar className="w-4 h-4" /> {language === 'pl' ? "Przejdź do kalendarza" : "Go to calendar"}
                         </Link>
                      </div>
                    )}
                  </>
                )}

                {data.type === "HISTORY" && (
                  <div className={`flex flex-col gap-3 py-4 px-6 rounded-3xl border w-fit ${data.isEmpty ? "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200/50 dark:border-zinc-800/50" : "bg-white/50 dark:bg-zinc-900/80 border-black/5 dark:border-zinc-800 shadow-sm"}`}>
                     <h2 className="text-zinc-400 dark:text-zinc-500 font-bold text-[10px] uppercase tracking-widest pl-1 mt-2">
                      {data.isEmpty ? t("dashboard.main.no_data") : t("dashboard.main.left_this_month")}
                    </h2>
                    <div className={`text-5xl md:text-6xl font-black tracking-tighter mb-2 ${data.isEmpty ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-900 dark:text-white"}`}>
                      {data.leftToSpend.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                    </div>
                  </div>
                )}

                {data.type === "FUTURE" && (
                  <div className="px-6 py-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex flex-col gap-2 w-fit mt-2">
                    <h2 className="text-blue-500 dark:text-blue-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-blue-500" /> {t("dashboard.main.future_month")}
                    </h2>
                    <div className="text-5xl md:text-6xl font-black tracking-tighter text-blue-900/30 dark:text-blue-200/30 mt-1">
                      {(0).toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                    </div>
                  </div>
                )}
                </div>

              </div>
            ))}
          </div>
          
          {/* KROPKI NAWIGACYJNE NA DOLE */}
          <div className="absolute bottom-0 left-0 right-4 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-0">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${slide === i ? "w-6 bg-indigo-500" : "w-1.5 bg-black/10 dark:bg-white/20"}`} />
            ))}
          </div>
        </div>

        {/* ========================================== */}
        {/* DZIELNIK (DIVIDER)                         */}
        {/* ========================================== */}
        <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-black/10 dark:via-white/10 to-transparent"></div>

        {/* ========================================== */}
        {/* PRAWA STRONA: OSZCZĘDNOŚCI (STATYCZNA)     */}
        {/* ========================================== */}
        <div className="hidden md:flex flex-col justify-center min-w-[200px] lg:min-w-[240px] shrink-0 z-10 pt-2 md:pt-0">
          <div className={`flex flex-col gap-6 w-full transition-opacity duration-500 ${activeData.isEmpty ? "opacity-40 grayscale" : "opacity-100"}`}>
            
            <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
              <div className="flex flex-row items-center gap-2.5 opacity-80 mb-2">
                <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <PiggyBank className="w-5 h-5 md:w-4 md:h-4" />
                </div>
                <p className="text-[10px] md:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5">
                  {activeData.type === "HISTORY" ? t("dashboard.main.savings_then") : t("dashboard.main.savings_now")}
                </p>
              </div>
              <p className="text-4xl md:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
                {activeData.savingsTotal.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
              </p>
            </div>
            
            {/* Formularz "Przenieś resztę" pokazywany TYLKO na aktualnym miesiącu */}
            {activeData.type === "CURRENT" ? (
              <form action={transferToSavings} className="w-full">
                <input type="hidden" name="amount" value={currentStats.kwotaWolna} />
                <button 
                  type="submit" 
                  disabled={!maPieniadzeDoOszczedzania}
                  className="w-full flex items-center justify-center gap-2 text-xs md:text-sm font-bold py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border border-zinc-800 dark:border-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-zinc-900/10 dark:hover:shadow-white/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all group overflow-hidden relative"
                >
                  <ArrowRightLeft className="w-4 h-4 text-teal-400 dark:text-teal-600 group-hover:rotate-180 transition-transform duration-700" />
                  <span className="relative z-10">{t("dashboard.main.transfer_rest")}</span>
                </button>
              </form>
            ) : (
              <div className="w-full py-4 text-center text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl bg-black/5 dark:bg-white/5">
                {activeData.type === "HISTORY" ? t("dashboard.main.history_record") : t("dashboard.main.not_available_yet")}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}