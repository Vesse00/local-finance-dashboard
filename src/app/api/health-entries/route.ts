import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

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
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    // Dodano "details" do odbieranych parametrów
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
        detasils: details || null // <-- Zapisujemy szczegóły do bazy
      }
    });

    return NextResponse.json({ message: "Dodano pomyślnie", entry });
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    const { id } = await req.json();
    await prisma.healthEntry.delete({ where: { id } });

    return NextResponse.json({ message: "Usunięto pomyślnie" });
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}