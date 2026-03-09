"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Pobieranie ID użytkownika (Jako String/UUID)
const getUserId = async (): Promise<string> => {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("Brak użytkownika w bazie. Zarejestruj się najpierw!");
  return user.id;
};

export async function addExpense(formData: FormData) {
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const dateString = formData.get("date") as string;
  const categoryName = formData.get("category") as string;
  
  const userId = await getUserId();

  let category = await prisma.category.findFirst({
    where: { name: categoryName, userId }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: categoryName, userId, icon: "🏷️" }
    });
  }

  await prisma.expense.create({
    data: {
      amount,
      description,
      date: new Date(dateString),
      categoryId: category.id,
      userId: userId,
      type: "EXPENSE" // Domyślny wydatek
    }
  });

  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function addIncome(formData: FormData) {
  const amount = parseFloat(formData.get("amount") as string);
  const source = formData.get("source") as string;
  const userId = await getUserId();

  await prisma.income.create({
    data: {
      amount,
      source: source || "Wypłata",
      date: new Date(),
      userId
    }
  });

  revalidatePath("/");
}

// NOWOŚĆ: Transfer na oszczędności!
export async function transferToSavings(formData: FormData) {
  const amount = parseFloat(formData.get("amount") as string);
  const userId = await getUserId();

  // 1. Zwiększamy ogólną pulę oszczędności użytkownika
  await prisma.user.update({
    where: { id: userId },
    data: { savings: { increment: amount } }
  });

  // 2. Rejestrujemy to jako "wydatek" o typie SAVING, żeby zmniejszyć Kwotę Wolną w tym miesiącu
  await prisma.expense.create({
    data: {
      amount,
      description: "Transfer na oszczędności (Koniec miesiąca)",
      date: new Date(),
      type: "SAVING",
      userId
    }
  });

  revalidatePath("/");
}

export async function getDashboardStats() {
  const userId = await getUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Zliczamy tylko to co faktycznie wydaliśmy (EXPENSE) oraz transfery na oszczędności z tego miesiąca (SAVING)
  const expenses = await prisma.expense.aggregate({
    where: { 
      userId, 
      date: { gte: startOfMonth },
      type: { in: ["EXPENSE", "SAVING"] } 
    },
    _sum: { amount: true }
  });

  const incomes = await prisma.income.aggregate({
    where: { userId, date: { gte: startOfMonth } },
    _sum: { amount: true }
  });

  const spent = expenses._sum.amount || 0;
  const totalIncome = incomes._sum.amount || 0;
  
  return {
    wydano: spent,
    wplywy: totalIncome,
    kwotaWolna: totalIncome - spent,
    oszczednosci: user?.savings || 0,
  };
}
export async function getCalendarData() {
  const userId = await getUserId();
  
  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: 'asc' }
  });
  
  const incomes = await prisma.income.findMany({
    where: { userId },
    orderBy: { date: 'asc' }
  });

  // NOWE: Pobieramy też kategorie przypisane do użytkownika
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  });
  
  return { expenses, incomes, categories };
}
// Tworzenie nowej kategorii
export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const icon = formData.get("icon") as string;
  const userId = await getUserId();

  await prisma.category.create({
    data: { name, icon: icon || "🏷️", userId }
  });

  revalidatePath("/calendar");
}

// Usuwanie kategorii
export async function deleteCategory(formData: FormData) {
  const id = formData.get("id") as string;
  const userId = await getUserId();

  // Najpierw usuwamy przypisanie kategorii z wydatków, żeby nie wywaliło błędu bazy
  await prisma.expense.updateMany({
    where: { categoryId: id, userId },
    data: { categoryId: null }
  });

  // Następnie usuwamy samą kategorię
  await prisma.category.delete({
    where: { id, userId }
  });

  revalidatePath("/calendar");
}

// --- USUWANIE WYDATKU / TRANSFERU ---
export async function deleteExpense(formData: FormData) {
  const id = formData.get("id") as string;
  const userId = await getUserId();

  // Najpierw pobieramy wydatek, żeby sprawdzić jego typ
  const expense = await prisma.expense.findUnique({
    where: { id, userId }
  });

  if (!expense) return;

  // Jeśli to był transfer na oszczędności, musimy "oddać" pieniądze z powrotem!
  if (expense.type === "SAVING" || expense.type === "INVESTMENT") {
    await prisma.user.update({
      where: { id: userId },
      data: { savings: { decrement: expense.amount } }
    });
  }

  // Usuwamy wpis z bazy
  await prisma.expense.delete({
    where: { id }
  });

  revalidatePath("/");
  revalidatePath("/calendar");
}

// --- USUWANIE WPŁYWU ---
export async function deleteIncome(formData: FormData) {
  const id = formData.get("id") as string;
  const userId = await getUserId();

  await prisma.income.delete({
    where: { id, userId }
  });

  revalidatePath("/");
  revalidatePath("/calendar");
}

// --- ZLECENIA STAŁE I RATY ---

