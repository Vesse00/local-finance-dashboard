import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const getUserId = async () => {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
};

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });

    return NextResponse.json({
      email: user.email,
      username: user.username,
      location: user.location || "",
      currency: user.currency || "PLN",
      payday: user.payday ?? 10,
      role: user.role ?? "USER",
    });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });

    const payload = await req.json();
    const updateData: Record<string, unknown> = {};

    if (payload.location !== undefined && payload.location !== user.location)
      updateData.location = payload.location;
    if (payload.currency !== undefined && payload.currency !== user.currency)
      updateData.currency = payload.currency;
    if (payload.payday !== undefined && Number(payload.payday) !== user.payday)
      updateData.payday = Number(payload.payday);

    if (payload.newEmail || payload.newPassword) {
      if (!payload.currentPassword)
        return NextResponse.json({ error: "Musisz podać obecne hasło, aby zmienić e-mail lub hasło." }, { status: 400 });

      const isValid = await bcrypt.compare(payload.currentPassword, user.password);
      if (!isValid)
        return NextResponse.json({ error: "Obecne hasło jest nieprawidłowe." }, { status: 400 });

      if (payload.newEmail && payload.newEmail !== user.email) {
        const taken = await prisma.user.findUnique({ where: { email: payload.newEmail } });
        if (taken)
          return NextResponse.json({ error: "Ten adres e-mail jest już przypisany do innego konta." }, { status: 400 });
        updateData.email = payload.newEmail;
      }

      if (payload.newPassword) {
        if (payload.newPassword.length < 6)
          return NextResponse.json({ error: "Nowe hasło musi mieć min. 6 znaków." }, { status: 400 });
        updateData.password = await bcrypt.hash(payload.newPassword, 10);
      }
    }

    if (Object.keys(updateData).length === 0)
      return NextResponse.json({ error: "Nie wprowadzono żadnych zmian." }, { status: 400 });

    await prisma.user.update({ where: { id: userId }, data: updateData });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
