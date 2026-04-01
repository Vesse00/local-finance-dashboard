import { prisma } from "@/lib/db";
import { PlannerUI } from "@/components/planner/planner-ui";

const safeSerialize = (data: any) => 
  JSON.parse(JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));

export default async function PlannerPage() {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' }
  });

  // Get current month's expenses and recurring to know how much is already spent/planned
  const startOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

  const expenses = await prisma.expense.findMany({
    where: { 
      userId: user.id,
      date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      type: "EXPENSE"
    }
  });

  const incomes = await prisma.income.findMany({
    where: { 
      userId: user.id,
      date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth }
    }
  });

  const recurrings = await prisma.recurringPayment.findMany({
    where: { userId: user.id, isActive: true }
  });

  return (
    <PlannerUI 
      categories={safeSerialize(categories)} 
      currentMonthExpenses={safeSerialize(expenses)}
      currentMonthIncomes={safeSerialize(incomes)}
      recurrings={safeSerialize(recurrings)}
      currency={user.currency || "PLN"}
    />
  );
}
