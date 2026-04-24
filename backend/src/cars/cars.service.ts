import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CarInput = {
  make?: string;
  model?: string;
  plate?: string;
  year?: number | string | null;
  ocDate?: string;
  inspectionDate?: string;
  oilDate?: string;
};

type CarEventInput = {
  carId?: string;
  type?: string;
  date?: string;
  nextDueDate?: string;
  nextDueMileage?: number | string;
  cost?: number | string;
  description?: string;
  createExpense?: boolean;
  mileage?: number | string;
  liters?: number | string;
  pricePerLiter?: number | string;
};

@Injectable()
export class CarsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Brak autoryzacji');
    }
    return user;
  }

  async listCars(userId: string) {
    await this.ensureUser(userId);

    return this.prisma.car.findMany({
      where: { userId },
      include: { events: { orderBy: { date: 'desc' } } },
    });
  }

  async getCarDetails(userId: string, carId: string) {
    await this.ensureUser(userId);

    const car = await this.prisma.car.findFirst({
      where: { id: carId, userId },
      include: { events: { orderBy: { date: 'desc' } } },
    });

    if (!car) {
      throw new NotFoundException('Nie znaleziono pojazdu');
    }

    return car;
  }

  async createCar(userId: string, payload: CarInput) {
    await this.ensureUser(userId);

    if (!payload.make || !payload.model || !payload.plate) {
      throw new BadRequestException('Brak wymaganych danych pojazdu');
    }

    const car = await this.prisma.car.create({
      data: {
        userId,
        make: payload.make,
        model: payload.model,
        plate: payload.plate,
        year: payload.year ? Number(payload.year) : null,
      },
    });

    const now = new Date();

    if (payload.ocDate) {
      await this.prisma.carEvent.create({
        data: {
          carId: car.id,
          type: 'INSURANCE',
          date: now,
          nextDueDate: new Date(payload.ocDate),
          description: 'Ubezpieczenie poczatkowe',
        },
      });
    }

    if (payload.inspectionDate) {
      await this.prisma.carEvent.create({
        data: {
          carId: car.id,
          type: 'INSPECTION',
          date: now,
          nextDueDate: new Date(payload.inspectionDate),
          description: 'Przeglad poczatkowy',
        },
      });
    }

    if (payload.oilDate) {
      await this.prisma.carEvent.create({
        data: {
          carId: car.id,
          type: 'OIL',
          date: now,
          nextDueDate: new Date(payload.oilDate),
          description: 'Olej poczatkowy',
        },
      });
    }

    return car;
  }

  async deleteCar(userId: string, id?: string) {
    await this.ensureUser(userId);

    if (!id) {
      throw new BadRequestException('Brak id pojazdu');
    }

    const target = await this.prisma.car.findFirst({ where: { id, userId } });
    if (!target) {
      throw new NotFoundException('Nie znaleziono pojazdu');
    }

    await this.prisma.car.delete({ where: { id } });
    return { message: 'Usunieto pojazd' };
  }

  async createEvent(userId: string, payload: CarEventInput) {
    await this.ensureUser(userId);

    if (!payload.carId || !payload.type || !payload.date) {
      throw new BadRequestException('Brak wymaganych danych zdarzenia');
    }

    const car = await this.prisma.car.findFirst({
      where: { id: payload.carId, userId },
    });

    if (!car) {
      throw new NotFoundException('Nie znaleziono pojazdu');
    }

    const event = await this.prisma.carEvent.create({
      data: {
        carId: payload.carId,
        type: payload.type,
        description: payload.description,
        date: new Date(payload.date),
        nextDueDate: payload.nextDueDate ? new Date(payload.nextDueDate) : null,
        nextDueMileage: payload.nextDueMileage ? Number(payload.nextDueMileage) : null,
        cost: payload.cost ? Number(payload.cost) : null,
        mileage: payload.mileage ? Number(payload.mileage) : null,
        liters: payload.liters ? Number(payload.liters) : null,
        pricePerLiter: payload.pricePerLiter ? Number(payload.pricePerLiter) : null,
      },
    });

    if (payload.createExpense && payload.cost) {
      const categoryName = payload.type === 'REFUELING' ? 'Tankowanie' : 'Auto i Serwis';

      let category = await this.prisma.category.findFirst({
        where: { userId, name: categoryName },
      });

      if (!category) {
        category = await this.prisma.category.create({
          data: {
            userId,
            name: categoryName,
            icon: '⛽',
          },
        });
      }

      await this.prisma.expense.create({
        data: {
          userId,
          amount: Number(payload.cost),
          currency: 'PLN',
          description: `Garaz: ${payload.type === 'REFUELING' ? 'Tankowanie' : 'Serwis/Oplata'}`,
          recipient: 'Stacja / Serwis',
          date: new Date(payload.date || new Date()),
          createdAt: new Date(payload.date || new Date()),
          categoryId: category.id,
        },
      });
    }

    return event;
  }

  async deleteEvent(userId: string, id?: string) {
    await this.ensureUser(userId);

    if (!id) {
      throw new BadRequestException('Brak id wpisu');
    }

    const event = await this.prisma.carEvent.findFirst({
      where: { id, car: { userId } },
    });

    if (!event) {
      throw new NotFoundException('Nie znaleziono wpisu');
    }

    await this.prisma.carEvent.delete({ where: { id } });
    return { message: 'Usunieto wpis' };
  }
}
