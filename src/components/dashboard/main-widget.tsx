"use client";

import { useState, useMemo } from "react";
import { TrendingDown, TrendingUp, AlertCircle, ArrowRightLeft, ChevronLeft, ChevronRight, CalendarClock, Calendar, Sparkles } from "lucide-react";
import { PixelChart } from "@/components/ui/pixel-icons";
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
  const showIncomeWarning = currentStats.wplywy === 0 && today >= payday;
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
    <div className="relative overflow-hidden border border-green-900/30 bg-black/40 p-6 md:p-8 transition-all min-h-[340px] md:min-h-[260px] flex flex-col group">
      
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
                  <div className="flex items-center border border-green-900/40 bg-black/30">
                    <button onClick={prevSlide} disabled={slide === 0} className="p-2 bg-transparent hover:bg-green-400/5 disabled:opacity-20 transition-all text-zinc-600 hover:text-green-400 disabled:hover:bg-transparent">
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="px-5 py-1.5 flex items-center justify-center min-w-[120px] md:min-w-[160px]">
                      <span className={`text-[11px] md:text-xs font-mono font-black uppercase tracking-widest ${
                        data.type === "CURRENT" ? "text-green-400" :
                        data.type === "HISTORY" ? "text-green-600" :
                        "text-green-800"
                      }`}>
                        {data.type === "CURRENT" ? t("dashboard.main.left_to_spend") : data.displayMonthYear}
                      </span>
                    </div>

                    <button onClick={nextSlide} disabled={slide === totalSlides - 1} className="p-2 bg-transparent hover:bg-green-400/5 disabled:opacity-20 transition-all text-zinc-600 hover:text-green-400 disabled:hover:bg-transparent">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {data.type === "CURRENT" && currentStats.wplywy > 0 && (
                     <Link href="/calendar" className="hidden lg:flex items-center justify-center border border-green-900/40 hover:border-green-700 hover:text-green-400 text-zinc-600 w-10 h-10 transition-all active:scale-95" title={language === 'pl' ? "Kalendarz" : "Calendar"}>
                       <Calendar className="w-4 h-4" />
                     </Link>
                  )}
                </div>

                {/* ZAWARTOŚĆ SLAJDU ZALEŻNA OD CZASU */}
                <div className="flex-1 flex flex-col justify-center w-full min-h-[140px] px-2 md:px-0">
                {data.type === "CURRENT" && (
                  <>
                    {currentStats.wplywy === 0 ? (
                      today < payday ? (
                        <div className="p-5 border border-green-900/30 bg-black/30 flex flex-col gap-2 w-fit relative overflow-hidden mt-2">
                          <h2 className="text-green-700 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-800" /> {language === 'pl' ? "> OCZEKIWANIE_NA_WYPLATE" : "> AWAITING_SALARY"}
                          </h2>
                          <div className="text-4xl md:text-5xl font-mono font-black tracking-tight text-green-400 mt-1">
                            Za {daysToPayday} {daysToPayday === 1 ? (language === 'pl' ? 'dzień' : 'day') : (language === 'pl' ? 'dni' : 'days')}
                          </div>
                          
                          {/* Saldo na przetrwanie (dodane na życzenie użytkownika) */}
                          <div className="mt-1 flex items-center justify-between gap-4 py-1.5 px-3 border border-green-900/30 bg-black/20 w-fit relative z-10">
                            <span className="text-[10px] uppercase tracking-wider font-mono text-green-800">
                              {language === 'pl' ? "Pozostałe saldo" : "Left to spend"}
                            </span>
                            <span className="text-xs font-mono text-green-400">
                              {data.leftToSpend.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-amber-500 border border-amber-900/50 bg-amber-500/5 p-5 w-fit mt-2">
                          <AlertCircle className="w-6 h-6 flex-shrink-0" />
                          <span className="text-sm font-mono">{t("dashboard.main.add_income_start")}</span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col gap-4 mt-2">
                        <div className="text-6xl md:text-7xl font-mono font-black tracking-tighter text-green-400">
                          {data.leftToSpend.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                          <div className="flex items-center gap-2 px-3 py-2 border border-green-900/40 bg-green-400/5 text-green-500">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {currentStats.wplywy.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 border border-red-900/40 bg-red-900/5 text-red-500">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {currentStats.wydano.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* MOBILNY PRZYCISK KALENDARZA */}
                    {currentStats.wplywy > 0 && (
                      <div className="lg:hidden absolute bottom-2 left-0 right-4 z-10">
                         <Link href="/calendar" className="active:scale-95 ease-in-out flex items-center justify-center gap-2 w-full py-4 text-xs font-mono uppercase tracking-wider border border-green-700 bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-all">
                           <Calendar className="w-4 h-4" /> {language === 'pl' ? "Przejdź do kalendarza" : "Go to calendar"}
                         </Link>
                      </div>
                    )}
                  </>
                )}

                {data.type === "HISTORY" && (
                  <div className={`flex flex-col gap-3 py-4 px-6 border w-fit ${data.isEmpty ? "border-green-900/10 bg-black/10" : "border-green-900/30 bg-black/30"}`}>
                    <h2 className="text-[10px] font-mono text-green-800 uppercase tracking-widest">
                      {data.isEmpty ? t("dashboard.main.no_data") : t("dashboard.main.left_this_month")}
                    </h2>
                    <div className={`text-5xl md:text-6xl font-mono font-black tracking-tighter mb-2 ${data.isEmpty ? "text-green-900/40" : "text-green-600"}`}>
                      {data.leftToSpend.toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                    </div>
                  </div>
                )}

                {data.type === "FUTURE" && (
                  <div className="px-6 py-5 border border-green-900/20 bg-black/20 flex flex-col gap-2 w-fit mt-2">
                    <h2 className="text-[10px] font-mono text-green-900 uppercase tracking-widest flex items-center gap-2">
                      <CalendarClock className="w-3.5 h-3.5" /> {t("dashboard.main.future_month")}
                    </h2>
                    <div className="text-5xl md:text-6xl font-mono font-black tracking-tighter text-green-900/30 mt-1">
                      {(0).toLocaleString(language === 'pl' ? "pl-PL" : "en-US", { style: "currency", currency: currency, currencyDisplay: "narrowSymbol" })}
                    </div>
                  </div>
                )}
                </div>

              </div>
            ))}
          </div>
          
          {/* KROPKI NAWIGACYJNE NA DOLE */}
          <div className="absolute bottom-0 left-0 right-4 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-0">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div key={i} className={`h-1 transition-all duration-300 ${slide === i ? "w-6 bg-green-500" : "w-1.5 bg-green-900/40"}`} />
            ))}
          </div>
        </div>

        {/* ========================================== */}
        {/* DZIELNIK (DIVIDER)                         */}
        {/* ========================================== */}
        <div className="hidden md:block w-px bg-green-900/30"></div>
        <div className="md:hidden h-px w-full bg-green-900/30 my-2"></div>

        {/* ========================================== */}
        {/* PRAWA STRONA: OSZCZĘDNOŚCI (STATYCZNA)     */}
        {/* ========================================== */}
        <div className="flex flex-col justify-center min-w-[200px] lg:min-w-[240px] shrink-0 z-10 pt-2 md:pt-0">
          <div className={`flex flex-col gap-6 w-full transition-opacity duration-500 ${activeData.isEmpty ? "opacity-40 grayscale" : "opacity-100"}`}>
            
            <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
              <div className="flex flex-row items-center gap-2 mb-2">
                <PixelChart className="w-5 h-5 text-green-800" />
                <p className="text-[10px] font-mono text-green-700 uppercase tracking-widest">
                  {activeData.type === "HISTORY" ? t("dashboard.main.savings_then") : t("dashboard.main.savings_now")}
                </p>
              </div>
              <p className="text-4xl md:text-4xl lg:text-5xl font-mono font-black text-green-400 tracking-tighter">
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
                  className="w-full flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider py-4 border border-green-700 bg-green-400/10 text-green-400 hover:bg-green-400/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all group"
                >
                  <ArrowRightLeft className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                  {t("dashboard.main.transfer_rest")}
                </button>
              </form>
            ) : (
              <div className="w-full py-4 text-center text-[10px] font-mono uppercase tracking-widest text-green-900 border border-dashed border-green-900/30">
                {activeData.type === "HISTORY" ? t("dashboard.main.history_record") : t("dashboard.main.not_available_yet")}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}