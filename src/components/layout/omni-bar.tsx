"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Home, CalendarDays, Car, Archive, Clock, PiggyBank, HeartPulse, Settings, Command, CornerDownLeft } from "lucide-react";

// Nasza baza komend nawigacyjnych
const commands = [
  { id: "home", title: "Pulpit Główny", icon: Home, route: "/" },
  { id: "calendar", title: "Kalendarz Finansowy", icon: CalendarDays, route: "/calendar" },
  { id: "garage", title: "Garaż i Pojazdy", icon: Car, route: "/garage" },
  { id: "drawer", title: "Szuflada (Gwarancje i Umowy)", icon: Archive, route: "/drawer" },
  { id: "work", title: "Harmonogram Pracy", icon: Clock, route: "/work-schedule" },
  { id: "savings", title: "Oszczędności", icon: PiggyBank, route: "/savings" },
  { id: "health", title: "Dziennik Zdrowia", icon: HeartPulse, route: "/health/daily" },
  { id: "settings", title: "Ustawienia Systemowe", icon: Settings, route: "/settings" },
];

export function OmniBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isUsingMouse, setIsUsingMouse] = useState(true); // Zabezpieczenie przed konfliktem klawiatura-mysz
  
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Nasłuchiwanie na Ctrl+K / Cmd+K w całej aplikacji
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Autofocus na input po otwarciu
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filtrowanie komend na podstawie tego, co wpiszesz
  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) || 
    cmd.id.toLowerCase().includes(query.toLowerCase())
  );

  // Obsługa strzałek i Entera wewnątrz Omni-bara
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    setIsUsingMouse(false); // Użytkownik używa klawiatury, ignorujemy przypadkowy hover myszką
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    }
    if (e.key === "Enter" && filteredCommands.length > 0) {
      e.preventDefault();
      executeCommand(filteredCommands[selectedIndex]);
    }
  };

  const executeCommand = (command: typeof commands[0]) => {
    setIsOpen(false);
    router.push(command.route);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-zinc-950/60 backdrop-blur-md flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200">
      
      {/* Tło klikalne, żeby zamknąć */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>

      {/* Główne okno Omni-bara */}
      <div 
        className="relative w-full max-w-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-white/50 dark:border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onKeyDown={handleModalKeyDown}
        onMouseMove={() => setIsUsingMouse(true)} // Reaktywacja myszki, gdy użytkownik nią ruszy
      >
        {/* Pasek wyszukiwania */}
        <div className="flex items-center px-4 py-4 border-b border-zinc-200 dark:border-zinc-800/80">
          <Search className="w-5 h-5 text-indigo-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Dokąd chcesz przejść? (np. Garaż, Ustawienia)"
            className="flex-1 bg-transparent outline-none text-lg font-medium text-zinc-900 dark:text-white placeholder:text-zinc-500"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0); // Reset wyboru po zmianie tekstu
            }}
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-md text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">
            <span className="text-xs leading-none">ESC</span>
            do wyjścia
          </div>
        </div>

        {/* Lista wyników */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <p className="text-sm font-medium">Nie znaleziono żadnej sekcji.</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  // Aktualizujemy zaznaczenie najeżdżając myszką TYLKO jeśli użytkownik faktycznie jej używa
                  onMouseEnter={() => {
                    if (isUsingMouse) setSelectedIndex(idx);
                  }}
                  // ZMIANA UX: Usunięto powolne `transition-all duration-200`. Przełączanie jest natychmiastowe!
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${
                    isSelected 
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">{cmd.title}</span>
                  </div>
                  
                  {isSelected && (
                    <CornerDownLeft className="w-4 h-4 opacity-70" />
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* Dolna stopka */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-100/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Command className="w-3 h-3" /> Omni-bar
          </div>
          <div className="flex items-center gap-3">
            <span>↑↓ Nawigacja</span>
            <span>↵ Wybierz</span>
          </div>
        </div>

      </div>
    </div>
  );
}