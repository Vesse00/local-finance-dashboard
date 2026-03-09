import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || password.length < 6) {
      return NextResponse.json({ message: "Nieprawidłowe dane logowania." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Taki użytkownik już istnieje!" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Tworzenie użytkownika
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    // NOWOŚĆ: Generowanie domyślnych kategorii dla nowego użytkownika!
    const defaultCategories = [
      { name: "Jedzenie", icon: "🍔", userId: user.id },
      { name: "Transport", icon: "🚗", userId: user.id },
      { name: "Dom", icon: "🏠", userId: user.id },
      { name: "Rozrywka", icon: "🎮", userId: user.id },
    ];

    await prisma.category.createMany({
      data: defaultCategories
    });

    return NextResponse.json({ message: "Zarejestrowano pomyślnie!", user: { username: user.username } }, { status: 201 });
  } catch (error: any) {
    console.error("Błąd rejestracji:", error);
    return NextResponse.json({ message: "Wystąpił błąd serwera." }, { status: 500 });
  }
}