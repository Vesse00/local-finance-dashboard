import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak usera" }, { status: 401 });

    const accounts = await prisma.savingsAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      mainSavings: user.savings,
      accounts: accounts,
      currency: user.currency || "PLN"
    });
  } catch (err) {
    return NextResponse.json({ error: "Błąd" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak usera" }, { status: 401 });

    const { name, balance, type } = await req.json();
    const newBalance = parseFloat(balance);

    // BLOKADA: Sprawdzamy czy użytkownik ma już IKE lub IKZE
    if (type === "IKE" || type === "IKZE") {
      const existingAccount = await prisma.savingsAccount.findFirst({
        where: { userId: user.id, type: type }
      });

      if (existingAccount) {
        return NextResponse.json(
          { error: `Zgodnie z prawem, możesz posiadać tylko jedno konto ${type}.` }, 
          { status: 400 }
        );
      }
    }

    const newAccount = await prisma.savingsAccount.create({
      data: { userId: user.id, name, balance: newBalance, type }
    });

    if (newBalance > 0) {
      await prisma.savingsTransaction.create({
        data: { amount: newBalance, type: "IN", description: "Saldo początkowe", savingsAccountId: newAccount.id, userId: user.id }
      });
    }
    return NextResponse.json(newAccount);
  } catch (err) { 
    return NextResponse.json({ error: "Błąd przy tworzeniu konta" }, { status: 500 }); 
  }
}

// NOWOŚĆ: Metoda DELETE (Usuwanie konta i zwrot środków)
export async function DELETE(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak usera" }, { status: 401 });

    const { id } = await req.json();

    // 1. Znajdujemy usuwane konto
    const account = await prisma.savingsAccount.findFirst({
      where: { id, userId: user.id }
    });

    if (!account) return NextResponse.json({ error: "Nie znaleziono konta" }, { status: 404 });

    // 2. Jeśli są na nim środki, tworzymy Wpływ do Głównego Portfela (Kalendarza)
    if (account.balance > 0) {
      await prisma.income.create({
        data: {
          userId: user.id,
          amount: account.balance,
          source: "Likwidacja subkonta",
          description: `Zwrot środków z usuniętego konta: ${account.name}`,
          date: new Date()
        }
      });
    }

    // 3. Usuwamy konto z bazy
    await prisma.savingsAccount.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Błąd przy usuwaniu konta" }, { status: 500 });
  }
}