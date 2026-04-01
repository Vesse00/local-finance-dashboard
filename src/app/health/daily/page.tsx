import { prisma } from "@/lib/db";
import { DailyPageClient } from "./daily-page-client";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function DailyHealthPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <div className="p-10 text-center">Brak dostępu</div>;

  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  const initialDays = await prisma.healthDay.findMany({
    where: { 
      userId: user.id,
      date: { gte: startDate, lte: endDate }
    }
  });

  const initialEntries = await prisma.healthEntry.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate, lte: endDate }
    }
  });

  return <DailyPageClient initialDays={initialDays} initialEntries={initialEntries} />;
}
