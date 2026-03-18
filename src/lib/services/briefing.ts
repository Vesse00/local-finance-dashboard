import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function getBriefingData() {
  try {
    const user = await prisma.user.findFirst({
      select: { id: true, location: true }
    });
    if (!user) return null;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);
    const tomorrowEnd = addDays(todayEnd, 1);
    const next30Days = addDays(todayStart, 30);

    const weatherPromise = (async () => {
      if (!user.location) return null;
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(user.location)}&count=1&language=pl&format=json`);
        const geoData = await geoRes.json();
        
        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude, name } = geoData.results[0];
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
          const weatherData = await weatherRes.json();
          
          return {
            city: name,
            today: { maxTemp: weatherData.daily.temperature_2m_max[0], minTemp: weatherData.daily.temperature_2m_min[0], code: weatherData.daily.weathercode[0] },
            tomorrow: { maxTemp: weatherData.daily.temperature_2m_max[1], minTemp: weatherData.daily.temperature_2m_min[1], code: weatherData.daily.weathercode[1] }
          };
        }
      } catch (e) { return null; }
      return null;
    })();

    const [weather, workToday, workTomorrow, healthEntries, recurring, drawerItems, carEvents] = await Promise.all([
      weatherPromise,
      prisma.workDay.findFirst({ where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } }, select: { shiftType: true, startTime: true, endTime: true } }).catch(() => null),
      prisma.workDay.findFirst({ where: { userId: user.id, date: { gte: tomorrowStart, lte: tomorrowEnd } }, select: { shiftType: true, startTime: true, endTime: true } }).catch(() => null),
      prisma.healthEntry.findMany({ where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } }, select: { type: true, calories: true, title: true } }).catch(() => []),
      prisma.recurringPayment.findMany({ where: { userId: user.id, isActive: true }, select: { name: true, defaultAmount: true, dayOfMonth: true } }).catch(() => []),
      prisma.drawerItem.findMany({ where: { userId: user.id, endDate: { gte: todayStart, lte: next30Days } }, select: { title: true, type: true, endDate: true } }).catch(() => []),
      prisma.carEvent.findMany({ where: { car: { userId: user.id }, nextDueDate: { gte: todayStart, lte: next30Days } }, select: { type: true, nextDueDate: true, car: { select: { make: true, model: true } } } }).catch(() => [])
    ]);

    const upcomingItems: any[] = [];
    const healthToday = { calories: 0, workouts: [] as string[] };
    
    healthEntries.forEach(e => {
      if (e.type === "CALORIES" && e.calories) healthToday.calories += e.calories;
      if (e.type === "WORKOUT" && e.title) healthToday.workouts.push(e.title);
    });

    recurring.forEach(req => {
      let nextDate = new Date(now.getFullYear(), now.getMonth(), req.dayOfMonth);
      if (nextDate < todayStart) nextDate = new Date(now.getFullYear(), now.getMonth() + 1, req.dayOfMonth);
      const daysLeft = Math.ceil((nextDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 7) upcomingItems.push({ type: "FINANCE", icon: "💸", title: `Płatność ${req.defaultAmount} PLN za "${req.name}" (${daysLeft === 0 ? "DZISIAJ" : daysLeft === 1 ? "JUTRO" : `za ${daysLeft} dni`})`, priority: daysLeft <= 1 ? "high" : "normal", daysLeft });
    });

    drawerItems.forEach(item => {
      if (item.endDate) {
        const daysLeft = Math.ceil((new Date(item.endDate).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
        upcomingItems.push({ type: "DRAWER", icon: "📦", title: `${item.type === "WARRANTY" ? "Gwarancja na" : "Umowa na"} "${item.title}" kończy się za ${daysLeft} dni`, priority: daysLeft <= 7 ? "high" : "normal", daysLeft });
      }
    });

    carEvents.forEach(event => {
      if (event.nextDueDate) {
        const daysLeft = Math.ceil((new Date(event.nextDueDate).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
        let typeText = "Serwis"; let icon = "🔧";
        if (event.type === "INSURANCE") { typeText = "Ubezpieczenie"; icon = "🛡️"; }
        if (event.type === "INSPECTION") { typeText = "Przegląd"; icon = "🔍"; }
        upcomingItems.push({ type: "GARAGE", icon, title: `${typeText} ${event.car.make} ${event.car.model} upływa za ${daysLeft} dni`, priority: daysLeft <= 7 ? "high" : "normal", daysLeft });
      }
    });

    return { userLocation: user.location, weather, workToday, workTomorrow, healthToday, upcomingItems };
  } catch (error) { return null; }
}