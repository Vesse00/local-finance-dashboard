/**
 * Reguły automatycznego przypisywania kategorii podczas importu wyciągu.
 * Kolejność ma znaczenie – pierwsza pasująca reguła wygrywa.
 * Matching odbywa się po: Odbiorca + Opis + Typ transakcji (case-insensitive).
 */
export const categoryRules: {
  name: string;
  icon: string;
  /** Słowa kluczowe dopasowywane jako regex OR (case-insensitive) */
  keywords: string[];
  /** Opcjonalne: dodatkowy priorytet – wyższy = sprawdzany wcześniej (domyślnie 0) */
  priority?: number;
}[] = [
  // ── OPŁATY CYKLICZNE / RACHUNKI ─────────────────────────────────────────
  {
    name: "Rachunki",
    icon: "🔌",
    priority: 10,
    keywords: [
      "pge ", "enea", "tauron", "energa", "innogy", "e\\.on",
      "pgnig", "fortum", "kalchem", "veolia",
      "aquanet", "mwik", "mpwik", "miejskie wodociągi", "wodociągi",
      "polsat cyfrowy", "nc\\+", "canal\\+", "aster", "multimedia",
      "orange", "play ", "t-mobile", "plus gsm", "plus internet", "inea",
      "upc ", "vectra", "netia",
      "czynsz", "administracja", "wspólnota", "spółdzielnia", "eksploatacja budynku",
      "mieszkanie", "najem", "czynsz najmu",
      "prąd", "gaz ", "woda ", "ogrzewanie", "ciepło",
    ],
  },

  // ── SUBSKRYPCJE CYFROWE ──────────────────────────────────────────────────
  {
    name: "Subskrypcje",
    icon: "📱",
    priority: 9,
    keywords: [
      "netflix", "spotify", "apple\\.com", "apple one", "itunes",
      "hbo max", "max\\.com", "disney\\+", "disney plus", "paramount",
      "youtube premium", "google one", "google play", "google storage",
      "amazon prime", "amazon\\.com", "audible",
      "steam ", "epic games", "playstation", "xbox game pass", "microsoft 365",
      "adobe", "canva", "notion", "dropbox", "chatgpt", "openai",
      "tidal", "deezer", "empik go", "storytel",
      "allegro smart", "allegro subscription",
      "crunchyroll", "twitch",
    ],
  },

  // ── JEDZENIE: RESTAURACJE / FAST FOOD ───────────────────────────────────
  {
    name: "Restauracje",
    icon: "🍽️",
    priority: 8,
    keywords: [
      "mcdonald", "mc donald", "burger king", "kfc ", "pizza hut",
      "domino", "telepizza", "papa john",
      "subway ", "taco bell", "five guys",
      "kebab", "sushi", "pizzeria", "restauracja", "bistro", "bar ",
      "pyszne\\.pl", "glovo", "wolt", "uber eats", "takeaway",
      "starbucks", "costa coffee", "coffeeheaven", "green caffè",
      "café ", "kawiarnia", "cukiernia", "lody ", "ice cream",
      "sandra nescafe", "nescafe pol", "automat vendingowy", "automat spec", "vending",
      "smaczny", "dobra kuchnia",
    ],
  },

  // ── JEDZENIE: SKLEPY SPOŻYWCZE ───────────────────────────────────────────
  {
    name: "Zakupy spożywcze",
    icon: "🛒",
    priority: 7,
    keywords: [
      "biedronka", "biedro", "lidl", "żabka", "zabka", "kaufland",
      "auchan", "dino ", "stokrotka", "carrefour", "tesco",
      "polo market", "spar ", "netto ", "aldi",
      "delikatesy", "lewiatan", "groszek", "odido",
      "intermarche", "intermarcheé", "eurospar",
      "makro", "selgros", "hurtownia",
      "sklep spożywczy", "spożywcze",
      "fresh market", "frisco\\.pl", "barbora",
    ],
  },

  // ── TRANSPORT / PALIWO ──────────────────────────────────────────────────
  {
    name: "Transport",
    icon: "🚗",
    priority: 7,
    keywords: [
      "orlen", "bp ", "shell ", "circle k", "lotos", "statoil",
      "bliska", "amic energy", "moya stacja",
      "mzk ", "mpk ", "ztm ", "mkm ", "zkt ",
      "pkp intercity", "pkp ic", "flixbus", "polskibus", "neobus",
      "uber ", "bolt ", "free now", "mytaxi",
      "blablacar",
      "parkomat", "parkme", "inpark", "mobiparking", "sppn",
      "autostrada", "myviaToll", "etoll", "viapol",
      "leasing ", "toyota financial", "volkswagen financial", "bmw financial",
      "przejazd", "bilet", "mandat",
    ],
  },

  // ── ZDROWIE I URODA ──────────────────────────────────────────────────────
  {
    name: "Zdrowie i Uroda",
    icon: "💊",
    priority: 7,
    keywords: [
      "rossmann", "hebe ", "doz\\.pl", "apteka", "super-pharm", "superpharm",
      "gemini", "dbam o zdrowie", "ziko apteka", "lecznica", "klinika",
      "przychodnia", "gabinet", "stomatolog", "dentysta", "ortodonta",
      "fizjoterapeuta", "rehabilitacja", "psycholog", "psychiatra",
      "szpital", "pogotowie", "laboratorium", "analityka",
      "siłownia", "fitclub", "fit curve", "gym", "fitness", "sport club",
      "zdrowit", "medicover", "lux med", "luxmed", "enel-med", "cm lim",
      "nfz ", "składka zdrowotna",
    ],
  },

  // ── ODZIEŻ I OBUWIE ──────────────────────────────────────────────────────
  {
    name: "Odzież",
    icon: "👕",
    priority: 6,
    keywords: [
      "zara ", "h&m", "reserved", "mohito", "house ", "sinsay",
      "cropp ", "stradivarius", "pull&bear", "bershka", "mango ",
      "ck ", "calvin klein", "tommy hilfiger", "hugo boss", "guess ",
      "nike ", "adidas ", "reebok", "puma ", "new balance",
      "eobuwie", "ccc ", "deichmann", "ecco ", "geox ",
      "decathlon", "sportmaster", "martes sport",
      "vinted", "szafa\\.pl",
      "odzież", "ubrania", "buty ",
    ],
  },

  // ── ELEKTRONIKA / KOMPUTERY ──────────────────────────────────────────────
  {
    name: "Elektronika",
    icon: "💻",
    priority: 6,
    keywords: [
      "rtv euro agd", "media expert", "media markt", "saturn ",
      "neonet", "ole ole", "x-kom", "morele",
      "apple store", "ispot", "premium reseller",
      "komputronik", "abc data", "action ",
      "allegro", "ceneo", "olx ",
      "samsung", "lenovo", "dell ", "hp ", "asus ", "acer ",
    ],
  },

  // ── ZAKUPY ONLINE (ogólne) ───────────────────────────────────────────────
  {
    name: "Zakupy online",
    icon: "📦",
    priority: 5,
    keywords: [
      "amazon\\.de", "amazon\\.co", "aliexpress", "alibaba", "wish\\.com",
      "shein", "temu ", "zalando", "answear", "modivo",
      "empik\\.com", "empik online",
      "przesyłka", "kurier", "dhl ", "dpd ", "inpost", "poczta polska",
    ],
  },

  // ── DOM I OGRÓD ──────────────────────────────────────────────────────────
  {
    name: "Dom i Ogród",
    icon: "🏡",
    priority: 5,
    keywords: [
      "obi ", "castorama", "leroy merlin", "bricomarche", "psb mrówka", "psb mrowka", "psb ", "mrówka budowlana", "mrowka", "mrówka",
      "ikea ", "jysk", "home&you", "homla", "agata meble", "bodzio",
      "pepco ", "action ", "dealz",
      "stelmet", "ogrod",
    ],
  },

  // ── EDUKACJA ─────────────────────────────────────────────────────────────
  {
    name: "Edukacja",
    icon: "📚",
    priority: 5,
    keywords: [
      "udemy", "coursera", "skillshare", "duolingo",
      "szkoła", "uczelnia", "kurs ", "szkolenie", "studia",
      "czesne", "wpisowe",
      "trzynastka", "13ka",
      "empik ksiąg", "libristo", "publio",
      "github", "gitlab", "jetbrains",
      "codeacademy", "pluralsight", "datacamp",
    ],
  },

  // ── FINANSE / UBEZPIECZENIA ───────────────────────────────────────────────
  {
    name: "Finanse i ubezpieczenia",
    icon: "🏦",
    priority: 5,
    keywords: [
      "pzu ", "warta ", "allianz", "ergo hestia", "uniqa",
      "aviva", "generali", "link4", "proama", "gothaer",
      "mtu24", "oc polisa", "ac polisa",
      "xtb ", "bossa", "dif broker", "exante",
      "pkobp", "pko bp", "santander", "mbank", "bnp paribas",
      "ing bank", "alior", "millennium", "pekao",
      "prowizja bankowa", "opłata za kartę", "opłata bankowa",
      "kredyt", "rata kredytu", "hipoteka", "pożyczka",
    ],
  },

  // ── ROZRYWKA / HOBBY ─────────────────────────────────────────────────────
  {
    name: "Rozrywka",
    icon: "🎬",
    priority: 4,
    keywords: [
      "cinema city", "helios", "multikino", "kinoteka",
      "teatr", "opera", "filharmonia", "muzeum", "galeria",
      "eventim", "ticketmaster", "going\\.pl", "biletomat",
      "escape room", "bowling", "kręgielnia", "bilard",
      "zoo ", "aquapark", "wesołe miasteczko",
      "gra ", "zabawki", "lego ",
    ],
  },

  // ── PODRÓŻE ──────────────────────────────────────────────────────────────
  {
    name: "Podróże",
    icon: "✈️",
    priority: 4,
    keywords: [
      "ryanair", "wizz air", "wizzair", "lot ", "lufthansa", "easyjet",
      "booking\\.com", "airbnb", "trivago", "hotels\\.com", "agoda",
      "hotel ", "hostel", "apartament wakacyjny",
      "noclegi", "nocleg",
      "rentalcars", "sixt ", "hertz", "avis ",
      "wczasy", "wakacje", "urlop", "biuro podróży", "itaka", "exim",
    ],
  },

  // ── BLIK / PRZELEWY OSOBISTE ─────────────────────────────────────────────
  {
    name: "Przelewy osobiste",
    icon: "📲",
    priority: 11,
    keywords: [
      "przelew na telefon",
      "transakcja blik",
      "p\u0142atno\u015b\u0107 blik",
      "blik ",
    ],
  },

  // ── WYPŁATA ATM ──────────────────────────────────────────────────────────
  {
    name: "Wypłata gotówki",
    icon: "💵",
    priority: 9,
    keywords: [
      "wypłata w bankomacie", "wypłata bankomat", "atm ",
      "wypłata gotówki", "cash withdrawal",
    ],
  },
];
