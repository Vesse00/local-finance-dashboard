import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month");

    let dateFilter = {};
    if (monthStr) {
      const [year, month] = monthStr.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = { date: { gte: startDate, lte: endDate } };
    }

    const healthDays = await prisma.healthDay.findMany({
      where: { userId: user.id, ...dateFilter },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(healthDays);
  } catch (error) {
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const body = await req.json();
    // Dodano odbieranie wymiarĂłw: chest, waist, hips, biceps, thigh
    const { date, weight, waterGlasses, calories, workout, chest, waist, hips, biceps, thigh } = body;

    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0);

    const healthDay = await prisma.healthDay.upsert({
      where: { userId_date: { userId: user.id, date: targetDate } },
      update: {
        weight: weight ? parseFloat(weight) : null,
        waterGlasses: waterGlasses !== undefined ? parseInt(waterGlasses) : undefined,
        calories: calories ? parseInt(calories) : null,
        workout: workout !== undefined ? workout : undefined,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        biceps: biceps ? parseFloat(biceps) : null,
        thigh: thigh ? parseFloat(thigh) : null,
      },
      create: {
        userId: user.id,
        date: targetDate,
        weight: weight ? parseFloat(weight) : null,
        waterGlasses: waterGlasses !== undefined ? parseInt(waterGlasses) : 0,
        calories: calories ? parseInt(calories) : null,
        workout: workout || null,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        biceps: biceps ? parseFloat(biceps) : null,
        thigh: thigh ? parseFloat(thigh) : null,
      }
    });

    return NextResponse.json({ message: "Zapisano pomyĹ›lnie", healthDay });
  } catch (error) {
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}
