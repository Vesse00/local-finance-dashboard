import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };
    
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