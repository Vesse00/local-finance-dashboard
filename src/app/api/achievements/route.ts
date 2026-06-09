import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { computeAchievements, type AchievementData } from "@/lib/achievements";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  const [
    savingsAccounts,
    importedTransactionsCount,
    incomesCount,
    activeRecurring,
    recurringWithLoan,
    healthDaysCount,
    workDays,
    carEventsCount,
    drawerItemsCount,
    usedCategories,
  ] = await Promise.all([
    // Suma sald kont oszczędnościowych
    prisma.savingsAccount.findMany({ where: { userId }, select: { balance: true } }),

    // Liczba zaimportowanych transakcji (mają bankTxHash)
    prisma.expense.count({ where: { userId, bankTxHash: { not: null } } }),

    // Liczba przychodów
    prisma.income.count({ where: { userId } }),

    // Aktywne zlecenia stałe
    prisma.recurringPayment.count({ where: { userId, isActive: true } }),

    // Kredyty (mają totalAmount + remainingAmount)
    prisma.recurringPayment.findMany({
      where: { userId, totalAmount: { not: null }, remainingAmount: { not: null } },
      select: { totalAmount: true, remainingAmount: true },
    }),

    // Dni zdrowotne
    prisma.healthDay.count({ where: { userId } }),

    // Nadgodziny
    prisma.workDay.findMany({ where: { userId, isOvertime: true }, select: { overtimeHours: true } }),

    // Serwisy samochodowe
    prisma.carEvent.count({
      where: { car: { userId } },
    }),

    // Dokumenty w szufladzie
    prisma.drawerItem.count({ where: { userId } }),

    // Unikalne kategorie użyte w wydatkach
    prisma.expense.findMany({
      where: { userId, categoryId: { not: null } },
      select: { categoryId: true },
      distinct: ["categoryId"],
    }),
  ]);

  const totalSavingsBalance = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalOvertimeHours = workDays.reduce((sum, d) => sum + (d.overtimeHours ?? 0), 0);

  // Najlepszy % spłaconego kredytu spośród wszystkich
  let bestLoanPaidPercent = 0;
  for (const r of recurringWithLoan) {
    if (r.totalAmount && r.remainingAmount !== null) {
      const paid = r.totalAmount - r.remainingAmount;
      const pct = (paid / r.totalAmount) * 100;
      if (pct > bestLoanPaidPercent) bestLoanPaidPercent = pct;
    }
  }

  const data: AchievementData = {
    totalSavingsBalance,
    importedTransactions: importedTransactionsCount,
    incomesCount,
    activeRecurringCount: activeRecurring,
    bestLoanPaidPercent,
    healthDaysCount,
    totalOvertimeHours,
    carEventsCount,
    drawerItemsCount,
    expenseCategoriesCount: usedCategories.length,
  };

  const results = computeAchievements(data);

  return NextResponse.json(results);
}
