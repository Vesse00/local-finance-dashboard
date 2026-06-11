import { prisma } from "@/lib/db";
import { BodyPageClient } from "./body-page-client";
import { DiscoverPage } from "@/components/DiscoverPage";

export const dynamic = "force-dynamic";

export default async function BodyMeasurementsPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <div className="p-10 text-center">Brak dostępu</div>;

  const healthData = await prisma.healthDay.findMany({
    where: { userId: user.id }
  });

  const filteredData = healthData.filter(d => d.weight || d.chest || d.waist || d.hips || d.biceps || d.thigh);

  return <><DiscoverPage page="health/body" /><BodyPageClient initialData={filteredData} /></>;
}
