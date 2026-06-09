"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addDays } from "date-fns/addDays";
import { endOfDay } from "date-fns/endOfDay";
import { startOfDay } from "date-fns/startOfDay";
import { revalidatePath } from "next/cache";

// Pobieranie ID użytkownika (Jako String/UUID)
const getUserId = async (): Promise<string> => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error("Brak dostępu lub sesji!");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Brak dostępu lub sesji!");
  return userId;
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
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
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

  // --- AUTOMATYCZNE GENEROWANIE PODSUMOWANIA ZA POPRZEDNI MIESIĄC ---
  try {
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const monthsPl = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    const expectedPrevMonthName = `${monthsPl[prevMonthDate.getMonth()]} ${prevMonthDate.getFullYear()}`;

    // Sprawdzamy czy istnieje
    const existingSummary = await prisma.monthSummary.findFirst({
      where: { userId: user.id, monthYear: expectedPrevMonthName }
    });

    if (!existingSummary) {
      const pmStart = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
      const pmEnd = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const pmExpenses = await prisma.expense.aggregate({ _sum: { amount: true }, where: { userId: user.id, date: { gte: pmStart, lte: pmEnd }, type: "EXPENSE" } });
      const pmSavings = await prisma.expense.aggregate({ _sum: { amount: true }, where: { userId: user.id, date: { gte: pmStart, lte: pmEnd }, type: "SAVING" } });
      const pmIncomes = await prisma.income.aggregate({ _sum: { amount: true }, where: { userId: user.id, date: { gte: pmStart, lte: pmEnd } } });
      
      const pmWydano = pmExpenses._sum.amount || 0;
      const pmOdlozono = pmSavings._sum.amount || 0;
      const pmWplywy = pmIncomes._sum.amount || 0;
      const pmKwotaWolna = pmWplywy - pmWydano - pmOdlozono;

      await prisma.monthSummary.create({
        data: {
          userId: user.id,
          monthYear: expectedPrevMonthName,
          leftToSpend: pmKwotaWolna,
          savingsTotal: user.savings // Przybliżony stan na koniec miesiąca - bierzemy dzisiejszy
        }
      });
    }
  } catch(error) {
    console.error("Backfill error:", error);
  }

  return safeSerialize({
    kwotaWolna,
    wydano, // Tutaj widnieją JUŻ TYLKO realne wydatki!
    wplywy,
    oszczednosci: user.savings // Całkowity stan skarbonki (z bazy)
  });
}
import { ensureDefaultCategories, getOrCreateCategory } from "@/lib/services/category.service";

export async function getCalendarData() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  
  
  // Zapewniamy stworzenie podstawowych kategorii jeśli ich brakuje
  await ensureDefaultCategories(userId);

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
  
  return safeSerialize({ expenses, incomes, categories, currency: user.currency || "PLN" });
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

