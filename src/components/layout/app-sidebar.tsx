"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, ArrowRightLeft, PieChart, 
  LogOut, CalendarDays, PiggyBank, Repeat, ChevronDown, Wallet, LineChart 
} from "lucide-react";

// Samodzielne, najważniejsze linki na samej górze
const topItems = [
  { name: "Pulpit", href: "/", icon: LayoutDashboard },
  { name: "Analiza", href: "/analysis", icon: LineChart }, // <--- ANALIZA PRZENIESIONA TUTAJ
];

// Grupy rozwijane
const navGroups = [
  {
    title: "Finanse",
    icon: Wallet,
    items: [
      { name: "Kalendarz", href: "/calendar", icon: CalendarDays },
      { name: "Zlecenia i Raty", href: "/calendar/recurring", icon: Repeat },
      { name: "Oszczędności", href: "/savings", icon: PiggyBank },
      { name: "Transakcje", href: "/transactions", icon: ArrowRightLeft },
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "Finanse": true });

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-64 border-r border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl hidden md:flex flex-col h-screen sticky top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <PieChart className="w-5 h-5" />
          </div>
          Finance<span className="text-primary">App</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        <div className="space-y-1">
          {topItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm
                  ${isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-zinc-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="space-y-4">
          {navGroups.map((group) => {
            const isOpen = openGroups[group.title];
            return (
              <div key={group.title} className="space-y-1">
                <button onClick={() => toggleGroup(group.title)} className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl font-bold transition-all text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                  <div className="flex items-center gap-2">
                    <group.icon className="w-4 h-4" />
                    {group.title}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-0" : "-rotate-90"}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
                  <div className="overflow-hidden space-y-1">
                    {group.items.map(item => {
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm ${isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"}`}>
                          <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-zinc-500"}`} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="p-4 mt-auto">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-sm text-zinc-600 dark:text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all">
          <LogOut className="w-5 h-5" />
          Wyloguj się
        </button>
      </div>
    </aside>
  );
}