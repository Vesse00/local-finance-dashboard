<div align="center">
  <h1 align="center">MeBase.</h1>
  <p align="center">
    <strong>Your private life operating system. Offline by default.</strong>
  </p>
  <p align="center">
    <a href="#vision">Vision</a> •
    <a href="#features">Features</a> •
    <a href="#roadmap">Roadmap</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

---

## 👁️ Vision

In an era of endless subscriptions and cloud services analyzing your every move, **MeBase** takes a fundamentally different path. It's a modular, personal "Life OS" where **You** retain 100% control over your data. No hidden servers, no telemetry, no tracking. Your finances, health metrics, and daily routines stay exactly where they belong — on your device.

Pay once. Use forever.

## ✨ Core Modules & Features

MeBase is designed as a collection of deeply integrated, highly specialized modules. Everything is interconnected yet neatly organized.

### 💳 Finance Node
- **Expense & Income Tracking:** Log transactions manually or bulk-import. Use custom tags for granular categorization.
- **Subscription Manager:** Never miss a renewal date. Track monthly/yearly recurring costs and identify unused services.
- **Budgeting Engine:** Set strict limits for specific categories and visualize your monthly "burn rate" in real-time.
- **Advanced Analytics:** Interactive charts displaying your cash flow, net worth progression, and historical spending habits.

### 🧬 Health & Productivity
- **Biometrics Dashboard:** Track weight, daily energy levels, sleep duration, and overall mood.
- **Habit Matrix:** Build routines with streak tracking and visual heatmaps (GitHub-style contribution graphs).
- **Time Allocation:** Log deep work sessions, track overtime, and calculate your true hourly yield.
- **Encrypted Journal:** A private, distraction-free space for daily reflections and notes, secured locally.

### 🚗 Garage & Assets
- **Maintenance Timeline:** A complete service history with mileage logs and attached invoices/receipts.
- **Cost-per-Distance Analysis:** Automatically calculate how much your vehicle actually costs to run per km/mile.
- **Document Vault:** Keep your insurance policies, registration details, and upcoming inspection dates in one quick-access tab.

### 🛡️ System & Privacy (The Core)
- **100% Local-First:** Powered by a local SQLite database. Zero cloud latency, zero external API dependencies.
- **Data Portability:** Your data is strictly yours. Prevent vendor lock-in with one-click full exports to CSV and JSON.
- **Bento-style Dashboard:** A highly customizable, beautiful home screen showing vital statistics from all modules at a single glance.

## 🗺️ Roadmap

MeBase is in active development. Our roadmap to building a complete, local-first ecosystem:

- [x] **Phase 1: Web App (Current)**
  - Building the system core.
  - Designing initial modules (Finance, Health, Garage).
  - UI/UX refinement (Smooth animations, minimalist design, Neumorphism/Soft 3D effects).
- [ ] **Phase 2: Standalone Desktop App (Coming Soon)**
  - Migrating the web app to a native desktop application (Windows / macOS).
  - Implementation of a local database (SQLite) for a true Local-First experience.
- [ ] **Phase 3: Mobile Companion**
  - Mobile application (iOS / Android) for quick data entry on the go.
  - Secure, fully encrypted End-to-End synchronization between your PC and phone (e.g., via local Wi-Fi network).

## 🛠️ Tech Stack

Built with cutting-edge technologies to ensure top performance and a stunning, premium look:

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Style: Radix Nova / Lucide Icons)
- **Database ORM:** [Prisma](https://www.prisma.io/) (Targeting SQLite for Local-First)

## 🚀 Getting Started (For Developers)

If you want to run the current Web version locally on your machine:

### Prerequisites
- Node.js 18+
- npm / pnpm / yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/mebase.git
```

2. Navigate to the project directory:
```bash
cd mebase
```

3. Install dependencies:
```bash
npm install
```

4. Set up the database (copy `.env.example` to `.env` and generate the Prisma client):
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Production Deploy (Docker)

For a production deployment with a single Docker command:

1. Copy `.env.docker.example` to `.env.docker` and fill in your real domain and secrets.
2. Create the persistent folders:

```bash
mkdir -p data public/uploads
```

3. Build and start the services:

```bash
docker compose --env-file .env.docker up -d --build
```

The production image uses a multi-stage build:
- build stage installs dev dependencies and generates Prisma client,
- runtime stage installs production dependencies only,
- SQLite data is persisted in `./data/dev.db`,
- uploads are persisted in `./public/uploads`.

To update after pulling changes:

```bash
docker compose --env-file .env.docker up -d --build
```

---

<div align="center">
  <sub>Designed with a passion for privacy. MeBase © 2026</sub>
</div>
