import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const { newBalance, reason } = await req.json();
    const targetBalance = parseFloat(newBalance);

    if (isNaN(targetBalance) || targetBalance < 0) {
      return NextResponse.json({ error: "Nieprawidłowa kwota" }, { status: 400 });
    }

    // Dynamiczne przypisanie opisu w zależności od rodzaju korekty
    let description = "Korekta salda";
    if (reason === "INTEREST") description = "Kapitalizacja odsetek";
    if (reason === "PROFIT") description = "Zysk z inwestycji (Wzrost wyceny)";
    if (reason === "LOSS") description = "Strata z inwestycji (Spadek wyceny)";
    if (reason === "FEE") description = "Opłata za prowadzenie konta / prowizja";
    if (reason === "MANUAL") description = "Ręczna korekta salda";

    // -----------------------------------------
    // LOGIKA DLA GŁÓWNYCH OSZCZĘDNOŚCI ("MAIN")
    // -----------------------------------------
    if (resolvedParams.id === "main") {
      const difference = targetBalance - user.savings;
      if (difference === 0) return NextResponse.json({ success: true, message: "Brak różnicy" });

      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { savings: targetBalance } }),
        prisma.savingsTransaction.create({
          data: {
            amount: Math.abs(difference),
            type: difference > 0 ? "IN" : "OUT",
            description: description,
            savingsAccountId: null,
            userId: user.id
          }
        })
      ]);
      return NextResponse.json({ success: true });
    }

    // -----------------------------------------
    // LOGIKA DLA SUBKONT (IKE, IKZE, INNE)
    // -----------------------------------------
    const account = await prisma.savingsAccount.findFirst({
      where: { id: resolvedParams.id, userId: user.id }
    });

    if (!account) return NextResponse.json({ error: "Nie znaleziono konta" }, { status: 404 });

    const difference = targetBalance - account.balance;
    if (difference === 0) return NextResponse.json({ success: true, message: "Brak różnicy" });

    // Zapisujemy nowy stan konta oraz ślad w historii transakcji
    await prisma.$transaction([
      prisma.savingsAccount.update({
        where: { id: account.id },
        data: { balance: targetBalance }
      }),
      prisma.savingsTransaction.create({
        data: {
          amount: Math.abs(difference),
          type: difference > 0 ? "IN" : "OUT",
          description: description,
          savingsAccountId: account.id,
          userId: user.id
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Correction API Error:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}