import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const { carId, type, date, nextDueDate, nextDueMileage, cost, description, createExpense, mileage, liters, pricePerLiter } = await req.json();

    const event = await prisma.carEvent.create({
      data: {
        carId, type, description,
        date: new Date(date),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        nextDueMileage: nextDueMileage ? parseInt(nextDueMileage) : null,
        cost: cost ? parseFloat(cost) : null,
        mileage: mileage ? parseInt(mileage) : null,
        liters: liters ? parseFloat(liters) : null,
        pricePerLiter: pricePerLiter ? parseFloat(pricePerLiter) : null,
      }
    });

    if (createExpense && cost) {
      let category = await prisma.category.findFirst({ where: { name: "Samochód" } });
      if (!category) category = await prisma.category.findFirst();

      let expenseName = "";
      if (type === "REFUELING") {
        expenseName = `Tankowanie${description ? ` (${description})` : ''}`;
      } else {
        expenseName = `${type === 'INSURANCE' ? 'Ubezpieczenie' : type === 'INSPECTION' ? 'Przegląd' : type === 'OIL' ? 'Wymiana oleju' : 'Serwis auta'} (${description || ''})`;
      }

      await prisma.expense.create({
        data: {
          userId: user.id,
          amount: parseFloat(cost),
          name: expenseName,
          date: new Date(date),
          categoryId: category?.id || ""
        }
      });
    }

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.carEvent.delete({ where: { id } });
    return NextResponse.json({ message: "Usunięto wpis" });
  } catch (error) {
    return NextResponse.json({ error: "Błąd" }, { status: 500 });
  }
}