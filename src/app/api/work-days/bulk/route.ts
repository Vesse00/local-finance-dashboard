import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    const body = await req.json();
    const { days } = body;

    if (!days || !Array.isArray(days)) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

    await prisma.$transaction(
      days.map((day: any) => {
        const targetDate = new Date(day.date);
        targetDate.setHours(12, 0, 0, 0);
        
        const sType = day.shiftType || "REGULAR";
        const noteText = sType === "VACATION" ? "Urlop Wypoczynkowy" : sType === "SICK" ? "Zwolnienie Lekarskie" : "Wygenerowano automatycznie";

        return prisma.workDay.upsert({
          where: { userId_date: { userId: user.id, date: targetDate } },
          update: {
            startTime: day.startTime || null,
            endTime: day.endTime || null,
            shiftType: sType,
            isOvertime: false,
            overtimeHours: 0,
            notes: noteText
          },
          create: {
            userId: user.id,
            date: targetDate,
            startTime: day.startTime || null,
            endTime: day.endTime || null,
            shiftType: sType,
            isOvertime: false,
            overtimeHours: 0,
            notes: noteText
          }
        });
      })
    );

    return NextResponse.json({ message: `Pomyślnie wygenerowano grafik.` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd podczas generowania." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    const body = await req.json();
    const { startDate, endDate, selectedWeekDays } = body;

    if (!startDate || !endDate || !Array.isArray(selectedWeekDays)) {
      return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const records = await prisma.workDay.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } }
    });

    const idsToDelete = records
      .filter(r => selectedWeekDays.includes(new Date(r.date).getDay()))
      .map(r => r.id);

    if (idsToDelete.length > 0) {
      await prisma.workDay.deleteMany({ where: { id: { in: idsToDelete } } });
    }

    return NextResponse.json({ message: `Pomyślnie usunięto ${idsToDelete.length} wpisów.` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd podczas usuwania." }, { status: 500 });
  }
}