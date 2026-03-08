"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { AppSidebar } from "./app-sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Sprawdzamy, czy jesteśmy na stronach autoryzacji
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Jeśli to logowanie/rejestracja, renderujemy czystą stronę
  if (isAuthPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  // Jeśli to dashboard, renderujemy pełny układ z Sidebar i Navbar
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Pasek boczny (Sidebar) - ukryty na małych ekranach */}
      <AppSidebar />
      
      {/* Główna sekcja (Navbar + Treść) */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Navbar />
        
        {/* Kontener na treść strony (np. wykresy, statystyki) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}