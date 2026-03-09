import { MainWidget } from "@/components/dashboard/main-widget";
import { getDashboardStats } from "@/lib/actions";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  
  // Pobieramy historię zapisanych miesięcy użytkownika (np. 5 ostatnich)
  const user = await prisma.user.findFirst({
    include: {
      monthSummaries: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  const summaries = user?.monthSummaries || [];

  return (
    <div className="flex-1 space-y-5 p-6 md:p-8 pt-6">
      <MainWidget currentStats={stats} summaries={summaries} />
      
      {/* Tutaj reszta komponentów (Wykresy, ostatnie transakcje itp.) */}
    </div>
  );
}