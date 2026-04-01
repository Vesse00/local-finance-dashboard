"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import pl from "@/lib/i18n/dictionaries/pl.json";
import en from "@/lib/i18n/dictionaries/en.json";

const dictionaries = { pl, en };
export type Language = keyof typeof dictionaries;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  // Funkcja zwracająca napis lub string z kropkami np. "common.welcome"
  t: (key: string, values?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("pl");

  // Ładowanie zapisanych preferencji języka klienta po zamontowaniu (hydratacji)
  useEffect(() => {
    const saved = localStorage.getItem("app-lang") as Language;
    if (saved && (saved === "pl" || saved === "en")) {
      setLanguage(saved);
    } else {
      // Opcjonalnie wykrywanie języka przeglądarki
      const browserLang = navigator.language.startsWith("pl") ? "pl" : "en";
      setLanguage(browserLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app-lang", lang);
  };

  const t = (path: string, values?: Record<string, string | number>) => {
    const keys = path.split(".");
    let current: any = dictionaries[language];

    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Brak tłumaczenia dla klucza: ${path} [${language}]`);
        return path;
      }
      current = current[key];
    }
    
    let result = current as string;
    if (values) {
      Object.entries(values).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{${key}}`, "g"), String(value));
      });
    }
    
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage musi być użyte wewnątrz LanguageProvider");
  }
  return context;
};
