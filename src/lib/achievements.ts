// ============================================================
// SYSTEM OSIĄGNIĘĆ – definicje i logika obliczania
// ============================================================

export interface AchievementTierDef {
  level: 1 | 2 | 3 | 4;
  label: string;      // "Brąz", "Srebro", "Złoto", "Platyna"
  emoji: string;      // medal emoji
  threshold: number;  // wymagana wartość do odblokowania
  description: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryIcon: string;
  icon: string;       // emoji reprezentujące osiągnięcie
  unit: string;       // "PLN", "dni", "serwisów", "h" – używane w opisie postępu
  formatValue?: (v: number) => string; // opcjonalne formatowanie wartości
  tiers: AchievementTierDef[];
}

export interface AchievementResult extends AchievementDef {
  currentValue: number;
  unlockedTier: 0 | 1 | 2 | 3 | 4; // 0 = nic nie odblokowane
  nextTier: AchievementTierDef | null;
  progressToNext: number; // 0–100
  prevThreshold: number;  // próg poprzedniego tiera (dla paska postępu)
}

// ── Dane wejściowe obliczania ─────────────────────────────────
export interface AchievementData {
  totalSavingsBalance: number;       // suma sald SavingsAccount
  importedTransactions: number;      // count Expense z bankTxHash
  activeRecurringCount: number;      // count RecurringPayment isActive
  bestLoanPaidPercent: number;       // najlepszy % spłaconego kredytu (0–100)
  healthDaysCount: number;           // count HealthDay
  totalOvertimeHours: number;        // suma WorkDay.overtimeHours
  carEventsCount: number;            // count CarEvent
  drawerItemsCount: number;          // count DrawerItem
  expenseCategoriesCount: number;    // liczba unikalnych kategorii użytych w wydatkach
  incomesCount: number;              // count Income
}

// ── Definicje osiągnięć ───────────────────────────────────────
export const ACHIEVEMENTS: AchievementDef[] = [
  // ─── 💰 OSZCZĘDNOŚCI ─────────────────────────────────────────
  {
    id: "savings_balance",
    name: "Skarbonka",
    description: "Łączna kwota na kontach oszczędnościowych",
    category: "Oszczędności",
    categoryIcon: "💰",
    icon: "🐷",
    unit: "PLN",
    formatValue: (v) => v.toLocaleString("pl-PL", { maximumFractionDigits: 0 }) + " PLN",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 1_000,   description: "Zaoszczędź 1 000 PLN" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 10_000,  description: "Zaoszczędź 10 000 PLN" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 50_000,  description: "Zaoszczędź 50 000 PLN" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 100_000, description: "Zaoszczędź 100 000 PLN" },
    ],
  },

  // ─── 📊 TRANSAKCJE ───────────────────────────────────────────
  {
    id: "imported_transactions",
    name: "Kronikarz",
    description: "Łączna liczba zaimportowanych transakcji bankowych",
    category: "Transakcje",
    categoryIcon: "📊",
    icon: "🗂️",
    unit: "transakcji",
    formatValue: (v) => v.toLocaleString("pl-PL") + " transakcji",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 50,   description: "Zaimportuj 50 transakcji" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 200,  description: "Zaimportuj 200 transakcji" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 500,  description: "Zaimportuj 500 transakcji" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 1000, description: "Zaimportuj 1 000 transakcji" },
    ],
  },
  {
    id: "incomes_count",
    name: "Zarabiający",
    description: "Łączna liczba zarejestrowanych przychodów",
    category: "Transakcje",
    categoryIcon: "📊",
    icon: "💵",
    unit: "przychodów",
    formatValue: (v) => v.toLocaleString("pl-PL") + " przychodów",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 5,   description: "Zarejestruj 5 przychodów" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 20,  description: "Zarejestruj 20 przychodów" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 50,  description: "Zarejestruj 50 przychodów" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 120, description: "Zarejestruj 120 przychodów (10 lat)" },
    ],
  },

  // ─── 🔄 SYSTEMATYCZNOŚĆ ──────────────────────────────────────
  {
    id: "recurring_count",
    name: "Metodyczny",
    description: "Liczba aktywnych zleceń stałych i rat",
    category: "Systematyczność",
    categoryIcon: "🔄",
    icon: "📅",
    unit: "zleceń",
    formatValue: (v) => v + " zleceń",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 1,  description: "Dodaj 1 zlecenie stałe" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 3,  description: "Dodaj 3 zlecenia stałe" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 5,  description: "Dodaj 5 zleceń stałych" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 10, description: "Dodaj 10 zleceń stałych" },
    ],
  },
  {
    id: "loan_paid",
    name: "Spłacający",
    description: "Procent spłaconego kredytu (najlepszy wynik spośród wszystkich kredytów)",
    category: "Systematyczność",
    categoryIcon: "🔄",
    icon: "🏦",
    unit: "%",
    formatValue: (v) => Math.round(v) + "% spłacono",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 25,  description: "Spłać 25% kredytu" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 50,  description: "Spłać 50% kredytu" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 75,  description: "Spłać 75% kredytu" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 100, description: "Spłać kredyt w całości!" },
    ],
  },
  {
    id: "categories_used",
    name: "Analityk",
    description: "Liczba różnych kategorii wydatków, których używasz",
    category: "Systematyczność",
    categoryIcon: "🔄",
    icon: "📈",
    unit: "kategorii",
    formatValue: (v) => v + " kategorii",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 3,  description: "Użyj 3 różnych kategorii" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 6,  description: "Użyj 6 różnych kategorii" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 10, description: "Użyj 10 różnych kategorii" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 15, description: "Użyj 15 różnych kategorii" },
    ],
  },

  // ─── 💪 ZDROWIE ──────────────────────────────────────────────
  {
    id: "health_days",
    name: "Zdrowy Start",
    description: "Liczba dni z wpisem zdrowotnym",
    category: "Zdrowie",
    categoryIcon: "💪",
    icon: "🏃",
    unit: "dni",
    formatValue: (v) => v + " dni",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 7,   description: "Zaloguj 7 dni zdrowia" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 30,  description: "Zaloguj 30 dni zdrowia" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 100, description: "Zaloguj 100 dni zdrowia" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 365, description: "Zaloguj 365 dni zdrowia" },
    ],
  },

  // ─── ⏱ PRACA ─────────────────────────────────────────────────
  {
    id: "overtime_hours",
    name: "Nadgodzinowicz",
    description: "Łączna liczba przepracowanych nadgodzin",
    category: "Praca",
    categoryIcon: "⏱️",
    icon: "⚡",
    unit: "h",
    formatValue: (v) => v.toLocaleString("pl-PL", { maximumFractionDigits: 1 }) + " h",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 5,   description: "Przepracuj 5 nadgodzin" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 20,  description: "Przepracuj 20 nadgodzin" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 50,  description: "Przepracuj 50 nadgodzin" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 100, description: "Przepracuj 100 nadgodzin" },
    ],
  },

  // ─── 🚗 GARAŻ ────────────────────────────────────────────────
  {
    id: "car_events",
    name: "Mechanik",
    description: "Łączna liczba zarejestrowanych serwisów i zdarzeń samochodowych",
    category: "Garaż",
    categoryIcon: "🚗",
    icon: "🔧",
    unit: "serwisów",
    formatValue: (v) => v + " serwisów",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 1,  description: "Dodaj pierwszy serwis" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 5,  description: "Dodaj 5 wpisów serwisowych" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 10, description: "Dodaj 10 wpisów serwisowych" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 20, description: "Dodaj 20 wpisów serwisowych" },
    ],
  },

  // ─── 📁 ORGANIZACJA ──────────────────────────────────────────
  {
    id: "drawer_items",
    name: "Archiwista",
    description: "Liczba dokumentów w cyfrowej szufladzie",
    category: "Organizacja",
    categoryIcon: "📁",
    icon: "📂",
    unit: "dokumentów",
    formatValue: (v) => v + " dokumentów",
    tiers: [
      { level: 1, label: "Brąz",   emoji: "🥉", threshold: 1,  description: "Dodaj pierwszy dokument" },
      { level: 2, label: "Srebro", emoji: "🥈", threshold: 5,  description: "Dodaj 5 dokumentów" },
      { level: 3, label: "Złoto",  emoji: "🥇", threshold: 10, description: "Dodaj 10 dokumentów" },
      { level: 4, label: "Platyna",emoji: "💎", threshold: 25, description: "Dodaj 25 dokumentów" },
    ],
  },
];

