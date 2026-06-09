// ============================================================
// SYSTEM OSIĄGNIĘĆ – definicje, logika, typy
// ============================================================

export interface AchievementTierDef {
  level: 1 | 2 | 3 | 4;
  label: string;
  emoji: string;
  threshold: number;
  description: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryIcon: string;
  icon: string;
  unit: string;
  formatValue?: (v: number, currency?: string) => string;
  prerequisiteId?: string;       // ID osiągnięcia, które musi być >= tier 1
  tiers: AchievementTierDef[];
}

export interface AchievementResult extends AchievementDef {
  currentValue: number;
  unlockedTier: 0 | 1 | 2 | 3 | 4;
  nextTier: AchievementTierDef | null;
  progressToNext: number;   // 0–100
  prevThreshold: number;
  isPrerequisiteMet: boolean;
  displayCurrency?: string;   // waluta do formatowania wartości (np. dla Skarbonki, Pana Oszczędzającego)
}

// ── Dane wejściowe ─────────────────────────────────────────
export interface AchievementData {
  totalSavingsBalance: number;           // suma oszczędności w głównej walucie
  importedTransactions: number;
  activeRecurringCount: number;
  bestLoanPaidPercent: number;
  healthDaysCount: number;
  totalOvertimeHours: number;
  carEventsCount: number;
  drawerItemsCount: number;
  expenseCategoriesCount: number;
  salaryIncomesCount: number;            // przychody z kategorią "Wynagrodzenie"
  loginStreak: number;                   // bieżąca seria logowań (dni z rzędu)
  foreignCurrencyAccountsCount: number;  // liczba walut obcych (unikalnych)
  largestForeignCurrencyBalance: number; // saldo najliczniejszej obcej waluty
  largestForeignCurrency: string;        // kod tej waluty (np. "EUR", "USD")
  mainCurrency: string;                  // domyślna waluta użytkownika
  discoveredPages: string[];             // odkryte sekcje aplikacji
}

