import { MainWidget } from "@/components/dashboard/main-widget";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6">
      <MainWidget />
      
      {/* Tutaj reszta komponentów (Wykresy, ostatnie transakcje itp.) */}
    </div>
  );
}