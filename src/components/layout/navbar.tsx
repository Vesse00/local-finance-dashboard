"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { useLanguage } from "@/components/LanguageProvider";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { language: lang, setLanguage: setLang } = useLanguage();

  // Zapobiega błędom hydratacji
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-green-900/30 bg-black/70 backdrop-blur-xl transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-6 lg:px-8">
        
        {/* Lewa strona - Mobile nav */}
        <div className="flex items-center">
          <MobileNav />
        </div>

        {/* Prawa strona - Przełącznik i powiadomienia */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-none hover:bg-green-400/5 transition-colors text-zinc-600 dark:text-zinc-300 hover:text-green-400">
            <Bell className="h-5 w-5" />
          </Button>

          <div className="h-6 w-px bg-green-900/50 mx-1"></div>

          {/* Przełącznik języka i motywu (Pigułka zbiorcza) */}
          {mounted && (
            <div className="flex items-center gap-1 p-1 border border-green-900/40 bg-black/40 backdrop-blur-md">
              <div className="flex items-center">
                <button
                  onClick={() => setLang("pl")}
                  className={`px-2 py-1 text-[10px] font-mono font-bold tracking-wider transition-all duration-300 ${
                    lang === "pl"
                      ? "bg-green-400/10 text-green-400"
                      : "text-zinc-600 hover:text-green-500"
                  }`}
                >
                  PL
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={`px-2 py-1 text-[10px] font-mono font-bold tracking-wider transition-all duration-300 ${
                    lang === "en"
                      ? "bg-green-400/10 text-green-400"
                      : "text-zinc-600 hover:text-green-500"
                  }`}
                >
                  EN
                </button>
              </div>

              <div className="w-px h-4 bg-green-900/40 mx-1"></div>

              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 transition-all duration-300 ${
                  theme === "light"
                    ? "text-green-400"
                    : "text-zinc-600 hover:text-green-500"
                }`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 transition-all duration-300 ${
                  theme === "dark"
                    ? "text-green-400"
                    : "text-zinc-500 hover:text-green-500"
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