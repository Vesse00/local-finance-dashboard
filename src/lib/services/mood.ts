import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, subDays, startOfDay, endOfDay } from "date-fns";

// ==========================================
// 2. SERWIS ANALITYCZNY (Z Twojego pliku)
// ==========================================

export type EnergyLevel = "OVERCHARGED" | "FULL" | "LOW" | "EMPTY";

export const classifyEnergy = (score: number): { level: EnergyLevel; emoji: string; text: string } => {
  if (score <= 10) return { level: "EMPTY", emoji: "🛑", text: "Burnout / Pusty Bak" };
  if (score <= 35) return { level: "LOW", emoji: "🪫", text: "Low Battery" };
  if (score <= 85) return { level: "FULL", emoji: "🔋", text: "Pełny Bak" };
  return { level: "OVERCHARGED", emoji: "⚡", text: "Overcharged" };
};

export class EnergyService {
  static async getTodayEntry(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.energyEntry.findUnique({
      where: { userId_date: { userId, date: today } },
    });
  }

  static async getMonthlyAverage(userId: string) {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const agg = await prisma.energyEntry.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _avg: { overallScore: true, workScore: true, freeTimeScore: true },
    });

    return {
      overall: Math.round(agg._avg.overallScore || 0),
      work: Math.round(agg._avg.workScore || 0),
      freeTime: Math.round(agg._avg.freeTimeScore || 0),
    };
  }

  static async getEmotionalSpendingInsights(userId: string) {
    const now = new Date();
    const last30Days = subDays(now, 30);

    const entries = await prisma.energyEntry.findMany({
      where: { userId, date: { gte: last30Days } },
      select: { date: true, overallScore: true },
    });

    if (entries.length === 0) return null;

    const lowEnergyDates = entries.filter(e => e.overallScore <= 35).map(e => e.date);
    const highEnergyDates = entries.filter(e => e.overallScore > 35).map(e => e.date);

    const getAvgSpendingForDates = async (dates: Date[]) => {
      if (dates.length === 0) return 0;
      let totalSpent = 0;
      for (const d of dates) {
        const start = startOfDay(d);
        const end = endOfDay(d);
        const dailySum = await prisma.expense.aggregate({
          where: {
            userId,
            date: { gte: start, lte: end },
            type: "EXPENSE", 
          },
          _sum: { amount: true },
        });
        totalSpent += dailySum._sum.amount || 0;
      }
      return totalSpent / dates.length;
    };

    const avgSpentLow = await getAvgSpendingForDates(lowEnergyDates);
    const avgSpentHigh = await getAvgSpendingForDates(highEnergyDates);

    return {
      daysAnalyzed: entries.length,
      lowEnergyDaysCount: lowEnergyDates.length,
      highEnergyDaysCount: highEnergyDates.length,
      avgSpentOnLowEnergyDays: avgSpentLow,
      avgSpentOnHighEnergyDays: avgSpentHigh,
      difference: avgSpentLow - avgSpentHigh,
    };
  }
}