// ── Definicje osiągnięć ────────────────────────────────────
export const ACHIEVEMENTS: AchievementDef[] = [

  // ─── 🧭 ODKRYWCA ─────────────────────────────────────────
  {
    id: "discover_calendar",
    name: "Mój Kalendarz",
    description: "Odwiedź sekcję kalendarza i zacznij śledzić finanse dzień po dniu",
    category: "Odkrywca",
    categoryIcon: "🧭",
    icon: "🗓️",
    unit: "",
    tiers: [
      { level: 1, label: "Odkryty", emoji: "🔓", threshold: 1, description: "Odwiedź sekcję kalendarza" },
    ],
  },
  {
    id: "discover_savings",
    name: "Moje Oszczędności",
    description: "Odwiedź sekcję oszczędności i zacznij budować swoje konta",
    category: "Odkrywca",
    categoryIcon: "🧭",
    icon: "💰",
    unit: "",
    tiers: [
      { level: 1, label: "Odkryty", emoji: "🔓", threshold: 1, description: "Odwiedź sekcję oszczędności" },
    ],
  },
  {
    id: "discover_planner",
    name: "Mój Planer",
    description: "Odwiedź sekcję planera i zarządzaj zleceniami stałymi oraz ratami",
    category: "Odkrywca",
    categoryIcon: "🧭",
    icon: "📋",
    unit: "",
    tiers: [
      { level: 1, label: "Odkryty", emoji: "🔓", threshold: 1, description: "Odwiedź sekcję planera" },
    ],
  },
  {
    id: "discover_analysis",
    name: "Moje Analizy",
    description: "Odwiedź sekcję analiz i poznaj swoje nawyki finansowe",
    category: "Odkrywca",
    categoryIcon: "🧭",
    icon: "📊",
    unit: "",
    tiers: [
      { level: 1, label: "Odkryty", emoji: "🔓", threshold: 1, description: "Odwiedź sekcję analiz" },
    ],
  },
  {
    id: "discover_workschedule",
    name: "Mój Grafik",
    description: "Odwiedź sekcję grafiku pracy i zacznij śledzić swój czas",
    category: "Odkrywca",
    categoryIcon: "🧭",
    icon: "⏰",
    unit: "",
    tiers: [
      { level: 1, label: "Odkryty", emoji: "🔓", threshold: 1, description: "Odwiedź sekcję grafiku pracy" },
    ],
  },
  {
    id: "discover_health",
    name: "Moje Zdrowie",
    description: "Odkryj wszystkie sekcje zdrowia – codzienność, sylwetka, energia",
    category: "Odkrywca",
    categoryIcon: "🧭",
    icon: "🏃",
    unit: "podstron",
    tiers: [
      { level: 1, label: "Początek",    emoji: "🔓", threshold: 1, description: "Odwiedź pierwszą sekcję zdrowia" },
      { level: 2, label: "Aktywny",     emoji: "🥈", threshold: 2, description: "Odwiedź dwie sekcje zdrowia" },
      { level: 3, label: "Kompleksowy", emoji: "🥇", threshold: 3, description: "Odwiedź wszystkie sekcje zdrowia (codzienność, sylwetka, energia)" },
    ],
  },
  {
    id: "discover_garage",
    name: "Mój Garaż",
    description: "Odwiedź sekcję garażu i zacznij śledzić swoje pojazdy",
    category: "Odkrywca",
    categoryIcon: "🧭",
    icon: "🔧",
    unit: "",
    tiers: [
      { level: 1, label: "Odkryty", emoji: "🔓", threshold: 1, description: "Odwiedź sekcję garażu" },
    ],
  },
  {
    id: "discover_drawer",
    name: "Moja Szuflada",
    description: "Odwiedź sekcję szuflady i przechowaj swoje dokumenty cyfrowo",
    category: "Odkrywca",
    categoryIcon: "🧭",
    icon: "📂",
    unit: "",
    tiers: [
      { level: 1, label: "Odkryty", emoji: "🔓", threshold: 1, description: "Odwiedź sekcję szuflady" },
    ],
  },

  // ─── 💰 OSZCZĘDNOŚCI ─────────────────────────────────────
  {
    id: "savings_balance",
    name: "Skarbonka",
    description: "Łączna kwota oszczędności w Twojej głównej walucie",
    category: "Oszczędności",
    categoryIcon: "💰",
    icon: "🐷",
    unit: "",
    formatValue: (v, currency) => v.toLocaleString("pl-PL", { maximumFractionDigits: 0 }) + " " + (currency ?? "PLN"),
    prerequisiteId: "discover_savings",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 1_000,   description: "Zaoszczędź łącznie 1 000 w głównej walucie" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 10_000,  description: "Zaoszczędź łącznie 10 000 w głównej walucie" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 50_000,  description: "Zaoszczędź łącznie 50 000 w głównej walucie" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 100_000, description: "Zaoszczędź łącznie 100 000 w głównej walucie" },
    ],
  },
  {
    id: "pan_miedzy_narodowy",
    name: "Pan Między Narodowy",
    description: "Otwórz konta oszczędnościowe w obcych walutach",
    category: "Oszczędności",
    categoryIcon: "💰",
    icon: "🌍",
    unit: "walut",
    formatValue: (v) => v + (v === 1 ? " waluta obca" : v < 5 ? " waluty obce" : " walut obcych"),
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 1, description: "Otwórz konto w 1 obcej walucie (EUR/USD/GBP)" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 2, description: "Otwórz konta w 2 obcych walutach" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 3, description: "Otwórz konta w 3 obcych walutach" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 4, description: "Otwórz konta w 4 obcych walutach – prawdziwy globtroter!" },
    ],
  },
  {
    id: "pan_oszczedzajacy",
    name: "Pan Oszczędzający",
    description: "Zaoszczędź na koncie w obcej walucie (wymaga: Pan Między Narodowy)",
    category: "Oszczędności",
    categoryIcon: "💰",
    icon: "💶",
    unit: "",
    formatValue: (v, currency) => v.toLocaleString("pl-PL", { maximumFractionDigits: 0 }) + " " + (currency ?? "EUR"),
    prerequisiteId: "pan_miedzy_narodowy",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 100,   description: "Zaoszczędź 100 w obcej walucie" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 500,   description: "Zaoszczędź 500 w obcej walucie" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 2_000, description: "Zaoszczędź 2 000 w obcej walucie" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 5_000, description: "Zaoszczędź 5 000 w obcej walucie – walutowy mistrz oszczędzania!" },
    ],
  },

  // ─── 📊 TRANSAKCJE ───────────────────────────────────────
  {
    id: "imported_transactions",
    name: "Kronikarz",
    description: "Łączna liczba zaimportowanych transakcji bankowych",
    category: "Transakcje",
    categoryIcon: "📊",
    icon: "🗂️",
    unit: "transakcji",
    formatValue: (v) => v.toLocaleString("pl-PL") + " transakcji",
    prerequisiteId: "discover_calendar",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 50,   description: "Zaimportuj 50 transakcji bankowych" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 200,  description: "Zaimportuj 200 transakcji bankowych" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 500,  description: "Zaimportuj 500 transakcji bankowych" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 1000, description: "Zaimportuj 1 000 transakcji bankowych" },
    ],
  },
  {
    id: "salary_incomes",
    name: "Zarabiający",
    description: "Liczba zarejestrowanych wynagrodzeń (przychodów kategorii Wynagrodzenie)",
    category: "Transakcje",
    categoryIcon: "📊",
    icon: "💵",
    unit: "wypłat",
    formatValue: (v) => v + (v === 1 ? " wynagrodzenie" : v < 5 ? " wynagrodzenia" : " wynagrodzeń"),
    prerequisiteId: "discover_calendar",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 1,  description: "Zarejestruj pierwszą wypłatę" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 6,  description: "6 miesięcy zarobków – pół roku!" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 12, description: "12 miesięcy zarobków – cały rok!" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 24, description: "24 miesiące zarobków – regularny zarabiający!" },
    ],
  },

  // ─── 🔄 SYSTEMATYCZNOŚĆ ──────────────────────────────────
  {
    id: "recurring_count",
    name: "Metodyczny",
    description: "Liczba aktywnych zleceń stałych i rat",
    category: "Systematyczność",
    categoryIcon: "🔄",
    icon: "📅",
    unit: "zleceń",
    formatValue: (v) => v + " zleceń",
    prerequisiteId: "discover_planner",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 1,  description: "Dodaj 1 zlecenie stałe" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 3,  description: "Dodaj 3 zlecenia stałe" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 5,  description: "Dodaj 5 zleceń stałych" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 10, description: "Dodaj 10 zleceń stałych" },
    ],
  },
  {
    id: "loan_paid",
    name: "Spłacający",
    description: "Procent spłaconego kredytu (najlepszy wynik spośród Twoich kredytów)",
    category: "Systematyczność",
    categoryIcon: "🔄",
    icon: "🏦",
    unit: "%",
    formatValue: (v) => Math.round(v) + "% spłacono",
    prerequisiteId: "discover_planner",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 25,  description: "Spłać 25% kredytu" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 50,  description: "Spłać 50% kredytu – połowa za Tobą!" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 75,  description: "Spłać 75% kredytu – prawie gotowe!" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 100, description: "Spłać kredyt w całości! Wolność finansowa!" },
    ],
  },
  {
    id: "categories_used",
    name: "Analityk",
    description: "Liczba różnych kategorii wydatków, których aktywnie używasz",
    category: "Systematyczność",
    categoryIcon: "🔄",
    icon: "📈",
    unit: "kategorii",
    formatValue: (v) => v + " kategorii",
    prerequisiteId: "discover_analysis",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 3,  description: "Użyj 3 różnych kategorii wydatków" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 6,  description: "Użyj 6 różnych kategorii wydatków" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 10, description: "Użyj 10 różnych kategorii wydatków" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 15, description: "Użyj 15 różnych kategorii wydatków" },
    ],
  },

  // ─── 💪 ZDROWIE ──────────────────────────────────────────
  {
    id: "health_days",
    name: "Zdrowy Start",
    description: "Liczba dni z wpisem zdrowotnym",
    category: "Zdrowie",
    categoryIcon: "💪",
    icon: "🏃",
    unit: "dni",
    formatValue: (v) => v + " dni",
    prerequisiteId: "discover_health",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 7,   description: "Zaloguj 7 dni aktywności zdrowotnej" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 30,  description: "Zaloguj 30 dni aktywności zdrowotnej" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 100, description: "Zaloguj 100 dni aktywności zdrowotnej" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 365, description: "Zaloguj 365 dni – cały rok dbania o siebie!" },
    ],
  },

  // ─── ⏱ PRACA ─────────────────────────────────────────────
  {
    id: "overtime_hours",
    name: "Nadgodzinowicz",
    description: "Łączna liczba przepracowanych nadgodzin",
    category: "Praca",
    categoryIcon: "⏱️",
    icon: "⚡",
    unit: "h",
    formatValue: (v) => v.toLocaleString("pl-PL", { maximumFractionDigits: 1 }) + " h",
    prerequisiteId: "discover_workschedule",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 5,   description: "Przepracuj 5 godzin nadliczbowych" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 20,  description: "Przepracuj 20 godzin nadliczbowych" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 50,  description: "Przepracuj 50 godzin nadliczbowych" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 100, description: "Przepracuj 100 godzin nadliczbowych" },
    ],
  },

  // ─── 🚗 GARAŻ ────────────────────────────────────────────
  {
    id: "car_events",
    name: "Mechanik",
    description: "Łączna liczba zarejestrowanych serwisów i zdarzeń samochodowych",
    category: "Garaż",
    categoryIcon: "🚗",
    icon: "🔧",
    unit: "serwisów",
    formatValue: (v) => v + " serwisów",
    prerequisiteId: "discover_garage",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 1,  description: "Dodaj pierwszy wpis serwisowy" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 5,  description: "Dodaj 5 wpisów serwisowych" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 10, description: "Dodaj 10 wpisów serwisowych" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 20, description: "Dodaj 20 wpisów serwisowych" },
    ],
  },

  // ─── 📁 ORGANIZACJA ──────────────────────────────────────
  {
    id: "drawer_items",
    name: "Archiwista",
    description: "Liczba dokumentów w cyfrowej szufladzie",
    category: "Organizacja",
    categoryIcon: "📁",
    icon: "📂",
    unit: "dokumentów",
    formatValue: (v) => v + " dokumentów",
    prerequisiteId: "discover_drawer",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 1,  description: "Dodaj pierwszy dokument do szuflady" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 5,  description: "Dodaj 5 dokumentów do szuflady" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 10, description: "Dodaj 10 dokumentów do szuflady" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 25, description: "Dodaj 25 dokumentów – wzorowy archiwista!" },
    ],
  },

  // ─── 📆 NAWYKI ───────────────────────────────────────────
  {
    id: "login_streak",
    name: "Złoty Człowiek",
    description: "Loguj się codziennie i buduj serię – bez jednego dnia przerwy!",
    category: "Nawyki",
    categoryIcon: "📆",
    icon: "☀️",
    unit: "dni z rzędu",
    formatValue: (v) => v + " dni z rzędu",
    tiers: [
      { level: 1, label: "Brąz",    emoji: "🥉", threshold: 3,   description: "3 dni z rzędu – dobry początek!" },
      { level: 2, label: "Srebro",  emoji: "🥈", threshold: 7,   description: "7 dni z rzędu – cały tydzień!" },
      { level: 3, label: "Złoto",   emoji: "🥇", threshold: 30,  description: "30 dni z rzędu – cały miesiąc konsekwencji!" },
      { level: 4, label: "Platyna", emoji: "💎", threshold: 100, description: "100 dni z rzędu – prawdziwy Złoty Człowiek!" },
    ],
  },
];

