import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month");

    let dateFilter = {};
    if (monthStr) {
      const [year, month] = monthStr.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = { date: { gte: startDate, lte: endDate } };
    }

    const entries = await prisma.healthEntry.findMany({
      where: { userId: user.id, ...dateFilter },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    // Dodano "details" do odbieranych parametrĂłw
    const { date, type, title, calories, details } = await req.json();

    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0);

    const entry = await prisma.healthEntry.create({
      data: {
        userId: user.id,
        date: targetDate,
        type,
        title,
        calories: calories ? parseInt(calories) : 0,
        detasils: details || null // <-- Zapisujemy szczegĂłĹ‚y do bazy
      }
    });

    return NextResponse.json({ message: "Dodano pomyĹ›lnie", entry });
  } catch (error) {
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const { id } = await req.json();
    await prisma.healthEntry.delete({ where: { id } });

    return NextResponse.json({ message: "UsuniÄ™to pomyĹ›lnie" });
  } catch (error) {
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}
