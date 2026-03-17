import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);
    const tomorrowEnd = addDays(todayEnd, 1);
    const next30Days = addDays(todayStart, 30);

    const upcomingItems: any[] = [];

    // 1. CZAS PRACY (Dzisiaj i Jutro)
    let workToday = null;
    let workTomorrow = null;
    try {
      workToday = await prisma.workDay.findFirst({ where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } } });
      workTomorrow = await prisma.workDay.findFirst({ where: { userId: user.id, date: { gte: tomorrowStart, lte: tomorrowEnd } } });
    } catch (e) { console.error(e) }

    // 2. ZDROWIE I TRENINGI (Podsumowanie dzisiejszego dnia)
    let healthToday = { calories: 0, workouts: [] as string[] };
    try {
      const entries = await prisma.healthEntry.findMany({
        where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } }
      });
      entries.forEach(e => {
        if (e.type === "CALORIES") healthToday.calories += e.calories;
        if (e.type === "WORKOUT") healthToday.workouts.push(e.title);
      });
    } catch (e) { console.error(e) }

    // 3. KALENDARZ FINANSOWY
    try {
      const recurring = await prisma.recurringPayment.findMany({ where: { userId: user.id, isActive: true } });
      recurring.forEach(req => {
        let nextDate = new Date(now.getFullYear(), now.getMonth(), req.dayOfMonth);
        if (nextDate < todayStart) nextDate = new Date(now.getFullYear(), now.getMonth() + 1, req.dayOfMonth);
        
        const daysLeft = Math.ceil((nextDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= 7) {
          const dayText = daysLeft === 0 ? "DZISIAJ" : daysLeft === 1 ? "JUTRO" : `za ${daysLeft} dni`;
          upcomingItems.push({ 
            type: "FINANCE", icon: "💸", title: `Płatność ${req.defaultAmount} PLN za "${req.name}" (${dayText})`, 
            priority: daysLeft <= 1 ? "high" : "normal", daysLeft
          });
        }
      });
    } catch (e) { console.error(e) }

    // 4. SZUFLADA
    try {
      const drawerItems = await prisma.drawerItem.findMany({
        where: { userId: user.id, endDate: { gte: todayStart, lte: next30Days } }
      });
      drawerItems.forEach(item => {
        if (item.endDate) {
          const daysLeft = Math.ceil((new Date(item.endDate).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
          const text = item.type === "WARRANTY" ? "Gwarancja na" : "Umowa na";
          upcomingItems.push({ 
            type: "DRAWER", icon: "📦", title: `${text} "${item.title}" kończy się za ${daysLeft} dni`, 
            priority: daysLeft <= 7 ? "high" : "normal", daysLeft
          });
        }
      });
    } catch (e) { console.error(e) }

    // 5. GARAŻ
    try {
      const carEvents = await prisma.carEvent.findMany({
        where: { car: { userId: user.id }, nextDueDate: { gte: todayStart, lte: next30Days } },
        include: { car: true }
      });
      carEvents.forEach(event => {
        if (event.nextDueDate) {
          const daysLeft = Math.ceil((new Date(event.nextDueDate).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
          let typeText = "Serwis"; let icon = "🔧";
          if (event.type === "INSURANCE") { typeText = "Ubezpieczenie"; icon = "🛡️"; }
          if (event.type === "INSPECTION") { typeText = "Przegląd"; icon = "🔍"; }
          
          upcomingItems.push({ 
            type: "GARAGE", icon, title: `${typeText} ${event.car.make} ${event.car.model} upływa za ${daysLeft} dni`, 
            priority: daysLeft <= 7 ? "high" : "normal", daysLeft
          });
        }
      });
    } catch (e) { console.error(e) }

    return NextResponse.json({ 
      workToday, 
      workTomorrow, 
      healthToday, 
      upcomingItems 
    });
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}