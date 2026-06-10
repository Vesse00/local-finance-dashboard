import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

const getAdminUserId = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") return null;
  return user.id;
};

export async function GET() {
  try {
    const adminId = await getAdminUserId();
    if (!adminId) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

    const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });
    return NextResponse.json(settings ?? { id: "singleton", updateCheckHour: 3, updateAvailable: false });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminId = await getAdminUserId();
    if (!adminId) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

    const { updateCheckHour } = await req.json();

    const hour = Number(updateCheckHour);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return NextResponse.json({ error: "Godzina musi być wartością 0–23" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", updateCheckHour: hour },
      update: { updateCheckHour: hour },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
