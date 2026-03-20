# 🔋 Personal Resource & Finance Nexus

A high-performance, local-first dashboard designed to treat your life like a managed system. This isn't just a spreadsheet; it's a correlation engine that bridges the gap between your bank account, your physical health, and your mental energy.

---

## 🧠 The Concept: Why This Exists

Most tools separate finance from health. This dashboard operates on the philosophy that **everything is connected**. 
* If your **Energy Level** is low, your **Emotional Spending** usually goes up.
* If your **Vehicle** isn't maintained, your **Financial Stress** increases.
* If your **Work Schedule** is overloaded, your **Health Metrics** drop.

This project provides a centralized "Cockpit" to monitor these feedback loops in real-time.

---

## 🛠 Functional Modules

### 1. The Finance Engine
Beyond simple logging, the finance module categorizes your life into **Needs, Wants, and Savings**. 
* **Dynamic Analysis:** Uses Recharts to visualize spending trends.
* **The "Drawer" System:** A unique approach to managing "Szuflada" (Drawer) or "Abonament" (Subscription) costs, ensuring small recurring leaks are visible.
* **Savings Architecture:** Supports internal transfers between accounts to track goal progression without losing sight of total liquidity.

### 2. The "Life Battery" (Energy Tracking)
The standout feature of this system. Instead of a vague "how do you feel?", it uses a **0-100% Battery Model**.
* **The Dual-Track System:** Users can break down their day into **Work Energy** (productivity/stress) and **Free Time Energy** (recovery).
* **Visual Cues:** Uses a custom-built emoji-based slider that changes state (🛑, 🪫, 🔋, ⚡) based on physiological "charge."
* **Correlational Logic:** The system analyzes if "Low Battery" days lead to higher impulsive spending, providing a "Burnout Warning."

### 3. The Daily Briefing AI
The central intelligence hub of the application. 
* **State-Aware UI:** The dashboard changes based on the time of day. 
* **Evening Check-ins:** The "Energy Prompt" is programmed to remain hidden during productive hours and only emerge after 6:00 PM to encourage reflection.
* **Insight Generation:** Aggregates data from all modules to give you a "Status Report" on your life.

### 4. Vehicle Maintenance (Garage)
A dedicated module for tracking the "Health" of your hardware. It logs service events and costs, integrating vehicle upkeep into your total financial footprint.

---

## 🏗 How It Works: Technical Architecture

The application is built on the **Bleeding Edge** of the React ecosystem:

### The Stack
* **Next.js 15 (App Router):** Utilizes React Server Components (RSC) for lightning-fast data fetching directly from the source.
* **Prisma & SQLite:** A local-first database approach. Your data stays on your hardware, ensuring total privacy.
* **Server Actions:** All mutations (saving energy, adding expenses) happen through secure, type-safe server-side functions, bypassing the need for traditional REST boilerplate.

### Data Flow Pattern
```text
[User Input] --> [Server Action] --> [Prisma ORM] --> [SQLite DB]
      ^                                                |
      |________________ [Revalidation] ________________|
```

### Correlation Logic
The most advanced part of the system is found in the `MoodService`. It performs background calculations:
```typescript
// Logic snippet: Checking the cost of a bad mood
const avgSpentLowEnergy = await getAvgSpendingForDates(lowEnergyDates);
const avgSpentHighEnergy = await getAvgSpendingForDates(highEnergyDates);
return (avgSpentLowEnergy - avgSpentHighEnergy); // The "Emotional Tax"
```

---

## 🌑 Design Philosophy
* **Glassmorphism UI:** High use of backdrop blurs and semi-transparent layers for a "modern OS" feel.
* **Contextual Awareness:** The UI reacts to your data. Warning states (amber/red) trigger when the AI detects financial or energetic anomalies.
* **Zero Latency:** By utilizing local SQLite and Next.js caching, transitions between your garage, finances, and health logs are near-instant.

---

## 📜 Summary
This dashboard is a **Personal ERP (Enterprise Resource Planning)** system. It treats your time, money, and health as finite resources that must be balanced to avoid the "Empty Battery" state.
