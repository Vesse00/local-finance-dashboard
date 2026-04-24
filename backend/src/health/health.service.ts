import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Brak autoryzacji');
    }
    return user;
  }

  async getHealthDays(userId: string, month?: string) {
    await this.ensureUser(userId);

    let dateFilter: { date?: { gte: Date; lte: Date } } = {};
    if (month) {
      const [yearRaw, monthRaw] = month.split('-');
      const year = Number(yearRaw);
      const monthNumber = Number(monthRaw);
      if (Number.isFinite(year) && Number.isFinite(monthNumber)) {
        const startDate = new Date(year, monthNumber - 1, 1);
        const endDate = new Date(year, monthNumber, 0, 23, 59, 59);
        dateFilter = { date: { gte: startDate, lte: endDate } };
      }
    }

    return this.prisma.healthDay.findMany({
      where: { userId, ...dateFilter },
      orderBy: { date: 'asc' },
    });
  }

  async upsertHealthDay(
    userId: string,
    body: {
      date?: string;
      weight?: number | string;
      waterGlasses?: number | string;
      calories?: number | string;
      workout?: string | null;
      chest?: number | string;
      waist?: number | string;
      hips?: number | string;
      biceps?: number | string;
      thigh?: number | string;
    },
  ) {
    await this.ensureUser(userId);

    if (!body.date) {
      throw new BadRequestException('Brak daty');
    }

    const targetDate = new Date(body.date);
    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException('Nieprawidlowa data');
    }
    targetDate.setHours(12, 0, 0, 0);

    const healthDay = await this.prisma.healthDay.upsert({
      where: { userId_date: { userId, date: targetDate } },
      update: {
        weight: body.weight ? Number(body.weight) : null,
        waterGlasses:
          body.waterGlasses !== undefined ? Number(body.waterGlasses) : undefined,
        calories: body.calories ? Number(body.calories) : null,
        workout: body.workout !== undefined ? body.workout : undefined,
        chest: body.chest ? Number(body.chest) : null,
        waist: body.waist ? Number(body.waist) : null,
        hips: body.hips ? Number(body.hips) : null,
        biceps: body.biceps ? Number(body.biceps) : null,
        thigh: body.thigh ? Number(body.thigh) : null,
      },
      create: {
        userId,
        date: targetDate,
        weight: body.weight ? Number(body.weight) : null,
        waterGlasses:
          body.waterGlasses !== undefined ? Number(body.waterGlasses) : 0,
        calories: body.calories ? Number(body.calories) : null,
        workout: body.workout || null,
        chest: body.chest ? Number(body.chest) : null,
        waist: body.waist ? Number(body.waist) : null,
        hips: body.hips ? Number(body.hips) : null,
        biceps: body.biceps ? Number(body.biceps) : null,
        thigh: body.thigh ? Number(body.thigh) : null,
      },
    });

    return { message: 'Zapisano pomyslnie', healthDay };
  }

  calculateTargets(body: {
    gender?: string;
    weight?: number;
    height?: number;
    age?: number;
    activity?: number;
    goal?: number;
  }) {
    const gender = body.gender ?? 'MALE';
    const weight = body.weight ?? 80;
    const height = body.height ?? 180;
    const age = body.age ?? 30;
    const activity = body.activity ?? 1.55;
    const goal = body.goal ?? 0;

    const baseBMR =
      gender === 'MALE'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const tdee = baseBMR * activity;
    const targetKcal = Math.round(tdee + goal);

    const targetProteins = Math.round(weight * 2);
    const targetFats = Math.round(weight * 1);
    const carbsKcal = targetKcal - targetProteins * 4 - targetFats * 9;
    const targetCarbs = carbsKcal > 0 ? Math.round(carbsKcal / 4) : 0;

    return {
      bmr: Math.round(baseBMR),
      tdee: Math.round(tdee),
      targetKcal,
      targetProteins,
      targetFats,
      targetCarbs,
    };
  }
}
