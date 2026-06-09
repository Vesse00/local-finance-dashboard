import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { computeAchievements, type AchievementData } from "@/lib/achievements";

export const dynamic = "force-dynamic";

const SALARY_KEYWORDS = ["wynagrodzenie", "pensja", "płaca", "wypłata", "salary", "premia"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  // ── Login streak – aktualizuj przy każdym wywołaniu ──────
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginStreak: true, lastLoginDate: true, discoveredPages: true, savings: true, currency: true },
  });

  let loginStreak = user?.loginStreak ?? 0;

  if (user && user.lastLoginDate !== today) {
    // Nowy dzień – zaktualizuj serię
    const newStreak = user.lastLoginDate === yesterday ? loginStreak + 1 : 1;
    await prisma.user.update({
      where: { id: userId },
      data: { loginStreak: newStreak, lastLoginDate: today },
    });
    loginStreak = newStreak;
  }

  // ── Równoległe zapytania ──────────────────────────────────
  const [
    savingsAccounts,
    importedTransactionsCount,
    allIncomes,
    activeRecurring,
    recurringWithLoan,
    healthDaysCount,
    workDays,
    carEventsCount,
    drawerItemsCount,
    usedCategories,
  ] = await Promise.all([
    prisma.savingsAccount.findMany({ where: { userId }, select: { balance: true, currency: true } }),
    prisma.expense.count({ where: { userId, bankTxHash: { not: null } } }),
    prisma.income.findMany({
      where: { userId },
      select: { category: true, description: true, source: true },
    }),
    prisma.recurringPayment.count({ where: { userId, isActive: true } }),
    prisma.recurringPayment.findMany({
      where: { userId, totalAmount: { not: null }, remainingAmount: { not: null } },
      select: { totalAmount: true, remainingAmount: true },
    }),
    prisma.healthDay.count({ where: { userId } }),
    prisma.workDay.findMany({ where: { userId, isOvertime: true }, select: { overtimeHours: true } }),
    prisma.carEvent.count({ where: { car: { userId } } }),
    prisma.drawerItem.count({ where: { userId } }),
    prisma.expense.findMany({
      where: { userId, categoryId: { not: null } },
      select: { categoryId: true },
      distinct: ["categoryId"],
    }),
  ]);

  // ── Obliczenia ────────────────────────────────────────────
  const userDefaultCurrency = user?.currency ?? "PLN";
  // Skarbonka: główna pula oszczędności + subkonta w domyślnej walucie
  const plnSubAccountsBalance = savingsAccounts
    .filter((a) => !a.currency || a.currency === userDefaultCurrency)
    .reduce((s, a) => s + a.balance, 0);
  const totalSavingsBalance = (user?.savings ?? 0) + plnSubAccountsBalance;
  const totalOvertimeHours = workDays.reduce((s, d) => s + (d.overtimeHours ?? 0), 0);

  // Najlepszy % spłaconego kredytu
  let bestLoanPaidPercent = 0;
  for (const r of recurringWithLoan) {
    if (r.totalAmount && r.remainingAmount !== null) {
      const pct = ((r.totalAmount - r.remainingAmount) / r.totalAmount) * 100;
      if (pct > bestLoanPaidPercent) bestLoanPaidPercent = pct;
    }
  }

  // Liczba wynagrodzeń (po kategorii lub po frazie w opisie/źródle)
  const salaryIncomesCount = allIncomes.filter((inc) => {
    if (inc.category === "Wynagrodzenie") return true;
    const text = ((inc.description ?? "") + " " + (inc.source ?? "")).toLowerCase();
    return SALARY_KEYWORDS.some((kw) => text.includes(kw));
  }).length;

  // Konta w obcych walutach (względem domyślnej waluty użytkownika)
  const foreignCurrencies = new Set(
    savingsAccounts.filter((a) => a.currency && a.currency !== userDefaultCurrency).map((a) => a.currency)
  );
  const foreignCurrencyAccountsCount = foreignCurrencies.size;

  // Saldo per obca waluta → znajdź tę z największym saldem
  const foreignBalanceByCurrency: Record<string, number> = {};
  for (const a of savingsAccounts) {
    if (a.currency && a.currency !== userDefaultCurrency) {
      foreignBalanceByCurrency[a.currency] = (foreignBalanceByCurrency[a.currency] || 0) + a.balance;
    }
  }
  const foreignEntries = Object.entries(foreignBalanceByCurrency).sort(([, a], [, b]) => b - a);
  const largestForeignCurrency = foreignEntries[0]?.[0] ?? "EUR";
  const largestForeignCurrencyBalance = foreignEntries[0]?.[1] ?? 0;

  const discoveredPages = (user?.discoveredPages ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const data: AchievementData = {
    totalSavingsBalance,
    importedTransactions: importedTransactionsCount,
    salaryIncomesCount,
    activeRecurringCount: activeRecurring,
    bestLoanPaidPercent,
    healthDaysCount,
    totalOvertimeHours,
    carEventsCount,
    drawerItemsCount,
    expenseCategoriesCount: usedCategories.length,
    loginStreak,
    foreignCurrencyAccountsCount,
    largestForeignCurrencyBalance,
    largestForeignCurrency,
    mainCurrency: userDefaultCurrency,
    discoveredPages,
  };

  return NextResponse.json(computeAchievements(data));
}