// ── Mapowanie id → wartość ─────────────────────────────────
function getValue(def: AchievementDef, data: AchievementData): number {
  const disc = (page: string) => data.discoveredPages.includes(page) ? 1 : 0;

  switch (def.id) {
    // ── Odkrywca ──
    case "discover_calendar":    return disc("calendar");
    case "discover_savings":     return disc("savings");
    case "discover_planner":     return disc("planner");
    case "discover_analysis":    return disc("analysis");
    case "discover_workschedule":return disc("work-schedule");
    case "discover_health":      return ["health/daily", "health/body", "health/energy"].filter(p => data.discoveredPages.includes(p)).length;
    case "discover_garage":      return disc("garage");
    case "discover_drawer":      return disc("drawer");
    // ── Pozostałe ──
    case "savings_balance":        return data.totalSavingsBalance;
    case "pan_miedzy_narodowy":    return data.foreignCurrencyAccountsCount;
    case "pan_oszczedzajacy":      return data.largestForeignCurrencyBalance;
    case "imported_transactions":  return data.importedTransactions;
    case "salary_incomes":         return data.salaryIncomesCount;
    case "recurring_count":        return data.activeRecurringCount;
    case "loan_paid":              return data.bestLoanPaidPercent;
    case "categories_used":        return data.expenseCategoriesCount;
    case "health_days":            return data.healthDaysCount;
    case "overtime_hours":         return data.totalOvertimeHours;
    case "car_events":             return data.carEventsCount;
    case "drawer_items":           return data.drawerItemsCount;
    case "login_streak":           return data.loginStreak;
    default:                       return 0;
  }
}

