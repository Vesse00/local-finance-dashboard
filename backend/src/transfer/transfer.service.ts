import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransferService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Brak autoryzacji');
    }

    return user;
  }

  private async getSavingsAccountForUserOrThrow(userId: string, accountId: string) {
    const account = await this.prisma.savingsAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Nie znaleziono konta oszczednosciowego');
    }

    return account;
  }

  async transfer(
    userId: string,
    payload: {
      amount?: string | number;
      fromAccount?: string;
      toAccount?: string;
      date?: string;
    },
  ) {
    const parsedAmount = Number(payload.amount);
    const fromAccount = payload.fromAccount;
    const toAccount = payload.toAccount;

    if (!fromAccount || !toAccount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new BadRequestException('Bledne dane transferu');
    }

    if (fromAccount === toAccount) {
      throw new BadRequestException('Konto zrodlowe i docelowe nie moga byc takie same');
    }

    const user = await this.getUserOrThrow(userId);
    const transferDate = payload.date ? new Date(payload.date) : new Date();

    if (fromAccount === 'MAIN' && toAccount === 'SAVINGS') {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { savings: { increment: parsedAmount } },
        }),
        this.prisma.expense.create({
          data: {
            amount: parsedAmount,
            description: 'Transfer na oszczednosci',
            type: 'SAVING',
            date: transferDate,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'IN',
            description: 'Wplata z Glownego Portfela',
            savingsAccountId: null,
            userId: user.id,
          },
        }),
      ]);

      return { success: true };
    }

    if (fromAccount === 'SAVINGS' && toAccount === 'MAIN') {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { savings: { decrement: parsedAmount } },
        }),
        this.prisma.income.create({
          data: {
            amount: parsedAmount,
            source: 'Z oszczednosci',
            description: 'Transfer ze skarbonki',
            date: transferDate,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'OUT',
            description: 'Wyplata do Glownego Portfela',
            savingsAccountId: null,
            userId: user.id,
          },
        }),
      ]);

      return { success: true };
    }

    if (fromAccount === 'MAIN' && toAccount !== 'SAVINGS') {
      const toSavingsAccount = await this.getSavingsAccountForUserOrThrow(user.id, toAccount);

      await this.prisma.$transaction([
        this.prisma.savingsAccount.update({
          where: { id: toSavingsAccount.id },
          data: { balance: { increment: parsedAmount } },
        }),
        this.prisma.expense.create({
          data: {
            amount: parsedAmount,
            description: 'Transfer na subkonto oszczednosciowe',
            type: 'SAVING',
            date: transferDate,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'IN',
            description: 'Wplata z Glownego Portfela',
            savingsAccountId: toSavingsAccount.id,
            userId: user.id,
          },
        }),
      ]);

      return { success: true };
    }

    if (fromAccount !== 'SAVINGS' && toAccount === 'MAIN') {
      const fromSavingsAccount = await this.getSavingsAccountForUserOrThrow(
        user.id,
        fromAccount,
      );

      await this.prisma.$transaction([
        this.prisma.savingsAccount.update({
          where: { id: fromSavingsAccount.id },
          data: { balance: { decrement: parsedAmount } },
        }),
        this.prisma.income.create({
          data: {
            amount: parsedAmount,
            source: 'Z subkonta',
            description: 'Wyplata z subkonta',
            date: transferDate,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'OUT',
            description: 'Wyplata do Glownego Portfela',
            savingsAccountId: fromSavingsAccount.id,
            userId: user.id,
          },
        }),
      ]);

      return { success: true };
    }

    if (fromAccount === 'SAVINGS' && toAccount !== 'MAIN') {
      const toSavingsAccount = await this.getSavingsAccountForUserOrThrow(user.id, toAccount);

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { savings: { decrement: parsedAmount } },
        }),
        this.prisma.savingsAccount.update({
          where: { id: toSavingsAccount.id },
          data: { balance: { increment: parsedAmount } },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'OUT',
            description: 'Przelew na subkonto',
            savingsAccountId: null,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'IN',
            description: 'Przelew z Glownych Oszczednosci',
            savingsAccountId: toSavingsAccount.id,
            userId: user.id,
          },
        }),
      ]);

      return { success: true };
    }

    if (fromAccount !== 'MAIN' && toAccount === 'SAVINGS') {
      const fromSavingsAccount = await this.getSavingsAccountForUserOrThrow(
        user.id,
        fromAccount,
      );

      await this.prisma.$transaction([
        this.prisma.savingsAccount.update({
          where: { id: fromSavingsAccount.id },
          data: { balance: { decrement: parsedAmount } },
        }),
        this.prisma.user.update({
          where: { id: user.id },
          data: { savings: { increment: parsedAmount } },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'OUT',
            description: 'Przelew na Glowne Oszczednosci',
            savingsAccountId: fromSavingsAccount.id,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'IN',
            description: 'Przelew z subkonta',
            savingsAccountId: null,
            userId: user.id,
          },
        }),
      ]);

      return { success: true };
    }

    const fromSavingsAccount = await this.getSavingsAccountForUserOrThrow(
      user.id,
      fromAccount,
    );
    const toSavingsAccount = await this.getSavingsAccountForUserOrThrow(user.id, toAccount);

    await this.prisma.$transaction([
      this.prisma.savingsAccount.update({
        where: { id: fromSavingsAccount.id },
        data: { balance: { decrement: parsedAmount } },
      }),
      this.prisma.savingsAccount.update({
        where: { id: toSavingsAccount.id },
        data: { balance: { increment: parsedAmount } },
      }),
      this.prisma.savingsTransaction.create({
        data: {
          amount: parsedAmount,
          type: 'OUT',
          description: 'Przelew wewnetrzny (Wychodzacy)',
          savingsAccountId: fromSavingsAccount.id,
          userId: user.id,
        },
      }),
      this.prisma.savingsTransaction.create({
        data: {
          amount: parsedAmount,
          type: 'IN',
          description: 'Przelew wewnetrzny (Przychodzacy)',
          savingsAccountId: toSavingsAccount.id,
          userId: user.id,
        },
      }),
    ]);

    return { success: true };
  }
}
