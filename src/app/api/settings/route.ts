import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    
    // Zwracamy też lokalizację
    return NextResponse.json({ 
      email: user.email, 
      username: user.username, 
      location: user.location || "" 
    });
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const { currentPassword, newEmail, newPassword, location } = await req.json();

    const updateData: any = {};

    // 1. ZMIANA PREFERENCJI (Utilities) - Nie wymaga obecnego hasła!
    if (location !== undefined && location !== user.location) {
      updateData.location = location;
    }

    // 2. ZMIANA ZABEZPIECZEŃ (E-mail / Hasło) - Kategorycznie wymaga obecnego hasła!
    if (newEmail || newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Musisz podać obecne hasło, aby zmienić e-mail lub hasło." }, { status: 400 });
      }
      
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Obecne hasło jest nieprawidłowe." }, { status: 400 });
      }

      if (newEmail && newEmail !== user.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email: newEmail } });
        if (existingEmail) {
          return NextResponse.json({ error: "Ten adres e-mail jest już przypisany do innego konta." }, { status: 400 });
        }
        updateData.email = newEmail;
      }

      if (newPassword) {
        if (newPassword.length < 6) {
           return NextResponse.json({ error: "Nowe hasło musi mieć min. 6 znaków." }, { status: 400 });
        }
        updateData.password = await bcrypt.hash(newPassword, 10);
      }
    }

    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: "Nie wprowadzono żadnych zmian." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera podczas zapisywania zmian." }, { status: 500 });
  }
}