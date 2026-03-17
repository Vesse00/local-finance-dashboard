import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Brak tokenu lub hasła." }, { status: 400 });
    }

    // 1. Szukamy usera z tym tokenem, który jeszcze nie wygasł
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() } // Data wygaśnięcia > obecna data
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Token jest nieprawidłowy lub wygasł." }, { status: 400 });
    }

    // 2. Haszowanie nowego hasła
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Aktualizacja hasła i czyszczenie tokenów w bazie
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd serwera." }, { status: 500 });
  }
}