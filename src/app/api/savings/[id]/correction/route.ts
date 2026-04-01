import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return NextResponse.json({ error: "Brak usera" }, { status: 404 });

    const { newBalance, reason } = await req.json();
    const targetBalance = parseFloat(newBalance);

    if (isNaN(targetBalance) || targetBalance < 0) {
      return NextResponse.json({ error: "NieprawidĹ‚owa kwota" }, { status: 400 });
    }

    // Dynamiczne przypisanie opisu w zaleĹĽnoĹ›ci od rodzaju korekty
    let description = "Korekta salda";
    if (reason === "INTEREST") description = "Kapitalizacja odsetek";
    if (reason === "PROFIT") description = "Zysk z inwestycji (Wzrost wyceny)";
    if (reason === "LOSS") description = "Strata z inwestycji (Spadek wyceny)";
    if (reason === "FEE") description = "OpĹ‚ata za prowadzenie konta / prowizja";
    if (reason === "MANUAL") description = "RÄ™czna korekta salda";

    // -----------------------------------------
    // LOGIKA DLA GĹĂ“WNYCH OSZCZÄDNOĹšCI ("MAIN")
    // -----------------------------------------
    if (resolvedParams.id === "main") {
      const difference = targetBalance - dbUser.savings;
      if (difference === 0) return NextResponse.json({ success: true, message: "Brak rĂłĹĽnicy" });

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
    if (difference === 0) return NextResponse.json({ success: true, message: "Brak rĂłĹĽnicy" });

    // Zapisujemy nowy stan konta oraz Ĺ›lad w historii transakcji
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
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d serwera" }, { status: 500 });
  }
}
