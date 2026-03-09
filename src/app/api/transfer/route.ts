import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, fromAccount, toAccount, date } = body;

    if (!amount || !fromAccount || !toAccount) {
      return NextResponse.json({ error: "Brakujące dane" }, { status: 400 });
    }

    if (fromAccount === toAccount) {
      return NextResponse.json({ error: "Konta muszą się różnić" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Nieprawidłowa kwota" }, { status: 400 });
    }

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 401 });
    }

    const userId = user.id;
    const transferDate = date ? new Date(date) : new Date();

    // 1. Z PORTFELA (Głównego) -> NA OSZCZĘDNOŚCI
    if (fromAccount === "MAIN" && toAccount === "SAVINGS") {
      await prisma.user.update({
        where: { id: userId },
        data: { savings: { increment: parsedAmount } }
      });
      await prisma.expense.create({
        data: {
          amount: parsedAmount,
          description: "Transfer na oszczędności",
          type: "SAVING",
          date: transferDate,
          userId
        }
      });
    } 
    // 2. Z OSZCZĘDNOŚCI -> DO PORTFELA (Głównego)
    else if (fromAccount === "SAVINGS" && toAccount === "MAIN") {
      await prisma.user.update({
        where: { id: userId },
        data: { savings: { decrement: parsedAmount } }
      });
      await prisma.income.create({
        data: {
          amount: parsedAmount,
          source: "Z oszczędności",
          description: "Transfer ze skarbonki",
          date: transferDate,
          userId
        }
      });
    } 
    // 3. Zabezpieczenie na przyszłe konta
    else {
      return NextResponse.json({ error: "Ten typ transferu nie jest jeszcze obsługiwany" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Transfer zakończony sukcesem" }, { status: 200 });

  } catch (error) {
    console.error("Błąd API /api/transfer:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}