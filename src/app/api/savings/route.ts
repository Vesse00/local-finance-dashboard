import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

const getUserId = async () => {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
};

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const [user, accounts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { savings: true, currency: true } }),
      prisma.savingsAccount.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    ]);

    return NextResponse.json({
      mainSavings: user?.savings ?? 0,
      accounts,
      currency: user?.currency ?? "PLN",
    });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const { name, type, currency } = await req.json();
    if (!name) return NextResponse.json({ error: "Nazwa jest wymagana" }, { status: 400 });

    const account = await prisma.savingsAccount.create({
      data: { name, type: type || "SAVINGS", currency: currency || "PLN", userId },
    });

    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Błąd przy tworzeniu konta" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID jest wymagane" }, { status: 400 });

    await prisma.savingsAccount.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd przy usuwaniu konta" }, { status: 500 });
  }
}
