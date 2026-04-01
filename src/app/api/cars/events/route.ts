import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

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
      // 1. Szukamy odpowiedniej nazwy w zaleĹĽnoĹ›ci od tego, co robimy w GaraĹĽu
      const categoryName = type === 'REFUELING' ? 'Tankowanie' : 'Auto i Serwis';

      // 2. Sprawdzamy, czy kategoria juĹĽ istnieje dla tego uĹĽytkownika
      let category = await prisma.category.findFirst({
        where: { 
          userId: user.id, 
          name: categoryName 
        }
      });

      // 3. JeĹ›li nie ma, tworzymy jÄ… "w locie"
      if (!category) {
        category = await prisma.category.create({
          data: {
            userId: user.id,
            name: categoryName,
            icon: "â›˝"
          }
        });
      }

      let expenseName = "";
      if (type === "REFUELING") {
        expenseName = `Tankowanie${description ? ` (${description})` : ''}`;
      } else {
        expenseName = `${type === 'INSURANCE' ? 'Ubezpieczenie' : type === 'INSPECTION' ? 'PrzeglÄ…d' : type === 'OIL' ? 'Wymiana oleju' : 'Serwis auta'} (${description || ''})`;
      }

      await prisma.expense.create({
    data: {
      userId: user.id,
      amount: parseFloat(cost),
      currency: "PLN", // TwĂłj model wymaga tego pola!
      description: `GaraĹĽ: ${type === 'REFUELING' ? 'Tankowanie' : 'Serwis/OpĹ‚ata'}`, 
      recipient: "Stacja / Serwis", 
      date: new Date(date || new Date()),
      createdAt: new Date(date || new Date()),
      categoryId: category.id
    }
  });
    }

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: "BĹ‚Ä…d serwera" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.carEvent.delete({ where: { id } });
    return NextResponse.json({ message: "UsuniÄ™to wpis" });
  } catch (error) {
    return NextResponse.json({ error: "BĹ‚Ä…d" }, { status: 500 });
  }
}
