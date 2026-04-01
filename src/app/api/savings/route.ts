import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });

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
    return NextResponse.json({ error: "BĹ‚Ä…d" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });

    const { name, balance, type } = await req.json();
    const newBalance = parseFloat(balance);

    // BLOKADA: Sprawdzamy czy uĹĽytkownik ma juĹĽ IKE lub IKZE
    if (type === "IKE" || type === "IKZE") {
      const existingAccount = await prisma.savingsAccount.findFirst({
        where: { userId: user.id, type: type }
      });

      if (existingAccount) {
        return NextResponse.json(
          { error: `Zgodnie z prawem, moĹĽesz posiadaÄ‡ tylko jedno konto ${type}.` }, 
          { status: 400 }
        );
      }
    }

    const newAccount = await prisma.savingsAccount.create({
      data: { userId: user.id, name, balance: newBalance, type }
    });

    if (newBalance > 0) {
      await prisma.savingsTransaction.create({
        data: { amount: newBalance, type: "IN", description: "Saldo poczÄ…tkowe", savingsAccountId: newAccount.id, userId: user.id }
      });
    }
    return NextResponse.json(newAccount);
  } catch (err) { 
    return NextResponse.json({ error: "BĹ‚Ä…d przy tworzeniu konta" }, { status: 500 }); 
  }
}

// NOWOĹšÄ†: Metoda DELETE (Usuwanie konta i zwrot Ĺ›rodkĂłw)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });

    const { id } = await req.json();

    // 1. Znajdujemy usuwane konto
    const account = await prisma.savingsAccount.findFirst({
      where: { id, userId: user.id }
    });

    if (!account) return NextResponse.json({ error: "Nie znaleziono konta" }, { status: 404 });

    // 2. JeĹ›li sÄ… na nim Ĺ›rodki, tworzymy WpĹ‚yw do GĹ‚Ăłwnego Portfela (Kalendarza)
    if (account.balance > 0) {
      await prisma.income.create({
        data: {
          userId: user.id,
          amount: account.balance,
          source: "Likwidacja subkonta",
          description: `Zwrot Ĺ›rodkĂłw z usuniÄ™tego konta: ${account.name}`,
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
    return NextResponse.json({ error: "BĹ‚Ä…d przy usuwaniu konta" }, { status: 500 });
  }
}
