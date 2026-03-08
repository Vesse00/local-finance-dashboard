"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  // Pobieramy dane o sesji (czy użytkownik jest zalogowany)
  const { data: session, status } = useSession();

  // 1. Stan ładowania (zanim sprawdzimy sesję)
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        Ładowanie...
      </div>
    );
  }

  // 2. Ochrona trasy: Jeśli nie jest zalogowany, wyrzuć do logowania
  if (status === "unauthenticated") {
    redirect("/login");
  }

  // 3. Widok głównego Dashboardu dla zalogowanego użytkownika
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      
      {/* SIDEBAR (Panel boczny) */}
      <aside className="w-64 border-r border-white/5 bg-background/30 backdrop-blur-xl p-4 flex flex-col hidden md:flex">
        <div className="mb-8 px-2">
          <h2 className="text-xl font-bold tracking-tight">Finanse</h2>
          <p className="text-sm text-muted-foreground">Twój lokalny dashboard</p>
        </div>
        
        <nav className="space-y-2 flex-1">
          <Button variant="secondary" className="w-full justify-start">Dashboard</Button>
          <Button variant="ghost" className="w-full justify-start">Kalendarz</Button>
          <Button variant="ghost" className="w-full justify-start">Analiza</Button>
          <Button variant="ghost" className="w-full justify-start">Oszczędności</Button>
        </nav>
      </aside>

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <main className="flex-1 flex flex-col">
        
        {/* NAVBAR (Górny pasek) */}
        <header className="h-16 border-b border-white/5 bg-background/30 backdrop-blur-xl flex items-center justify-between px-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Witaj, {session?.user?.name}!
          </h1>
          <div className="flex items-center gap-4">
            {/* Tutaj za chwilę wrzucimy przełącznik Dark/Light Mode */}
            <div className="text-sm text-muted-foreground italic">Tryb ciemny w drodze...</div>
            
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Wyloguj się
            </Button>
          </div>
        </header>

        {/* ZAWARTOŚĆ DASHBOARDU */}
        <div className="p-6 flex-1 overflow-auto">
          
          {/* Sekcja Widgetów */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Widget: Kwota wolna */}
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Kwota wolna
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">0,00 PLN</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Po odliczeniu cyklicznych
                </p>
              </CardContent>
            </Card>

            {/* Widget: Ile wydano */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Wydano w tym miesiącu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  - 0,00 PLN
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder na Kalendarz */}
          <div className="mt-8 border-2 border-dashed border-border rounded-xl h-[500px] flex items-center justify-center text-muted-foreground bg-muted/20">
            <div className="text-center">
              <p className="text-lg font-medium">Siatka Kalendarza</p>
              <p className="text-sm">Tutaj wyląduje kalendarz z guzikiem &quot;+&quot; dla każdego dnia.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}