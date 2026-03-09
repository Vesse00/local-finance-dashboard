import { prisma } from "@/lib/db";
import { RecurringUI } from "@/components/calendar/recurring-ui";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  // Pobieramy zlecenia stałe i raty
  const recurrings = await prisma.recurringPayment.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { dayOfMonth: 'asc' } // Sortujemy po dniu płatności (od 1 do 31)
  });

  // Pobieramy kategorie (przydadzą się do dodawania nowego zlecenia)
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' }
  });

  return <RecurringUI recurrings={recurrings} categories={categories} />;
}