"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, PieChart, Target, Settings, LogOut, CalendarDays } from "lucide-react";

const navItems = [
  { name: "Pulpit", href: "/", icon: LayoutDashboard },
  { name: "Kalendarz", href: "/calendar", icon: CalendarDays }, // <--- NOWY LINK
  { name: "Transakcje", href: "/transactions", icon: ArrowRightLeft },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-black/5 dark:border-white/10 bg-white/30 dark:bg-black/20 backdrop-blur-xl transition-all duration-300 md:flex">
      <div className="flex flex-1 flex-col py-6 px-4 gap-2">
        <div className="px-3 mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Menu główne
        </div>
        
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary dark:text-purple-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-primary/20"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white border border-transparent"
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/10">
          <Link
            href="/settings"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all duration-300"
          >
            <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
            Ustawienia
          </Link>
          <button className="w-full mt-1 group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300">
            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Wyloguj
          </button>
        </div>
      </div>
    </aside>
  );
}