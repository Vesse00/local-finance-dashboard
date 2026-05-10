"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, ArrowRightLeft, 
  LogOut, CalendarDays, PiggyBank, Repeat, ChevronDown, Wallet, LineChart, Settings, 
  Briefcase, Clock, Dumbbell, Scale, User, Heart, Archive, CarFront, Zap, Calculator
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { MeBaseIconAnimated } from "@/components/ui/mebase-icon-animated";

// Samodzielne, najważniejsze linki na samej górze
const topItems = [
  { nameKey: "sidebar.top.dashboard", href: "/", icon: LayoutDashboard },
  { nameKey: "sidebar.top.analysis", href: "/analysis", icon: LineChart },
  { nameKey: "Planer", href: "/planner", icon: Calculator }, // Dodany Planer
];

// Zaktualizowana struktura nawigacji (obsługa podgrup)
const navGroups = [
  {
    titleKey: "sidebar.groups.personal.title",
    groupId: "personal",
    icon: User,
    subGroups: [
      {
        titleKey: "sidebar.groups.personal.health.title",
        groupId: "health",
        icon: Heart,
        items: [
          { nameKey: "sidebar.groups.personal.health.daily", href: "/health/daily", icon: Dumbbell },
          { nameKey: "sidebar.groups.personal.health.body", href: "/health/body", icon: Scale },
          { nameKey: "sidebar.groups.personal.health.energy", href: "/health/energy", icon: Zap },
        ]
      }
      // W przyszłości łatwo dodasz tu np: { titleKey: "Nawyki", items: [...] }
    ],
    items: [
      { nameKey: "sidebar.groups.personal.drawer", href: "/drawer", icon: Archive },
      { nameKey: "sidebar.groups.personal.garage", href: "/garage", icon: CarFront },
    ]
  },
  {
    titleKey: "sidebar.groups.finance.title",
    groupId: "finance",
    icon: Wallet,
    items: [
      { nameKey: "sidebar.groups.finance.calendar", href: "/calendar", icon: CalendarDays },
      { nameKey: "sidebar.groups.finance.recurring", href: "/calendar/recurring", icon: Repeat },
      { nameKey: "sidebar.groups.finance.savings", href: "/savings", icon: PiggyBank },
      { nameKey: "sidebar.groups.finance.transactions", href: "/transactions", icon: ArrowRightLeft },
    ]
  },
  {
    titleKey: "sidebar.groups.work.title",
    groupId: "work",
    icon: Briefcase,
    items: [
      { nameKey: "sidebar.groups.work.schedule", href: "/work-schedule", icon: Clock },
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  // Domyślnie otwieramy wszystko, abyś od razu widział nową strukturę
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-64 border-r border-green-900/30 bg-black/60 backdrop-blur-xl h-screen sticky top-0 flex-col hidden md:flex">
      <div className="p-5 border-b border-green-900/30">
        <div className="flex items-center gap-3">
          <MeBaseIconAnimated size={28} />
          <div>
            <h1 className="text-sm font-bold tracking-widest text-white uppercase">
              <span className="text-green-400">Me</span>Base
            </h1>
            <p className="text-[10px] text-green-600 tracking-wider">{'>'} SYSTEM ONLINE</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-6">
        
        {/* Top Items */}
        <div className="space-y-0.5">
          {topItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.nameKey}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                  isActive
                    ? "text-green-400 border-l-2 border-green-400 bg-green-400/5 pl-2.5"
                    : "text-zinc-500 hover:text-green-400 border-l-2 border-transparent pl-2.5"
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${isActive ? "text-green-400" : "text-zinc-600"}`} />
                <span>{isActive ? '> ' : ''}{t(item.nameKey)}</span>
              </Link>
            );
          })}
        </div>

        {/* Dynamic Groups */}
        <div className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.groupId} className="space-y-1">
              
              {/* Główny Nagłówek Kategorii (np. Personalne, Finanse) */}
              <button
                onClick={() => toggleGroup(group.groupId)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono text-green-700 uppercase tracking-widest hover:text-green-500 transition-colors"
              >
                <span><span className="text-green-600">{'// '}</span>{t(group.titleKey)}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openGroups[group.groupId] ? "rotate-180" : ""}`} />
              </button>

              {openGroups[group.groupId] && (
                <div className="space-y-1 mt-1 pl-2">
                  
                  {/* --- OBSŁUGA PODWÓJNEGO ZAGNIEŻDŻENIA (np. Zdrowie) --- */}
                  {group.subGroups?.map(subGroup => (
                    <div key={subGroup.groupId} className="space-y-1 mb-3 mt-2">
                       <button
                          onClick={() => toggleGroup(subGroup.groupId)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-zinc-400 hover:text-green-400 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <subGroup.icon className="w-3.5 h-3.5 text-green-600" />
                            {t(subGroup.titleKey)}
                          </div>
                          <ChevronDown className={`w-3 h-3 transition-transform ${openGroups[subGroup.groupId] ? "rotate-180" : ""}`} />
                        </button>

                        {openGroups[subGroup.groupId] && (
                          <div className="space-y-0.5 mt-1 pl-3 border-l border-green-900/30 ml-4">
                            {subGroup.items.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                <Link
                                  key={item.nameKey}
                                  href={item.href}
                                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
                                    isActive
                                      ? "text-green-400 border-l-2 border-green-400 bg-green-400/5 pl-2.5"
                                      : "text-zinc-600 hover:text-green-400 border-l-2 border-transparent pl-2.5"
                                  }`}
                                >
                                  <item.icon className={`w-3 h-3 ${isActive ? "text-green-400" : "text-zinc-700"}`} />
                                  {isActive ? '> ' : ''}{t(item.nameKey)}
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
                        key={item.nameKey}
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                          isActive
                            ? "text-green-400 border-l-2 border-green-400 bg-green-400/5 pl-2.5"
                            : "text-zinc-500 hover:text-green-400 border-l-2 border-transparent pl-2.5"
                        }`}
                      >
                        <item.icon className={`w-3.5 h-3.5 ${isActive ? "text-green-400" : "text-zinc-600"}`} />
                        <span>{isActive ? '> ' : ''}{t(item.nameKey)}</span>
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
        <div className="p-4 border-t border-green-900/30">
          <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-600 hover:text-green-400 transition-colors border-l-2 border-transparent hover:border-green-800 pl-2.5">
            <Settings className="w-3.5 h-3.5" />
            {t("sidebar.footer.settings")}
          </Link>
          <button 
            onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })} 
            className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-red-700 hover:text-red-400 transition-colors border-l-2 border-transparent hover:border-red-800 pl-2.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t("sidebar.footer.logout")}
          </button>
        </div>
    </aside>
  );
}