import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const { amount, fromAccount, toAccount, date } = await req.json();
    const parsedAmount = parseFloat(amount);
    const user = await prisma.user.findFirst();
    if (!user || isNaN(parsedAmount) || parsedAmount <= 0) return NextResponse.json({ error: "Błąd" }, { status: 400 });

    const transferDate = date ? new Date(date) : new Date();

    // 1. GŁÓWNY PORTFEL -> GŁÓWNE OSZCZĘDNOŚCI
    if (fromAccount === "MAIN" && toAccount === "SAVINGS") {
      await prisma.user.update({ where: { id: user.id }, data: { savings: { increment: parsedAmount } } });
      await prisma.expense.create({ data: { amount: parsedAmount, description: "Transfer na oszczędności", type: "SAVING", date: transferDate, userId: user.id } });
      await prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "IN", description: "Wpłata z Głównego Portfela", savingsAccountId: null, userId: user.id } });
    } 
    // 2. GŁÓWNE OSZCZĘDNOŚCI -> GŁÓWNY PORTFEL
    else if (fromAccount === "SAVINGS" && toAccount === "MAIN") {
      await prisma.user.update({ where: { id: user.id }, data: { savings: { decrement: parsedAmount } } });
      await prisma.income.create({ data: { amount: parsedAmount, source: "Z oszczędności", description: "Transfer ze skarbonki", date: transferDate, userId: user.id } });
      await prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "OUT", description: "Wypłata do Głównego Portfela", savingsAccountId: null, userId: user.id } });
    }
    // 3. GŁÓWNY PORTFEL -> SUBKONTO (np. IKE)
    else if (fromAccount === "MAIN" && toAccount !== "SAVINGS") {
      await prisma.savingsAccount.update({ where: { id: toAccount }, data: { balance: { increment: parsedAmount } } });
      await prisma.expense.create({ data: { amount: parsedAmount, description: "Transfer na subkonto oszczędnościowe", type: "SAVING", date: transferDate, userId: user.id } });
      await prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "IN", description: "Wpłata z Głównego Portfela", savingsAccountId: toAccount, userId: user.id } });
    }
    // 4. SUBKONTO -> GŁÓWNY PORTFEL
    else if (fromAccount !== "SAVINGS" && toAccount === "MAIN") {
      await prisma.savingsAccount.update({ where: { id: fromAccount }, data: { balance: { decrement: parsedAmount } } });
      await prisma.income.create({ data: { amount: parsedAmount, source: "Z subkonta", description: "Wypłata z subkonta", date: transferDate, userId: user.id } });
      await prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "OUT", description: "Wypłata do Głównego Portfela", savingsAccountId: fromAccount, userId: user.id } });
    }
    // 5. GŁÓWNE OSZCZĘDNOŚCI -> SUBKONTO (np. IKE)
    else if (fromAccount === "SAVINGS" && toAccount !== "MAIN") {
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { savings: { decrement: parsedAmount } } }),
        prisma.savingsAccount.update({ where: { id: toAccount }, data: { balance: { increment: parsedAmount } } }),
        prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "OUT", description: "Przelew na subkonto", savingsAccountId: null, userId: user.id } }),
        prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "IN", description: "Przelew z Głównych Oszczędności", savingsAccountId: toAccount, userId: user.id } })
      ]);
    }
    // 6. SUBKONTO -> GŁÓWNE OSZCZĘDNOŚCI
    else if (fromAccount !== "MAIN" && toAccount === "SAVINGS") {
      await prisma.$transaction([
        prisma.savingsAccount.update({ where: { id: fromAccount }, data: { balance: { decrement: parsedAmount } } }),
        prisma.user.update({ where: { id: user.id }, data: { savings: { increment: parsedAmount } } }),
        prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "OUT", description: "Przelew na Główne Oszczędności", savingsAccountId: fromAccount, userId: user.id } }),
        prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "IN", description: "Przelew z subkonta", savingsAccountId: null, userId: user.id } })
      ]);
    }
    // 7. MIĘDZY SUBKONTAMI (np. IKE -> IKZE)
    else {
      await prisma.$transaction([
        prisma.savingsAccount.update({ where: { id: fromAccount }, data: { balance: { decrement: parsedAmount } } }),
        prisma.savingsAccount.update({ where: { id: toAccount }, data: { balance: { increment: parsedAmount } } }),
        prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "OUT", description: "Przelew wewnętrzny (Wychodzący)", savingsAccountId: fromAccount, userId: user.id } }),
        prisma.savingsTransaction.create({ data: { amount: parsedAmount, type: "IN", description: "Przelew wewnętrzny (Przychodzący)", savingsAccountId: toAccount, userId: user.id } })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Błąd serwera" }, { status: 500 }); }
}