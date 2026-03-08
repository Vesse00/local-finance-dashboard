"use server"

import { prisma } from "./db"
import { startOfMonth, endOfMonth } from "date-fns"

export async function getDashboardStats() {
  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)

  // 1. Pobierz sumę wydatków w tym miesiącu
  const expenses = await prisma.expense.aggregate({
    where: {
      date: { gte: start, lte: end }
    },
    _sum: { amount: true }
  })

  // 2. Pobierz sumę stałych zobowiązań
  const recurring = await prisma.recurringPayment.aggregate({
    _sum: { amount: true }
  })

  // 3. Załóżmy na razie stałą wypłatę (potem dodasz to do Usera w bazie)
  const salary = 8000 
  const totalSpent = expenses._sum.amount || 0
  const fixedCosts = recurring._sum.amount || 0
  
  const freeAmount = salary - fixedCosts - totalSpent

  return {
    freeAmount,
    totalSpent,
    fixedCosts
  }
}