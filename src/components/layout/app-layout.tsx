"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { Navbar } from "./navbar";
import { OmniBar } from "./omni-bar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 relative selection:bg-indigo-500/30">
      
      {/* 🔮 POTĘŻNE, WIDOCZNE PLAMY ŚWIATŁA W TLE */}
      {/* Zwiększyliśmy 'opacity' do 30-40%, by światło przebijało przez nasze szklane widgety */}
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/40 dark:bg-indigo-600/30 rounded-full blur-[100px] pointer-events-none" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-fuchsia-500/30 dark:bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" style={{ animationDuration: '12s' }}></div>
      <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-emerald-500/20 dark:bg-emerald-600/20 rounded-full blur-[90px] pointer-events-none" style={{ animationDuration: '10s' }}></div>

      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Navbar />
        <OmniBar />
        
        {/* USUNIĘTE PEŁNE TŁO: Zastąpione bardzo delikatnym, przezroczystym przyciemnieniem, by uwydatnić szkło */}
        <main className="flex-1 overflow-y-auto bg-white/20 dark:bg-black/10 backdrop-blur-[2px] transition-colors duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}