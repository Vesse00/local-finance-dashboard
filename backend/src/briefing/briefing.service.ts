import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BriefingService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  async getBriefing(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, location: true },
    });

    if (!user) {
      throw new NotFoundException('Brak autoryzacji');
    }

    const now = new Date();
    const todayStart = this.startOfDay(now);
    const todayEnd = this.endOfDay(now);
    const tomorrowStart = this.addDays(todayStart, 1);
    const tomorrowEnd = this.addDays(todayEnd, 1);
    const next30Days = this.addDays(todayStart, 30);

    const weatherPromise = (async () => {
      if (!user.location) {
        return null;
      }

      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(user.location)}&count=1&language=pl&format=json`,
        );
        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude, name } = geoData.results[0] as {
            latitude: number;
            longitude: number;
            name: string;
          };

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`,
          );
          const weatherData = await weatherRes.json();

          return {
            city: name,
            today: {
              maxTemp: weatherData.daily.temperature_2m_max[0],
              minTemp: weatherData.daily.temperature_2m_min[0],
              code: weatherData.daily.weathercode[0],
            },
            tomorrow: {
              maxTemp: weatherData.daily.temperature_2m_max[1],
              minTemp: weatherData.daily.temperature_2m_min[1],
              code: weatherData.daily.weathercode[1],
            },
          };
        }
      } catch {
        return null;
      }

      return null;
    })();

    const [
      weather,
      workToday,
      workTomorrow,
      healthEntries,
      recurring,
      drawerItems,
      carEvents,
    ] = await Promise.all([
      weatherPromise,
      this.prisma.workDay
        .findFirst({
          where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } },
          select: { shiftType: true, startTime: true, endTime: true },
        })
        .catch(() => null),
      this.prisma.workDay
        .findFirst({
          where: { userId: user.id, date: { gte: tomorrowStart, lte: tomorrowEnd } },
          select: { shiftType: true, startTime: true, endTime: true },
        })
        .catch(() => null),
      this.prisma.healthEntry
        .findMany({
          where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } },
          select: { type: true, calories: true, title: true },
        })
        .catch(() => [] as Array<{ type: string; calories: number | null; title: string | null }>),
      this.prisma.recurringPayment
        .findMany({
          where: { userId: user.id, isActive: true },
          select: { name: true, defaultAmount: true, dayOfMonth: true },
        })
        .catch(() => [] as Array<{ name: string; defaultAmount: number; dayOfMonth: number }>),
      this.prisma.drawerItem
        .findMany({
          where: { userId: user.id, endDate: { gte: todayStart, lte: next30Days } },
          select: { title: true, type: true, endDate: true },
        })
        .catch(() => [] as Array<{ title: string; type: string; endDate: Date | null }>),
      this.prisma.carEvent
        .findMany({
          where: { car: { userId: user.id }, nextDueDate: { gte: todayStart, lte: next30Days } },
          select: {
            type: true,
            nextDueDate: true,
            car: { select: { make: true, model: true } },
          },
        })
        .catch(
          () =>
            [] as Array<{
              type: string;
              nextDueDate: Date | null;
              car: { make: string; model: string };
            }>,
        ),
    ]);

    const upcomingItems: Array<{
      type: string;
      icon: string;
      title: string;
      priority: 'high' | 'normal';
      daysLeft: number;
    }> = [];

    const healthToday = { calories: 0, workouts: [] as string[] };
    healthEntries.forEach((entry) => {
      if (entry.type === 'CALORIES' && entry.calories) {
        healthToday.calories += entry.calories;
      }
      if (entry.type === 'WORKOUT' && entry.title) {
        healthToday.workouts.push(entry.title);
      }
    });

    recurring.forEach((item) => {
      let nextDate = new Date(now.getFullYear(), now.getMonth(), item.dayOfMonth);
      if (nextDate < todayStart) {
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, item.dayOfMonth);
      }

      const daysLeft = Math.ceil(
        (nextDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysLeft >= 0 && daysLeft <= 7) {
        const dayText =
          daysLeft === 0 ? 'DZISIAJ' : daysLeft === 1 ? 'JUTRO' : `za ${daysLeft} dni`;
        upcomingItems.push({
          type: 'FINANCE',
          icon: '💸',
          title: `Platnosc ${item.defaultAmount} PLN za "${item.name}" (${dayText})`,
          priority: daysLeft <= 1 ? 'high' : 'normal',
          daysLeft,
        });
      }
    });

    drawerItems.forEach((item) => {
      if (item.endDate) {
        const daysLeft = Math.ceil(
          (new Date(item.endDate).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
        );
        const text = item.type === 'WARRANTY' ? 'Gwarancja na' : 'Umowa na';
        upcomingItems.push({
          type: 'DRAWER',
          icon: '📦',
          title: `${text} "${item.title}" konczy sie za ${daysLeft} dni`,
          priority: daysLeft <= 7 ? 'high' : 'normal',
          daysLeft,
        });
      }
    });

    carEvents.forEach((event) => {
      if (event.nextDueDate) {
        const daysLeft = Math.ceil(
          (new Date(event.nextDueDate).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
        );

        let typeText = 'Serwis';
        let icon = '🔧';
        if (event.type === 'INSURANCE') {
          typeText = 'Ubezpieczenie';
          icon = '🛡️';
        }
        if (event.type === 'INSPECTION') {
          typeText = 'Przeglad';
          icon = '🔍';
        }

        upcomingItems.push({
          type: 'GARAGE',
          icon,
          title: `${typeText} ${event.car.make} ${event.car.model} uplywa za ${daysLeft} dni`,
          priority: daysLeft <= 7 ? 'high' : 'normal',
          daysLeft,
        });
      }
    });

    return {
      userLocation: user.location,
      weather,
      workToday,
      workTomorrow,
      healthToday,
      upcomingItems,
    };
  }
}