// ── Obliczanie wyników ─────────────────────────────────────
export function computeAchievements(data: AchievementData): AchievementResult[] {
  // Pierwsza pętla – podstawowe wyniki
  const base = ACHIEVEMENTS.map((def) => {
    const currentValue = getValue(def, data);
    let unlockedTier: 0 | 1 | 2 | 3 | 4 = 0;
    for (const tier of def.tiers) {
      if (currentValue >= tier.threshold) unlockedTier = tier.level;
    }
    const nextTier = def.tiers.find((t) => t.level > unlockedTier) ?? null;
    const prevTier = unlockedTier > 0 ? def.tiers.find((t) => t.level === unlockedTier) : null;
    const prevThreshold = prevTier?.threshold ?? 0;
    let progressToNext = 100;
    if (nextTier) {
      const range = nextTier.threshold - prevThreshold;
      progressToNext = Math.min(100, Math.max(0, ((currentValue - prevThreshold) / range) * 100));
    }
    // Waluta do wyświetlenia wartości (dla osiągnięć kwotowych)
    const displayCurrency =
      def.id === "savings_balance" ? data.mainCurrency :
      def.id === "pan_oszczedzajacy" ? data.largestForeignCurrency :
      undefined;
    return { ...def, currentValue, unlockedTier, nextTier, progressToNext, prevThreshold, isPrerequisiteMet: true, displayCurrency };
  });

  // Mapa dla sprawdzania prerequisite
  const byId = new Map(base.map((r) => [r.id, r]));

  // Druga pętla – dopisz isPrerequisiteMet
  return base.map((r) => ({
    ...r,
    isPrerequisiteMet: !r.prerequisiteId || (byId.get(r.prerequisiteId)?.unlockedTier ?? 0) >= 1,
  }));
}

// ── Style wizualne tierów ──────────────────────────────────
export const TIER_STYLES = {
  1: { label: "Brąz",    gradient: "from-amber-600 to-amber-400",   ring: "ring-amber-500/50",   badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",    glow: "shadow-amber-500/25" },
  2: { label: "Srebro",  gradient: "from-zinc-400 to-zinc-300",     ring: "ring-zinc-400/50",    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",       glow: "shadow-zinc-400/25" },
  3: { label: "Złoto",   gradient: "from-yellow-500 to-amber-300",  ring: "ring-yellow-400/50",  badge: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300", glow: "shadow-yellow-400/25" },
  4: { label: "Platyna", gradient: "from-purple-500 to-indigo-400", ring: "ring-purple-400/50",  badge: "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300", glow: "shadow-purple-400/25" },
} as const;
