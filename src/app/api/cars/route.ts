import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const cars = await prisma.car.findMany({
      where: { userId: user.id },
      include: { events: { orderBy: { date: 'desc' } } }
    });

    const safeCars = JSON.parse(JSON.stringify(cars, (key, value) => typeof value === 'bigint' ? value.toString() : value));
    return NextResponse.json(safeCars);
  } catch (error) {
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const { make, model, plate, year, ocDate, inspectionDate, oilDate } = await req.json();

    // 1. Tworzymy gĹ‚Ăłwny pojazd
    const car = await prisma.car.create({
      data: { userId: user.id, make, model, plate, year: year ? parseInt(year) : null }
    });

    // 2. JeĹ›li podano daty, generujemy poczÄ…tkowe wpisy na "dzisiaj", z waĹĽnoĹ›ciÄ… do podanej daty
    const now = new Date();
    if (ocDate) {
      await prisma.carEvent.create({
        data: { carId: car.id, type: "INSURANCE", date: now, nextDueDate: new Date(ocDate), description: "Ubezpieczenie poczÄ…tkowe" }
      });
    }
    if (inspectionDate) {
      await prisma.carEvent.create({
        data: { carId: car.id, type: "INSPECTION", date: now, nextDueDate: new Date(inspectionDate), description: "PrzeglÄ…d poczÄ…tkowy" }
      });
    }
    if (oilDate) {
      await prisma.carEvent.create({
        data: { carId: car.id, type: "OIL", date: now, nextDueDate: new Date(oilDate), description: "Olej poczÄ…tkowy" }
      });
    }

    return NextResponse.json(car);
  } catch (error) {
    return NextResponse.json({ error: "BĹ‚Ä…d serwera" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.car.delete({ where: { id } });
    return NextResponse.json({ message: "UsuniÄ™to pojazd" });
  } catch (error) {
    return NextResponse.json({ error: "BĹ‚Ä…d" }, { status: 500 });
  }
}
