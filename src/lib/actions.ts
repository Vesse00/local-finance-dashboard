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