import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    const cars = await prisma.car.findMany({
      where: { userId: user.id },
      include: { events: { orderBy: { date: 'desc' } } }
    });

    const safeCars = JSON.parse(JSON.stringify(cars, (key, value) => typeof value === 'bigint' ? value.toString() : value));
    return NextResponse.json(safeCars);
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const { make, model, plate, year, ocDate, inspectionDate, oilDate } = await req.json();

    // 1. Tworzymy główny pojazd
    const car = await prisma.car.create({
      data: { userId: user.id, make, model, plate, year: year ? parseInt(year) : null }
    });

    // 2. Jeśli podano daty, generujemy początkowe wpisy na "dzisiaj", z ważnością do podanej daty
    const now = new Date();
    if (ocDate) {
      await prisma.carEvent.create({
        data: { carId: car.id, type: "INSURANCE", date: now, nextDueDate: new Date(ocDate), description: "Ubezpieczenie początkowe" }
      });
    }
    if (inspectionDate) {
      await prisma.carEvent.create({
        data: { carId: car.id, type: "INSPECTION", date: now, nextDueDate: new Date(inspectionDate), description: "Przegląd początkowy" }
      });
    }
    if (oilDate) {
      await prisma.carEvent.create({
        data: { carId: car.id, type: "OIL", date: now, nextDueDate: new Date(oilDate), description: "Olej początkowy" }
      });
    }

    return NextResponse.json(car);
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.car.delete({ where: { id } });
    return NextResponse.json({ message: "Usunięto pojazd" });
  } catch (error) {
    return NextResponse.json({ error: "Błąd" }, { status: 500 });
  }
}