// ── Obliczanie wyników ────────────────────────────────────────
function getValueForAchievement(def: AchievementDef, data: AchievementData): number {
  switch (def.id) {
    case "savings_balance":        return data.totalSavingsBalance;
    case "imported_transactions":  return data.importedTransactions;
    case "incomes_count":          return data.incomesCount;
    case "recurring_count":        return data.activeRecurringCount;
    case "loan_paid":              return data.bestLoanPaidPercent;
    case "categories_used":        return data.expenseCategoriesCount;
    case "health_days":            return data.healthDaysCount;
    case "overtime_hours":         return data.totalOvertimeHours;
    case "car_events":             return data.carEventsCount;
    case "drawer_items":           return data.drawerItemsCount;
    default:                       return 0;
  }
}

export function computeAchievements(data: AchievementData): AchievementResult[] {
  return ACHIEVEMENTS.map((def) => {
    const currentValue = getValueForAchievement(def, data);

    // Znajdź najwyższy odblokowany tier
    let unlockedTier: 0 | 1 | 2 | 3 | 4 = 0;
    for (const tier of def.tiers) {
      if (currentValue >= tier.threshold) {
        unlockedTier = tier.level;
      }
    }

    // Następny tier do odblokowania
    const nextTier = def.tiers.find((t) => t.level > unlockedTier) ?? null;

    // Próg poprzedniego tiera (punkt startowy paska postępu)
    const prevTier = unlockedTier > 0 ? def.tiers.find((t) => t.level === unlockedTier) : null;
    const prevThreshold = prevTier?.threshold ?? 0;

    // Procent postępu do następnego tiera
    let progressToNext = 0;
    if (nextTier) {
      const range = nextTier.threshold - prevThreshold;
      const done  = currentValue - prevThreshold;
      progressToNext = Math.min(100, Math.max(0, (done / range) * 100));
    } else {
      progressToNext = 100; // Wszystkie tiery odblokowane
    }

    return {
      ...def,
      currentValue,
      unlockedTier,
      nextTier,
      progressToNext,
      prevThreshold,
    };
  });
}

// ── Konfiguracja wizualna tierów ─────────────────────────────
export const TIER_STYLES = {
  1: { label: "Brąz",   gradient: "from-amber-600 to-amber-400",   ring: "ring-amber-500/60",   badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300", glow: "shadow-amber-500/30" },
  2: { label: "Srebro", gradient: "from-zinc-400 to-zinc-300",     ring: "ring-zinc-400/60",    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",    glow: "shadow-zinc-400/30" },
  3: { label: "Złoto",  gradient: "from-yellow-500 to-amber-300",  ring: "ring-yellow-400/60",  badge: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300", glow: "shadow-yellow-400/30" },
  4: { label: "Platyna",gradient: "from-purple-500 to-indigo-400", ring: "ring-purple-400/60",  badge: "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300", glow: "shadow-purple-400/30" },
} as const;