export async function updateCategoryBudget(categoryId: string, budgetLimit: number | null) {
  const userId = await getUserId();
  await prisma.category.update({
    where: { id: categoryId, userId },
    data: { budgetLimit }
  });
  revalidatePath("/planner");
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
  const recipientAccountNo = (formData.get("recipientAccountNo") as string | null)?.replace(/\s/g, "").trim() || null;
  const matchPhrase = (formData.get("matchPhrase") as string | null)?.trim() || null;

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
      totalAmount, remainingAmount: initialRemaining,
      recipientAccountNo, matchPhrase,
      userId
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

// --- WYRÓWNYWANIE SALDA (UZGODNIENIE) ---

export async function adjustMainBalance(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Nie znaleziono użytkownika");
  

  const targetAmount = parseFloat(formData.get("amount") as string);

  // FIX: Pobieramy to, co aplikacja uważa za "obecny stan" używając DOKŁADNIE tej samej funkcji co Dashboard!
  const stats = await getDashboardStats();
  const currentBalance = stats.kwotaWolna;

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
        date: new Date(),
        userId
      }
    });
  } else {
    // Apka ma za dużo - dodajemy wydatek korygujący
    const userCategories = await prisma.category.findMany({ where: { userId } });
    let cat = await getOrCreateCategory(userId, "Inne", "❓");

    await prisma.expense.create({
      data: {
        amount: Math.abs(difference),
        description: "Wyrównanie salda",
        recipient: "Korekta automatyczna",
        date: new Date(),
        categoryId: cat.id,
        userId,
        type: "EXPENSE" // Jawnie oznaczamy to jako zwykły wydatek
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

export async function updateRecurringPayment(formData: FormData) {
  const userId = await getUserId(); 
  
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const defaultAmount = parseFloat(formData.get("defaultAmount") as string);
  const dayOfMonth = parseInt(formData.get("dayOfMonth") as string);
  const rawCategoryId = formData.get("categoryId") as string;
  const endDateStr = formData.get("endDate") as string;
  
  const totalAmountStr = formData.get("totalAmount") as string;
  const remainingAmountStr = formData.get("remainingAmount") as string;
  const recipientAccountNo = (formData.get("recipientAccountNo") as string | null)?.replace(/\s/g, "").trim() || null;
  const matchPhrase = (formData.get("matchPhrase") as string | null)?.trim() || null;

  const totalAmount = totalAmountStr ? parseFloat(totalAmountStr) : null;
  const remainingAmount = remainingAmountStr ? parseFloat(remainingAmountStr) : totalAmount;
  const endDate = endDateStr ? new Date(endDateStr) : null;

  let categoryId = rawCategoryId !== "null" ? rawCategoryId : null;

  // Aktualizacja Głównego Rekordu
  const updatedRecurring = await prisma.recurringPayment.update({
    where: { id, userId },
    data: {
      name, defaultAmount, dayOfMonth, categoryId, endDate,
      totalAmount, remainingAmount,
      recipientAccountNo, matchPhrase,
    }
  });

  const today = new Date();

  // USUŃ STARE ZAPLANOWANE RATY (od jutra w przód), aby wygenerować nowe
  await prisma.expense.deleteMany({
    where: {
      recurringId: id,
      date: { gt: today }
    }
  });

  // GENEROWANIE NOWYCH RAT W PRZÓD (na bazie nowych danych)
  const MONTHS_TO_GENERATE = 12; 
  const expensesToCreate = [];
  
  let simulatedAccumulated = totalAmount !== null ? (totalAmount - (remainingAmount || 0)) : 0;
  
  // Jeśli w tym miesiącu minął już nowy dzień raty, zaczynamy od następnego miesiąca
  let startMonthOffset = today.getDate() < dayOfMonth ? 0 : 1;

  for (let i = 0; i < MONTHS_TO_GENERATE; i++) {
    const targetYear = today.getFullYear();
    const targetMonth = today.getMonth() + startMonthOffset + i;
    
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
        recurringId: id
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

// --- MODUŁ ENERGII / BATERII ---

export async function saveEnergyEntry(formData: FormData) {
  // getUserId() to Twoja funkcja z początku actions.ts
  const userId = await getUserId();

  const dateStr = formData.get("date") as string;
  const overallScore = parseInt(formData.get("overallScore") as string);
  
  const workScoreStr = formData.get("workScore") as string;
  const freeTimeScoreStr = formData.get("freeTimeScore") as string;
  
  const workScore = workScoreStr ? parseInt(workScoreStr) : null;
  const freeTimeScore = freeTimeScoreStr ? parseInt(freeTimeScoreStr) : null;
  const note = formData.get("note") as string;

  // Zerujemy godzinę, żeby uniknąć duplikatów dla tego samego dnia
  const entryDate = dateStr ? new Date(dateStr) : new Date();
  entryDate.setHours(0, 0, 0, 0);


  // WALIDACJA: Nie pozwalamy zapisywać nastroju w przyszłości
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (entryDate > today) {
    throw new Error("Nie można zapisywać nastroju w przyszłości!");
  }

  await prisma.energyEntry.upsert({
    where: { userId_date: { userId, date: entryDate } },
    update: { overallScore, workScore, freeTimeScore, note },
    create: { userId, date: entryDate, overallScore, workScore, freeTimeScore, note }
  });

  revalidatePath("/health/energy");
  revalidatePath("/");
}

export async function deleteEnergyEntry(formData: FormData) {
  const id = formData.get("id") as string;
  const userId = await getUserId();

  await prisma.energyEntry.delete({ where: { id, userId } });
  revalidatePath("/health/energy");
}