"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  Menu, X, LayoutDashboard, LineChart, Wallet, CalendarDays, Repeat, PiggyBank, 
  ArrowRightLeft, Briefcase, Clock, User, Heart, Dumbbell, Scale, Archive, Settings, LogOut, ChevronDown, 
  CarFront
} from "lucide-react";

const topItems = [
  { name: "Pulpit", href: "/", icon: LayoutDashboard },
  { name: "Analiza", href: "/analysis", icon: LineChart },
];

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

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Upewniamy się, że portal renderuje się tylko na kliencie (unikanie błędów SSR w Next.js)
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleGroup = (title: string) => setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));

  // Blokowanie scrollowania strony w tle
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  // Definiujemy nasz potężny, niezależny panel (wyświetlany w <body>)
  const drawerContent = mounted ? createPortal(
    <div className="md:hidden text-zinc-900 dark:text-zinc-100">
      
      {/* TŁO PRZYCIEMNIAJĄCE (Overlay) */}
      <div 
        className={`fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={closeMenu}
      />

      {/* GŁÓWNE MENU (Drawer) z gwarantowanym, litym tłem bg-white */}
      <div 
        className={`fixed top-0 left-0 bottom-0 z-[9999] w-[280px] bg-white dark:bg-zinc-950 shadow-[20px_0_40px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Nagłówek Menu */}
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950">
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <button onClick={closeMenu} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zawartość Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-white dark:bg-zinc-950">
          
          <div className="space-y-1">
            {topItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} onClick={closeMenu} className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all text-sm ${isActive ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <button onClick={() => toggleGroup(group.title)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-black text-zinc-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2"><group.icon className="w-4 h-4" />{group.title}</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${openGroups[group.title] ? "rotate-180" : ""}`} />
                </button>

                {openGroups[group.title] && (
                  <div className="space-y-1 mt-1 pl-2">
                    {group.subGroups?.map(subGroup => (
                      <div key={subGroup.title} className="space-y-1 mb-3 mt-2">
                        <button onClick={() => toggleGroup(subGroup.title)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300">
                          <div className="flex items-center gap-2"><subGroup.icon className={`w-4 h-4 ${subGroup.title.includes("Zdrowie") ? "text-emerald-500" : "text-amber-500"}`} />{subGroup.title}</div>
                          <ChevronDown className={`w-3 h-3 transition-transform ${openGroups[subGroup.title] ? "rotate-180" : ""}`} />
                        </button>

                        {openGroups[subGroup.title] && (
                          <div className="space-y-1 mt-1 pl-4 border-l-2 border-black/5 dark:border-white/5 ml-4">
                            {subGroup.items.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                <Link key={item.name} href={item.href} onClick={closeMenu} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-sm ${isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                                  <item.icon className="w-4 h-4" />{item.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                    {group.items?.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.name} href={item.href} onClick={closeMenu} className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all text-sm ${isActive ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                          <item.icon className="w-5 h-5" />{item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stopka Menu */}
        <div className="p-4 border-t border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950">
          <Link href="/settings" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all text-sm text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5">
            <Settings className="w-5 h-5" /> Ustawienia
          </Link>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            className="w-full mt-1 flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="w-5 h-5" /> Wyloguj
          </button>
        </div>

      </div>
    </div>, 
    document.body
  ) : null;

  return (
    <>
      {/* Niewinny przycisk otwierający w Navbarze */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      {/* Magiczny teleport naszego okna! */}
      {drawerContent}
    </>
  );
}