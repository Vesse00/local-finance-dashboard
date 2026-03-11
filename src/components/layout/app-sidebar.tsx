"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, ArrowRightLeft, PieChart, 
  LogOut, CalendarDays, PiggyBank, Repeat, ChevronDown, Wallet, LineChart, Settings, 
  Briefcase, Clock, Activity, Droplet, Dumbbell, Scale, User, Heart, Archive, CarFront
} from "lucide-react";

// Samodzielne, najważniejsze linki na samej górze
const topItems = [
  { name: "Pulpit", href: "/", icon: LayoutDashboard },
  { name: "Analiza", href: "/analysis", icon: LineChart },
];

// Zaktualizowana struktura nawigacji (obsługa podgrup)
const navGroups = [
  {
    title: "Personalne",
    icon: User,
    subGroups: [
      {
        title: "Zdrowie",
        icon: Heart,
        items: [
          { name: "Dziennik Aktywności", href: "/health/daily", icon: Dumbbell },
          { name: "Waga i Wymiary", href: "/health/body", icon: Scale },
        ]
      }
      // W przyszłości łatwo dodasz tu np: { title: "Nawyki", items: [...] }
    ],
    items: [
      { name: "Umowy i Gwarancje", href: "/drawer", icon: Archive },
      { name: "Garaż", href: "/garage", icon: CarFront },
    ]
  },
  {
    title: "Finanse",
    icon: Wallet,
    items: [
      { name: "Kalendarz", href: "/calendar", icon: CalendarDays },
      { name: "Zlecenia i Raty", href: "/calendar/recurring", icon: Repeat },
      { name: "Oszczędności", href: "/savings", icon: PiggyBank },
      { name: "Transakcje", href: "/transactions", icon: ArrowRightLeft },
    ]
  },
  {
    title: "Praca i Czas",
    icon: Briefcase,
    items: [
      { name: "Grafik pracy", href: "/work-schedule", icon: Clock },
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  // Domyślnie otwieramy wszystko, abyś od razu widział nową strukturę
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-64 border-r border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl h-screen sticky top-0 flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Dashboard
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-6">
        
        {/* Top Items */}
        <div className="space-y-1">
          {topItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm ${
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Dynamic Groups */}
        <div className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              
              {/* Główny Nagłówek Kategorii (np. Personalne, Finanse) */}
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <group.icon className="w-4 h-4" />
                  {group.title}
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform ${openGroups[group.title] ? "rotate-180" : ""}`} />
              </button>

              {openGroups[group.title] && (
                <div className="space-y-1 mt-1 pl-2">
                  
                  {/* --- OBSŁUGA PODWÓJNEGO ZAGNIEŻDŻENIA (np. Zdrowie) --- */}
                  {group.subGroups?.map(subGroup => (
                    <div key={subGroup.title} className="space-y-1 mb-3 mt-2">
                       <button
                          onClick={() => toggleGroup(subGroup.title)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <subGroup.icon className="w-4 h-4 text-emerald-500" />
                            {subGroup.title}
                          </div>
                          <ChevronDown className={`w-3 h-3 transition-transform ${openGroups[subGroup.title] ? "rotate-180" : ""}`} />
                        </button>

                        {openGroups[subGroup.title] && (
                          <div className="space-y-1 mt-1 pl-4 border-l-2 border-black/5 dark:border-white/5 ml-4">
                            {subGroup.items.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all text-sm ${
                                    isActive 
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                  }`}
                                >
                                  <item.icon className="w-3.5 h-3.5" />
                                  {item.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  ))}

                  {/* --- OBSŁUGA STANDARDOWYCH ELEMENTÓW (np. Kalendarz Finansów) --- */}
                  {group.items?.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm ${
                          isActive 
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* Footer Sidebaru */}
      <div className="p-4 border-t border-black/5 dark:border-white/10">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5">
          <Settings className="w-4 h-4" />
          Ustawienia
        </Link>
        <button className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
          <LogOut className="w-4 h-4" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}