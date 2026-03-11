"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Pobieranie ID użytkownika (Jako String/UUID)
const getUserId = async (): Promise<string> => {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("Brak użytkownika w bazie. Zarejestruj się najpierw!");
  return user.id;
};

// PANCERNA TARCZA: Konwertuje wszystko co Prisma wypluje, włączając w to BigInty
const safeSerialize = (data: any) => 
  JSON.parse(JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));

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
  const user = await prisma.user.findFirst();
  if (!user) {
    return { kwotaWolna: 0, wydano: 0, wplywy: 0, oszczednosci: 0 };
  }

  const today = new Date();
  
  // Domyślne ramy czasowe to 1. do ostatniego dnia OBRCNEGO miesiąca
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Zliczamy WYDANO -> Ale TYLKO wydatki, OMIJAMY przelewy na oszczędności (SAVING)
  const monthlyExpenses = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: {
      userId: user.id,
      date: { gte: startOfMonth, lte: endOfMonth },
      type: "EXPENSE" // <--- KLUCZOWA POPRAWKA! 
    }
  });

  // Zliczamy transfery do oszczędności zrobione W TYM MIESIĄCU (by odjąć je od dostępnej puli)
  const monthlySavingsTransfers = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: {
      userId: user.id,
      date: { gte: startOfMonth, lte: endOfMonth },
      type: "SAVING"
    }
  });

  const monthlyIncomes = await prisma.income.aggregate({
    _sum: { amount: true },
    where: {
      userId: user.id,
      date: { gte: startOfMonth, lte: endOfMonth }
    }
  });

  const wydano = monthlyExpenses._sum.amount || 0;
  const wplywy = monthlyIncomes._sum.amount || 0;
  const odlozonoWTymMiesiacu = monthlySavingsTransfers._sum.amount || 0;

  // Kwota wolna to wpływy MINUS to co wydałeś MINUS to co schowałeś do skarbonki
  const kwotaWolna = (wplywy as number) - (wydano as number) - (odlozonoWTymMiesiacu as number);

  return safeSerialize({
    kwotaWolna,
    wydano, // Tutaj widnieją JUŻ TYLKO realne wydatki!
    wplywy,
    oszczednosci: user.savings // Całkowity stan skarbonki (z bazy)
  });
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
  
  return safeSerialize({ expenses, incomes, categories });
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
  const remainingAmountStr = formData.get("remainingAmount") as string;

  const totalAmount = totalAmountStr ? parseFloat(totalAmountStr) : null;
  const initialRemaining = remainingAmountStr ? parseFloat(remainingAmountStr) : totalAmount;
  const endDate = endDateStr ? new Date(endDateStr) : null;

  let categoryId = rawCategoryId !== "null" ? rawCategoryId : null;

  if (!categoryId) {
    const categoryName = totalAmount !== null ? "Raty" : "Subskrypcje";
    const categoryIcon = totalAmount !== null ? "🏦" : "🔄";

    let category = await prisma.category.findFirst({ where: { userId, name: categoryName } });
    if (!category) {
      category = await prisma.category.create({ data: { name: categoryName, icon: categoryIcon, userId } });
    }
    categoryId = category.id;
  }

  const newRecurring = await prisma.recurringPayment.create({
    data: {
      name, defaultAmount, dayOfMonth, categoryId, endDate,
      totalAmount, remainingAmount: initialRemaining, userId
    }
  });

  const today = new Date();
  const MONTHS_TO_GENERATE = 12; 
  const expensesToCreate = [];
  
  let alreadyPaidBefore = totalAmount !== null ? (totalAmount - (initialRemaining || 0)) : 0;
  let simulatedAccumulated = alreadyPaidBefore;

  for (let i = 0; i < MONTHS_TO_GENERATE; i++) {
    // NAPRAWA: Jeśli ustawisz ratę na 31. dnia, a miesiąc ma 28 dni (Luty),
    // to "lastDayOfMonth" ustawi tę datę bezpiecznie na 28. lutego!
    const targetYear = today.getFullYear();
    const targetMonth = today.getMonth() + i;
    
    // Ustalanie ostatniego dnia danego miesiąca, aby zapobiec przerolowaniu na kolejny
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const finalDay = dayOfMonth > lastDayOfMonth ? lastDayOfMonth : dayOfMonth;

    const expenseDate = new Date(targetYear, targetMonth, finalDay);
    
    if (endDate && expenseDate > endDate) break;

    let amountForThisMonth = defaultAmount;

    if (totalAmount !== null) {
      if (simulatedAccumulated + defaultAmount > totalAmount) {
        amountForThisMonth = totalAmount - simulatedAccumulated;
      }
      simulatedAccumulated += amountForThisMonth;
    }

    if (amountForThisMonth > 0) {
      expensesToCreate.push({
        amount: amountForThisMonth,
        description: name,
        date: expenseDate,
        type: "EXPENSE",
        categoryId: categoryId, 
        userId: userId,
        recurringId: newRecurring.id
      });
    }

    if (totalAmount !== null && simulatedAccumulated >= totalAmount) break;
  }

  if (expensesToCreate.length > 0) {
    await prisma.expense.createMany({ data: expensesToCreate });
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

// --- NADPŁATA KREDYTU / RATY ---
export async function overpayRecurring(formData: FormData) {
  const id = formData.get("id") as string;
  const amount = parseFloat(formData.get("amount") as string);

  if (!id || isNaN(amount) || amount <= 0) return;

  const rec = await prisma.recurringPayment.findUnique({ where: { id } });
  if (!rec || rec.totalAmount === null) return; // Upewniamy się, że to na pewno dług/rata

  const today = new Date();

  // 1. Zaksięguj nadpłatę jako wydatek w dniu dzisiejszym
  await prisma.expense.create({
    data: {
      amount,
      description: `${rec.name} (Nadpłata)`,
      date: today,
      type: "EXPENSE",
      categoryId: rec.categoryId,
      userId: rec.userId,
      recurringId: rec.id
    }
  });

  // 2. Oblicz nowe saldo i zaktualizuj zlecenie
  const currentRemaining = rec.remainingAmount || 0;
  const newRemaining = currentRemaining - amount;
  
  await prisma.recurringPayment.update({
    where: { id },
    data: { remainingAmount: newRemaining > 0 ? newRemaining : 0 }
  });

  // 3. Usuń wszystkie przyszłe, niezapłacone jeszcze raty (by zrobić miejsce na nowy, zaktualizowany harmonogram)
  await prisma.expense.deleteMany({
    where: {
      recurringId: id,
      date: { gt: today }
    }
  });

  // Jeśli spłaciliśmy wszystko, kończymy pracę!
  if (newRemaining <= 0) {
    revalidatePath("/calendar");
    revalidatePath("/calendar/recurring");
    revalidatePath("/");
    return;
  }

  // 4. Generuj nowy harmonogram na podstawie zaktualizowanego salda
  const MONTHS_TO_GENERATE = 12;
  const expensesToCreate = [];
  let simulatedAccumulated = 0; // Ile nowego długu już zaplanowaliśmy

  // Sprawdzamy, czy w tym miesiącu minął już dzień raty. Jeśli nie, to kolejna rata jest jeszcze w TYM miesiącu.
  let startMonthOffset = today.getDate() < rec.dayOfMonth ? 0 : 1;

  for (let i = 0; i < MONTHS_TO_GENERATE; i++) {
    const targetYear = today.getFullYear();
    const targetMonth = today.getMonth() + startMonthOffset + i;
    
    // Bezpieczne rolowanie dat (np. dla lutego)
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const finalDay = rec.dayOfMonth > lastDayOfMonth ? lastDayOfMonth : rec.dayOfMonth;

    const expenseDate = new Date(targetYear, targetMonth, finalDay);
    
    if (rec.endDate && expenseDate > rec.endDate) break;

    let amountForThisMonth = rec.defaultAmount;

    // Sprawdzamy czy ta rata nie przekroczy już nowego salda
    if (simulatedAccumulated + rec.defaultAmount > newRemaining) {
      amountForThisMonth = newRemaining - simulatedAccumulated; // Rata wyrównująca
    }
    
    simulatedAccumulated += amountForThisMonth;

    if (amountForThisMonth > 0) {
      expensesToCreate.push({
        amount: amountForThisMonth,
        description: rec.name,
        date: expenseDate,
        type: "EXPENSE",
        categoryId: rec.categoryId, 
        userId: rec.userId,
        recurringId: rec.id
      });
    }

    // Zatrzymujemy generowanie jeśli rozpisaliśmy całą resztę długu
    if (simulatedAccumulated >= newRemaining) break;
  }

  if (expensesToCreate.length > 0) {
    await prisma.expense.createMany({ data: expensesToCreate });
  }

  revalidatePath("/calendar");
  revalidatePath("/calendar/recurring");
  revalidatePath("/");
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
