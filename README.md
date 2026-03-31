<div align="center">
  <h1 align="center">MeBase.</h1>
  <p align="center">
    <strong>Twój prywatny system operacyjny do życia. Offline by default.</strong>
  </p>
  <p align="center">
    <a href="#vision">Wizja</a> •
    <a href="#features">Funkcje</a> •
    <a href="#roadmap">Roadmapa</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Instalacja</a>
  </p>
</div>

---

## 👁️ Wizja (The Vision)

W erze subskrypcji i chmur danych, które analizują każdy Twój ruch, **MeBase** obiera inną drogę. To modułowy, osobisty "Life OS" (System Operacyjny Życia), w którym to **Ty** masz 100% kontroli nad swoimi danymi. Żadnych ukrytych serwerów, żadnego przesyłania telemetrii. Twoje finanse, zdrowie i codzienne obowiązki zostają tam, gdzie ich miejsce – na Twoim urządzeniu.

Płacisz raz. Używasz zawsze.

## ✨ Główne Moduły

MeBase dzieli Twoje życie na inteligentne, zaszyfrowane środowiska (moduły):

- 💳 **Finanse:** Śledzenie budżetu, kategoryzacja wydatków, cele oszczędnościowe i analiza kosztów.
- 🧬 **Zdrowie & Czas:** Monitorowanie poziomu energii, snu, wagi oraz ewidencja nadgodzin. Poznaj swoje limity.
- 🚗 **Garaż:** Pełna ewidencja pojazdu – od raportów spalania po przypomnienia o ubezpieczeniu i przeglądach.

*(Kolejne moduły w przygotowaniu)*

## 🗺️ Roadmapa (Fazy Projektu)

MeBase jest obecnie w aktywnej fazie rozwoju. Nasz plan przejścia do pełnego ekosystemu:

- [x] **Faza 1: Web App (Obecnie)**
  - Budowa rdzenia systemu (System Core).
  - Zaprojektowanie modułów (Finanse, Zdrowie, Garaż).
  - Dopracowanie UI/UX (Aksamitne animacje, minimalistyczny design, efekt Neumorphism/3D).
- [ ] **Faza 2: Standalone Desktop App (Wkrótce)**
  - Migracja aplikacji webowej do natywnej aplikacji desktopowej (Windows / macOS).
  - Wdrożenie lokalnej bazy danych (SQLite) – prawdziwy Local-First.
- [ ] **Faza 3: Mobile Companion**
  - Aplikacja mobilna (iOS / Android) do szybkiego wprowadzania danych "w biegu".
  - Bezpieczna, w pełni szyfrowana synchronizacja (End-to-End) między PC a telefonem (np. via lokalna sieć Wi-Fi).

## 🛠️ Tech Stack

Aplikacja jest budowana z wykorzystaniem najnowszych, wiodących technologii, aby zapewnić najwyższą wydajność i niesamowity wygląd:

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animacje:** [Framer Motion](https://www.framer.com/motion/)
- **Komponenty UI:** [shadcn/ui](https://ui.shadcn.com/) (Styl: Radix Nova / Lucide Icons)
- **Baza danych:** [Prisma](https://www.prisma.io/) (docelowo SQLite dla Local-First)

## 🚀 Getting Started (Dla developerów)

Jeśli chcesz uruchomić obecną wersję Web lokalnie na swoim komputerze:

### Wymagania
- Node.js 18+
- npm / pnpm / yarn

### Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/TWOJA_NAZWA/mebase.git
```

2. Wejdź do folderu projektu:
```bash
cd mebase
```

3. Zainstaluj zależności:
```bash
npm install
```

4. Skonfiguruj bazę danych (skopiuj `.env.example` do `.env` i wygeneruj klienta Prisma):
```bash
npx prisma generate
npx prisma db push
```

5. Uruchom serwer deweloperski:
```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000).

---

<div align="center">
  <sub>Zaprojektowane z pasją do prywatności. MeBase © 2026</sub>
</div>
