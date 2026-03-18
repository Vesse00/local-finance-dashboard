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
      // 1. Szukamy odpowiedniej nazwy w zależności od tego, co robimy w Garażu
      const categoryName = type === 'REFUELING' ? 'Tankowanie' : 'Auto i Serwis';

      // 2. Sprawdzamy, czy kategoria już istnieje dla tego użytkownika
      let category = await prisma.category.findFirst({
        where: { 
          userId: user.id, 
          name: categoryName 
        }
      });

      // 3. Jeśli nie ma, tworzymy ją "w locie"
      if (!category) {
        category = await prisma.category.create({
          data: {
            userId: user.id,
            name: categoryName,
            icon: "⛽"
          }
        });
      }

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
      currency: "PLN", // Twój model wymaga tego pola!
      description: `Garaż: ${type === 'REFUELING' ? 'Tankowanie' : 'Serwis/Opłata'}`, 
      recipient: "Stacja / Serwis", 
      date: new Date(date || new Date()),
      createdAt: new Date(date || new Date()),
      categoryId: category.id
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