"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { Navbar } from "./navbar";
import { OmniBar } from "./omni-bar";
import { AppBackground } from "./app-background";
import { UpdateNotifier } from "./update-notifier";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 relative selection:bg-indigo-500/30">
      
      <AppBackground />
      <UpdateNotifier />

      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 pt-16 md:pt-0">
        <Navbar />
        <OmniBar />
        
        {/* USUNIĘTE PEŁNE TŁO: Zastąpione bardzo delikatnym, przezroczystym przyciemnieniem (usunięto klasę 'backdrop-blur-[2px]', by nie rozmywała wzoru tła z krzyżyków w kontenerze) */}
        <main className="page-content-root flex-1 overflow-y-auto bg-white/20 dark:bg-black/10 transition-colors duration-500 relative">
          <div key={pathname} className="page-route-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}