import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type WorkDayInput = {
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  isOvertime?: boolean;
  overtimeHours?: number | string;
  notes?: string;
  shiftType?: string;
};

type BulkGenerateInput = {
  days?: WorkDayInput[];
};

type BulkDeleteInput = {
  startDate?: string;
  endDate?: string;
  selectedWeekDays?: number[];
};

@Injectable()
export class WorkDaysService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Brak autoryzacji');
    }
  }

  private normalizeMidday(dateString: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

      if (
        Number.isNaN(date.getTime()) ||
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
      ) {
        throw new BadRequestException('Nieprawidlowa data');
      }

      return date;
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Nieprawidlowa data');
    }

    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        12,
        0,
        0,
        0,
      ),
    );
  }

  private normalizeBoundary(dateString: string, boundary: 'start' | 'end'): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      return new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          boundary === 'start' ? 0 : 23,
          boundary === 'start' ? 0 : 59,
          boundary === 'start' ? 0 : 59,
          boundary === 'start' ? 0 : 999,
        ),
      );
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Nieprawidlowy zakres dat');
    }

    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        boundary === 'start' ? 0 : 23,
        boundary === 'start' ? 0 : 59,
        boundary === 'start' ? 0 : 59,
        boundary === 'start' ? 0 : 999,
      ),
    );
  }

  async getWorkDays(userId: string, month?: string) {
    await this.assertUserExists(userId);

    let dateFilter: { date?: { gte: Date; lte: Date } } = {};

    if (month) {
      const [yearRaw, monthRaw] = month.split('-');
      const year = Number(yearRaw);
      const monthNumber = Number(monthRaw);

      if (Number.isFinite(year) && Number.isFinite(monthNumber)) {
        const startDate = new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));
        dateFilter = { date: { gte: startDate, lte: endDate } };
      }
    }

    return this.prisma.workDay.findMany({
      where: { userId, ...dateFilter },
      orderBy: { date: 'asc' },
    });
  }

  async upsertWorkDay(userId: string, body: WorkDayInput) {
    await this.assertUserExists(userId);

    if (!body.date) {
      throw new BadRequestException('Brak daty');
    }

    const targetDate = this.normalizeMidday(body.date);

    const data = {
      startTime: body.startTime || null,
      endTime: body.endTime || null,
      isOvertime: body.isOvertime || false,
      overtimeHours: Number(body.overtimeHours) || 0,
      notes: body.notes || '',
      shiftType: body.shiftType || 'REGULAR',
    };

    const workDay = await this.prisma.workDay.upsert({
      where: { userId_date: { userId, date: targetDate } },
      update: data,
      create: { userId, date: targetDate, ...data },
    });

    return { message: 'Zapisano pomyslnie', workDay };
  }

  async bulkGenerate(userId: string, body: BulkGenerateInput) {
    await this.assertUserExists(userId);

    const days = body.days;
    if (!Array.isArray(days)) {
      throw new BadRequestException('Nieprawidlowe dane');
    }

    await this.prisma.$transaction(
      days.map((day) => {
        if (!day.date) {
          throw new BadRequestException('Nieprawidlowa data dnia');
        }

        const targetDate = this.normalizeMidday(day.date);
        const shiftType = day.shiftType || 'REGULAR';

        const notes =
          shiftType === 'VACATION'
            ? 'Urlop Wypoczynkowy'
            : shiftType === 'SICK'
              ? 'Zwolnienie Lekarskie'
              : shiftType === 'DAY_OFF'
                ? 'Dzien Wolny'
                : 'Wygenerowano automatycznie';

        const data = {
          startTime: day.startTime || null,
          endTime: day.endTime || null,
          shiftType,
          isOvertime: false,
          overtimeHours: 0,
          notes,
        };

        return this.prisma.workDay.upsert({
          where: { userId_date: { userId, date: targetDate } },
          update: data,
          create: { userId, date: targetDate, ...data },
        });
      }),
    );

    return { message: 'Pomyslnie wygenerowano grafik.' };
  }

  async bulkDelete(userId: string, body: BulkDeleteInput) {
    await this.assertUserExists(userId);

    if (!body.startDate || !body.endDate || !Array.isArray(body.selectedWeekDays)) {
      throw new BadRequestException('Nieprawidlowe dane');
    }

    const start = this.normalizeBoundary(body.startDate, 'start');
    const end = this.normalizeBoundary(body.endDate, 'end');

    const records = await this.prisma.workDay.findMany({
      where: { userId, date: { gte: start, lte: end } },
    });

    const idsToDelete = records
      .filter((record) => body.selectedWeekDays?.includes(new Date(record.date).getUTCDay()))
      .map((record) => record.id);

    if (idsToDelete.length > 0) {
      await this.prisma.workDay.deleteMany({ where: { id: { in: idsToDelete } } });
    }

    return { message: `Pomyslnie usunieto ${idsToDelete.length} wpisow.` };
  }
}
