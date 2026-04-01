import { prisma } from "@/lib/db";
import { BodyPageClient } from "./body-page-client";

export default async function BodyMeasurementsPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <div className="p-10 text-center">Brak dostępu</div>;

  const healthData = await prisma.healthDay.findMany({
    where: { userId: user.id }
  });

  const filteredData = healthData.filter(d => d.weight || d.chest || d.waist || d.hips || d.biceps || d.thigh);

  return <BodyPageClient initialData={filteredData} />;
}
