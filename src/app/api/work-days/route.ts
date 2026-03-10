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

    const workDays = await prisma.workDay.findMany({
      where: { userId: user.id, ...dateFilter },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(workDays);
  } catch (error) {
    console.error("Błąd pobierania grafiku:", error);
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    const body = await req.json();
    const { date, startTime, endTime, isOvertime, overtimeHours, notes, shiftType } = body;

    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0);

    const workDay = await prisma.workDay.upsert({
      where: { userId_date: { userId: user.id, date: targetDate } },
      update: {
        startTime: startTime || null, 
        endTime: endTime || null, 
        isOvertime: isOvertime || false, 
        overtimeHours: parseFloat(overtimeHours) || 0, 
        notes: notes || "",
        shiftType: shiftType || "REGULAR"
      },
      create: {
        userId: user.id,
        date: targetDate,
        startTime: startTime || null, 
        endTime: endTime || null, 
        isOvertime: isOvertime || false, 
        overtimeHours: parseFloat(overtimeHours) || 0, 
        notes: notes || "",
        shiftType: shiftType || "REGULAR"
      }
    });

    return NextResponse.json({ message: "Zapisano pomyślnie", workDay });
  } catch (error) {
    console.error("Błąd zapisu dnia pracy:", error);
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}