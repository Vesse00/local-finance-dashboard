"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { Navbar } from "./navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Lista stron, które NIE MAJĄ mieć paska bocznego ani nawigacji (strony publiczne/auth)
  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.includes(pathname);

  // Jeśli to strona logowania, rejestracji lub resetu - pokazujemy tylko czystą zawartość
  if (isAuthRoute) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  // W przeciwnym razie pokazujemy pełny Dashboard z menu
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}