import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });
    
    const resolvedParams = await params;

    const car = await prisma.car.findFirst({
      where: { id: resolvedParams.id, userId: user.id },
      include: { events: { orderBy: { date: 'desc' } } }
    });

    if (!car) return NextResponse.json({ error: "Nie znaleziono pojazdu" }, { status: 404 });

    const safeCar = JSON.parse(JSON.stringify(car, (key, value) => typeof value === 'bigint' ? value.toString() : value));
    return NextResponse.json(safeCar);
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}