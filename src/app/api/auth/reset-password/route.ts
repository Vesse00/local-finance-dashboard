import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Brak tokenu lub hasła." }, { status: 400 });
    }

    // 1. Szukamy usera z tym tokenem
    const user = await prisma.user.findUnique({
      where: { resetToken: token }
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
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
  } catch (error: any) {
    console.error("Błąd resetowania hasła:", error);
    return NextResponse.json({ error: error.message || "Wystąpił błąd serwera." }, { status: 500 });
  }
}