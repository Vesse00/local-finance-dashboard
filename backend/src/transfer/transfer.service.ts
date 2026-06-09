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

  private async getExchangeRate(from: string, to: string): Promise<number> {
    if (!from || !to || from === to) return 1;
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
      if (!res.ok) return 1;
      const data: any = await res.json();
      return (data.rates?.[to] as number | undefined) ?? 1;
    } catch {
      return 1;
    }
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
      const mainCurrency = user.currency || 'PLN';
      const subCurrency = toSavingsAccount.currency || mainCurrency;
      const rate = await this.getExchangeRate(mainCurrency, subCurrency);
      const convertedAmount = parsedAmount * rate;

      await this.prisma.$transaction([
        this.prisma.savingsAccount.update({
          where: { id: toSavingsAccount.id },
          data: { balance: { increment: convertedAmount } },
        }),
        this.prisma.expense.create({
          data: {
            amount: parsedAmount,
            description: rate !== 1
              ? `Transfer na subkonto oszczednosciowe (kurs: 1 ${mainCurrency} = ${rate.toFixed(4)} ${subCurrency})`
              : 'Transfer na subkonto oszczednosciowe',
            type: 'SAVING',
            date: transferDate,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: convertedAmount,
            type: 'IN',
            description: rate !== 1
              ? `Wplata z Glownego Portfela (kurs ${rate.toFixed(4)})`
              : 'Wplata z Glownego Portfela',
            savingsAccountId: toSavingsAccount.id,
            userId: user.id,
          },
        }),
      ]);

      return { success: true, exchangeRate: rate };
    }

    if (fromAccount !== 'SAVINGS' && toAccount === 'MAIN') {
      const fromSavingsAccount = await this.getSavingsAccountForUserOrThrow(
        user.id,
        fromAccount,
      );
      const mainCurrency = user.currency || 'PLN';
      const subCurrency = fromSavingsAccount.currency || mainCurrency;
      const rate = await this.getExchangeRate(subCurrency, mainCurrency);
      const convertedAmount = parsedAmount * rate;

      await this.prisma.$transaction([
        this.prisma.savingsAccount.update({
          where: { id: fromSavingsAccount.id },
          data: { balance: { decrement: parsedAmount } },
        }),
        this.prisma.income.create({
          data: {
            amount: convertedAmount,
            source: 'Z subkonta',
            description: rate !== 1
              ? `Wyplata z subkonta (kurs: 1 ${subCurrency} = ${rate.toFixed(4)} ${mainCurrency})`
              : 'Wyplata z subkonta',
            date: transferDate,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'OUT',
            description: rate !== 1
              ? `Wyplata do Glownego Portfela (kurs ${rate.toFixed(4)})`
              : 'Wyplata do Glownego Portfela',
            savingsAccountId: fromSavingsAccount.id,
            userId: user.id,
          },
        }),
      ]);

      return { success: true, exchangeRate: rate };
    }

    if (fromAccount === 'SAVINGS' && toAccount !== 'MAIN') {
      const toSavingsAccount = await this.getSavingsAccountForUserOrThrow(user.id, toAccount);
      const mainCurrency = user.currency || 'PLN';
      const subCurrency = toSavingsAccount.currency || mainCurrency;
      const rate = await this.getExchangeRate(mainCurrency, subCurrency);
      const convertedAmount = parsedAmount * rate;

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { savings: { decrement: parsedAmount } },
        }),
        this.prisma.savingsAccount.update({
          where: { id: toSavingsAccount.id },
          data: { balance: { increment: convertedAmount } },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'OUT',
            description: rate !== 1
              ? `Przelew na subkonto (kurs: 1 ${mainCurrency} = ${rate.toFixed(4)} ${subCurrency})`
              : 'Przelew na subkonto',
            savingsAccountId: null,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: convertedAmount,
            type: 'IN',
            description: rate !== 1
              ? `Przelew z Glownych Oszczednosci (kurs ${rate.toFixed(4)})`
              : 'Przelew z Glownych Oszczednosci',
            savingsAccountId: toSavingsAccount.id,
            userId: user.id,
          },
        }),
      ]);

      return { success: true, exchangeRate: rate };
    }

    if (fromAccount !== 'MAIN' && toAccount === 'SAVINGS') {
      const fromSavingsAccount = await this.getSavingsAccountForUserOrThrow(
        user.id,
        fromAccount,
      );
      const mainCurrency = user.currency || 'PLN';
      const subCurrency = fromSavingsAccount.currency || mainCurrency;
      const rate = await this.getExchangeRate(subCurrency, mainCurrency);
      const convertedAmount = parsedAmount * rate;

      await this.prisma.$transaction([
        this.prisma.savingsAccount.update({
          where: { id: fromSavingsAccount.id },
          data: { balance: { decrement: parsedAmount } },
        }),
        this.prisma.user.update({
          where: { id: user.id },
          data: { savings: { increment: convertedAmount } },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: parsedAmount,
            type: 'OUT',
            description: rate !== 1
              ? `Przelew na Glowne Oszczednosci (kurs: 1 ${subCurrency} = ${rate.toFixed(4)} ${mainCurrency})`
              : 'Przelew na Glowne Oszczednosci',
            savingsAccountId: fromSavingsAccount.id,
            userId: user.id,
          },
        }),
        this.prisma.savingsTransaction.create({
          data: {
            amount: convertedAmount,
            type: 'IN',
            description: rate !== 1
              ? `Przelew z subkonta (kurs ${rate.toFixed(4)})`
              : 'Przelew z subkonta',
            savingsAccountId: null,
            userId: user.id,
          },
        }),
      ]);

      return { success: true, exchangeRate: rate };
    }

    const fromSavingsAccount = await this.getSavingsAccountForUserOrThrow(
      user.id,
      fromAccount,
    );
    const toSavingsAccount = await this.getSavingsAccountForUserOrThrow(user.id, toAccount);
    const fromCurrency = fromSavingsAccount.currency || (user.currency || 'PLN');
    const toCurrency = toSavingsAccount.currency || (user.currency || 'PLN');
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = parsedAmount * rate;

    await this.prisma.$transaction([
      this.prisma.savingsAccount.update({
        where: { id: fromSavingsAccount.id },
        data: { balance: { decrement: parsedAmount } },
      }),
      this.prisma.savingsAccount.update({
        where: { id: toSavingsAccount.id },
        data: { balance: { increment: convertedAmount } },
      }),
      this.prisma.savingsTransaction.create({
        data: {
          amount: parsedAmount,
          type: 'OUT',
          description: rate !== 1
            ? `Przelew wewnetrzny (kurs: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency})`
            : 'Przelew wewnetrzny (Wychodzacy)',
          savingsAccountId: fromSavingsAccount.id,
          userId: user.id,
        },
      }),
      this.prisma.savingsTransaction.create({
        data: {
          amount: convertedAmount,
          type: 'IN',
          description: rate !== 1
            ? `Przelew wewnetrzny (kurs ${rate.toFixed(4)})`
            : 'Przelew wewnetrzny (Przychodzacy)',
          savingsAccountId: toSavingsAccount.id,
          userId: user.id,
        },
      }),
    ]);

    return { success: true, exchangeRate: rate };
  }
}
