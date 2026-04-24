import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CorrectionReason = 'INTEREST' | 'PROFIT' | 'LOSS' | 'FEE' | 'MANUAL';

@Injectable()
export class SavingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Brak autoryzacji');
    }

    return user;
  }

  async getOverview(userId: string) {
    const user = await this.getUserOrThrow(userId);

    const accounts = await this.prisma.savingsAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      mainSavings: user.savings,
      accounts,
      currency: user.currency || 'PLN',
    };
  }

  async createAccount(
    userId: string,
    payload: { name?: string; balance?: number | string; type?: string },
  ) {
    const user = await this.getUserOrThrow(userId);

    const name = payload.name?.trim();
    const type = payload.type?.trim() || 'SAVINGS';
    const newBalance = Number(payload.balance ?? 0);

    if (!name) {
      throw new BadRequestException('Nazwa konta jest wymagana');
    }

    if (Number.isNaN(newBalance) || newBalance < 0) {
      throw new BadRequestException('Nieprawidlowa kwota salda poczatkowego');
    }

    if (type === 'IKE' || type === 'IKZE') {
      const existingAccount = await this.prisma.savingsAccount.findFirst({
        where: { userId: user.id, type },
      });

      if (existingAccount) {
        throw new BadRequestException(
          `Zgodnie z prawem, mozesz posiadac tylko jedno konto ${type}.`,
        );
      }
    }

    const newAccount = await this.prisma.savingsAccount.create({
      data: { userId: user.id, name, balance: newBalance, type },
    });

    if (newBalance > 0) {
      await this.prisma.savingsTransaction.create({
        data: {
          amount: newBalance,
          type: 'IN',
          description: 'Saldo poczatkowe',
          savingsAccountId: newAccount.id,
          userId: user.id,
        },
      });
    }

    return newAccount;
  }

  async deleteAccount(userId: string, payload: { id?: string }) {
    const user = await this.getUserOrThrow(userId);
    const id = payload.id;

    if (!id) {
      throw new BadRequestException('Brak id konta');
    }

    const account = await this.prisma.savingsAccount.findFirst({
      where: { id, userId: user.id },
    });

    if (!account) {
      throw new NotFoundException('Nie znaleziono konta');
    }

    if (account.balance > 0) {
      await this.prisma.income.create({
        data: {
          userId: user.id,
          amount: account.balance,
          source: 'Likwidacja subkonta',
          description: `Zwrot srodkow z usunietego konta: ${account.name}`,
          date: new Date(),
        },
      });
    }

    await this.prisma.savingsAccount.delete({ where: { id } });

    return { success: true };
  }

  async getAccountDetails(userId: string, accountId: string) {
    const user = await this.getUserOrThrow(userId);

    if (accountId === 'main') {
      const expenses = await this.prisma.expense.findMany({
        where: { userId: user.id, type: 'SAVING' },
      });

      const incomes = await this.prisma.income.findMany({
        where: { userId: user.id, source: 'Z oszczednosci' },
      });

      const txs = await this.prisma.savingsTransaction.findMany({
        where: { userId: user.id, savingsAccountId: null },
      });

      const combined: Array<{
        id: string;
        type: string;
        amount: number;
        description: string | null;
        date: Date;
      }> = [];

      txs.forEach((t) => {
        combined.push({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          date: t.date,
        });
      });

      expenses.forEach((e) => {
        const exists = txs.find(
          (t) =>
            t.amount === e.amount &&
            Math.abs(new Date(t.date).getTime() - new Date(e.date).getTime()) < 5000,
        );

        if (!exists) {
          combined.push({
            id: e.id,
            type: 'IN',
            amount: e.amount,
            description: e.description || 'Okladanie (Kalendarz)',
            date: e.date,
          });
        }
      });

      incomes.forEach((i) => {
        const exists = txs.find(
          (t) =>
            t.amount === i.amount &&
            Math.abs(new Date(t.date).getTime() - new Date(i.date).getTime()) < 5000,
        );

        if (!exists) {
          combined.push({
            id: i.id,
            type: 'OUT',
            amount: i.amount,
            description: i.description || 'Wyplata (Kalendarz)',
            date: i.date,
          });
        }
      });

      combined.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return {
        id: 'main',
        name: 'Glowne Oszczednosci',
        type: 'SAVINGS',
        balance: user.savings,
        history: combined,
        currency: user.currency || 'PLN',
      };
    }

    const account = await this.prisma.savingsAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      throw new NotFoundException('Konto nie istnieje');
    }

    const history = await this.prisma.savingsTransaction.findMany({
      where: { savingsAccountId: accountId, userId: user.id },
      orderBy: { date: 'desc' },
    });

    return { ...account, history, currency: user.currency || 'PLN' };
  }

  async correctAccount(
    userId: string,
    accountId: string,
    payload: { newBalance?: number | string; reason?: string },
  ) {
    const user = await this.getUserOrThrow(userId);
    const targetBalance = Number(payload.newBalance);

    if (Number.isNaN(targetBalance) || targetBalance < 0) {
      throw new BadRequestException('Nieprawidlowa kwota');
    }

    let description = 'Korekta salda';
    const reason = payload.reason as CorrectionReason | undefined;
    if (reason === 'INTEREST') description = 'Kapitalizacja odsetek';
    if (reason === 'PROFIT') description = 'Zysk z inwestycji (Wzrost wyceny)';
    if (reason === 'LOSS') description = 'Strata z inwestycji (Spadek wyceny)';
    if (reason === 'FEE') description = 'Oplata za prowadzenie konta / prowizja';
    if (reason === 'MANUAL') description = 'Reczna korekta salda';

    if (accountId === 'main') {
      const difference = targetBalance - user.savings;
      if (difference === 0) {
        return { success: true, message: 'Brak roznicy' };
      }

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { savings: targetBalance },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: Math.abs(difference),
            type: difference > 0 ? 'IN' : 'OUT',
            description,
            savingsAccountId: null,
            userId: user.id,
          },
        }),
      ]);

      return { success: true };
    }

    const account = await this.prisma.savingsAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      throw new NotFoundException('Nie znaleziono konta');
    }

    const difference = targetBalance - account.balance;
    if (difference === 0) {
      return { success: true, message: 'Brak roznicy' };
    }

    await this.prisma.$transaction([
      this.prisma.savingsAccount.update({
        where: { id: account.id },
        data: { balance: targetBalance },
      }),
      this.prisma.savingsTransaction.create({
        data: {
          amount: Math.abs(difference),
          type: difference > 0 ? 'IN' : 'OUT',
          description,
          savingsAccountId: account.id,
          userId: user.id,
        },
      }),
    ]);

    return { success: true };
  }
}
