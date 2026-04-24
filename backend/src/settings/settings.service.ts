import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Brak autoryzacji');
    }

    return {
      email: user.email,
      username: user.username,
      location: user.location || '',
      currency: user.currency || 'PLN',
      payday: user.payday ?? 10,
    };
  }

  async updateSettings(
    userId: string,
    payload: {
      currentPassword?: string;
      newEmail?: string;
      newPassword?: string;
      location?: string;
      currency?: string;
      payday?: number | string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Brak autoryzacji');
    }

    const updateData: {
      location?: string;
      currency?: string;
      payday?: number;
      email?: string;
      password?: string;
    } = {};

    if (payload.location !== undefined && payload.location !== user.location) {
      updateData.location = payload.location;
    }

    if (payload.currency !== undefined && payload.currency !== user.currency) {
      updateData.currency = payload.currency;
    }

    if (payload.payday !== undefined && Number(payload.payday) !== user.payday) {
      updateData.payday = Number(payload.payday);
    }

    if (payload.newEmail || payload.newPassword) {
      if (!payload.currentPassword) {
        throw new BadRequestException(
          'Musisz podac obecne haslo, aby zmienic e-mail lub haslo.',
        );
      }

      const isValid = await bcrypt.compare(payload.currentPassword, user.password);
      if (!isValid) {
        throw new BadRequestException('Obecne haslo jest nieprawidlowe.');
      }

      if (payload.newEmail && payload.newEmail !== user.email) {
        const existingEmail = await this.prisma.user.findUnique({
          where: { email: payload.newEmail },
        });
        if (existingEmail) {
          throw new BadRequestException(
            'Ten adres e-mail jest juz przypisany do innego konta.',
          );
        }
        updateData.email = payload.newEmail;
      }

      if (payload.newPassword) {
        if (payload.newPassword.length < 6) {
          throw new BadRequestException('Nowe haslo musi miec min. 6 znakow.');
        }
        updateData.password = await bcrypt.hash(payload.newPassword, 10);
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Nie wprowadzono zadnych zmian.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return { success: true };
  }
}
