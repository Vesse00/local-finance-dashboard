"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Bell, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Zapobiega błędom hydratacji
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-6 lg:px-8">
        
        {/* Lewa strona - Logo i powitanie */}
        <div className="flex items-center gap-4">
          <MobileNav />
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
              Lokalny Dashboard
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Witaj z powrotem 👋
            </span>
          </div>
        </div>

        {/* Prawa strona - Przełącznik i powiadomienia */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-zinc-600 dark:text-zinc-300">
            <Bell className="h-5 w-5" />
          </Button>

          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

          {/* Przełącznik motywu (Pigułka) */}
          {mounted && (
            <div className="flex items-center p-1 rounded-full border border-black/5 dark:border-white/10 bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-md">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-full transition-all duration-300 ${
                  theme === "light" 
                    ? "bg-white shadow-sm text-primary" 
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-full transition-all duration-300 ${
                  theme === "dark" 
                    ? "bg-zinc-800 shadow-sm text-purple-400" 
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}