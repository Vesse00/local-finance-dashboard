import { prisma } from "@/lib/db";
import { EnergyPageClient } from "./energy-page-client";

export default async function EnergyPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <div className="p-10 text-center">Brak dostępu</div>;

  const entries = await prisma.energyEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 30
  });

  return <EnergyPageClient entries={entries} />;
}