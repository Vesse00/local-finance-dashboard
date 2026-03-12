import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak usera" }, { status: 401 });

    // ----------------------------------------------------
    // JEŚLI WCHODZIMY W KARTĘ "GŁÓWNYCH OSZCZĘDNOŚCI"
    // ----------------------------------------------------
    if (resolvedParams.id === "main") {
      // 1. Pobieramy stare odkładanie z kalendarza (Expense typu SAVING)
      const expenses = await prisma.expense.findMany({ where: { userId: user.id, type: "SAVING" } });
      
      // 2. Pobieramy stare wypłaty z oszczędności (Income o źródle "Z oszczędności")
      const incomes = await prisma.income.findMany({ where: { userId: user.id, source: "Z oszczędności" } });
      
      // 3. Pobieramy nowoczesne transakcje z nowego systemu transferów
      const txs = await prisma.savingsTransaction.findMany({ where: { userId: user.id, savingsAccountId: null } });

      const combined: any[] = [];
      
      // Dodajemy do listy najnowsze wpisy z tabeli transferów
      txs.forEach(t => combined.push({ id: t.id, type: t.type, amount: t.amount, description: t.description, date: t.date }));

      // Sprytnie dodajemy stare wpisy z kalendarza, upewniając się, że ich nie dublujemy 
      // (ponieważ nowy system transferów tworzy oba te rekordy jednocześnie)
      expenses.forEach(e => {
        const exists = txs.find(t => t.amount === e.amount && Math.abs(new Date(t.date).getTime() - new Date(e.date).getTime()) < 5000);
        if(!exists) combined.push({ id: e.id, type: "IN", amount: e.amount, description: e.description || "Odkładanie (Kalendarz)", date: e.date });
      });

      incomes.forEach(i => {
        const exists = txs.find(t => t.amount === i.amount && Math.abs(new Date(t.date).getTime() - new Date(i.date).getTime()) < 5000);
        if(!exists) combined.push({ id: i.id, type: "OUT", amount: i.amount, description: i.description || "Wypłata (Kalendarz)", date: i.date });
      });

      // Sortujemy całość od najnowszych
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return NextResponse.json({ 
        id: "main", 
        name: "Główne Oszczędności", 
        type: "SAVINGS", 
        balance: user.savings, 
        history: combined 
      });
    }

    // ----------------------------------------------------
    // JEŚLI WCHODZIMY W KARTĘ KONKRETNEGO SUBKONTA (IKE/IKZE)
    // ----------------------------------------------------
    const account = await prisma.savingsAccount.findFirst({
      where: { id: resolvedParams.id, userId: user.id }
    });
    if (!account) return NextResponse.json({ error: "Konto nie istnieje" }, { status: 404 });

    const history = await prisma.savingsTransaction.findMany({
      where: { savingsAccountId: resolvedParams.id, userId: user.id },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ ...account, history });
  } catch (err) { 
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 }); 
  }
}