export async function addRecurringPayment(formData: FormData) {
  const userId = await getUserId(); 
  
  const name = formData.get("name") as string;
  const defaultAmount = parseFloat(formData.get("defaultAmount") as string);
  const dayOfMonth = parseInt(formData.get("dayOfMonth") as string);
  const rawCategoryId = formData.get("categoryId") as string;
  const endDateStr = formData.get("endDate") as string;
  const totalAmountStr = formData.get("totalAmount") as string;

  const totalAmount = totalAmountStr ? parseFloat(totalAmountStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;

  let categoryId = rawCategoryId !== "null" ? rawCategoryId : null;

  // 1. INTELIGENTNE ZARZĄDZANIE KATEGORIĄ (jeśli użytkownik nie wybrał własnej)
  if (!categoryId) {
    const categoryName = totalAmount !== null ? "Raty" : "Subskrypcje";
    const categoryIcon = totalAmount !== null ? "🏦" : "🔄";

    let category = await prisma.category.findFirst({
      where: { userId, name: categoryName }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, icon: categoryIcon, userId }
      });
    }
    categoryId = category.id;
  }

  // 2. TWORZYMY GŁÓWNE ZLECENIE
  const newRecurring = await prisma.recurringPayment.create({
    data: {
      name,
      defaultAmount,
      dayOfMonth,
      categoryId,
      endDate,
      totalAmount,
      remainingAmount: totalAmount,
      userId
    }
  });

  // 3. GENEROWANIE 12 MIESIĘCY W PRZÓD Z TWOIM RECURRINGID
  const today = new Date();
  const MONTHS_TO_GENERATE = 12; 
  
  const expensesToCreate = [];
  let accumulated = 0; 

  for (let i = 0; i < MONTHS_TO_GENERATE; i++) {
    const expenseDate = new Date(today.getFullYear(), today.getMonth() + i, dayOfMonth);
    
    // Sprawdzanie daty końcowej zlecenia
    if (endDate && expenseDate > endDate) break;

    let amountForThisMonth = defaultAmount;

    // Logika spłaty długu/rat
    if (totalAmount !== null) {
      if (accumulated + defaultAmount > totalAmount) {
        amountForThisMonth = totalAmount - accumulated;
      }
      accumulated += amountForThisMonth;
    }

    if (amountForThisMonth > 0) {
      expensesToCreate.push({
        amount: amountForThisMonth,
        description: name,
        date: expenseDate,
        type: "EXPENSE",
        categoryId: categoryId, 
        userId: userId,
        recurringId: newRecurring.id // <--- Używamy Twojej istniejącej nazwy pola
      });
    }

    if (totalAmount !== null && accumulated >= totalAmount) break;
  }

  if (expensesToCreate.length > 0) {
    await prisma.expense.createMany({
      data: expensesToCreate
    });
  }

  revalidatePath("/calendar");
  revalidatePath("/calendar/recurring");
  revalidatePath("/");
}

export async function deleteRecurringPayment(formData: FormData) {
  const id = formData.get("id") as string;
  const userId = await getUserId();

  await prisma.recurringPayment.delete({
    where: { id, userId }
  });

  revalidatePath("/calendar/recurring");
}

// --- WYRÓWNYWANIE SALDA (UZGODNIENIE) ---

export async function adjustMainBalance(formData: FormData) {
  // Pobieramy użytkownika (jeśli masz już autoryzację, użyj swojej funkcji, np. getUserId())
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("Nie znaleziono użytkownika");
  const userId = user.id;

  const targetAmount = parseFloat(formData.get("amount") as string);

  // Pobieramy to, co aplikacja uważa za "obecny stan" w tym miesiącu
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const expenses = await prisma.expense.aggregate({
    where: { userId, date: { gte: startOfMonth }, type: { in: ["EXPENSE", "SAVING"] } },
    _sum: { amount: true }
  });
  const incomes = await prisma.income.aggregate({
    where: { userId, date: { gte: startOfMonth } },
    _sum: { amount: true }
  });

  const spent = expenses._sum.amount || 0;
  const totalIncome = incomes._sum.amount || 0;
  const currentBalance = totalIncome - spent;

  // Obliczamy ile brakuje (lub ile jest za dużo)
  const difference = targetAmount - currentBalance;

  // Jeśli saldo się zgadza, nic nie robimy
  if (Math.abs(difference) < 0.01) return;

  if (difference > 0) {
    // Apka ma za mało - dodajemy wpływ korygujący
    await prisma.income.create({
      data: {
        amount: difference,
        source: "Wyrównanie salda",
        description: "Automatyczna korekta stanu konta",
        date: new Date(),
        userId
      }
    });
  } else {
    // Apka ma za dużo - dodajemy wydatek korygujący
    const userCategories = await prisma.category.findMany({ where: { userId } });
    let cat = userCategories.find(c => c.name.toLowerCase() === "inne");
    if (!cat) cat = await prisma.category.create({ data: { name: "Inne", icon: "❓", userId } });

    await prisma.expense.create({
      data: {
        amount: Math.abs(difference),
        description: "Wyrównanie salda",
        recipient: "Korekta automatyczna",
        date: new Date(),
        categoryId: cat.id,
        userId
      }
    });
  }

  revalidatePath("/");
}

export async function saveMonthSummary(monthName: string) {
  const userId = await getUserId();
  const stats = await getDashboardStats();

  await prisma.monthSummary.upsert({
    where: {
      userId_monthYear: { userId, monthYear: monthName }
    },
    update: {
      leftToSpend: stats.kwotaWolna,
      savingsTotal: stats.oszczednosci
    },
    create: {
      userId,
      monthYear: monthName,
      leftToSpend: stats.kwotaWolna,
      savingsTotal: stats.oszczednosci
    }
  });

  revalidatePath("/");
}