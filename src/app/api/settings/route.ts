import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Pobieranie aktualnych danych użytkownika
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    
    return NextResponse.json({ email: user.email, username: user.username });
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// Zapisywanie zmian (Hasło / E-mail)
export async function PUT(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

    const { currentPassword, newEmail, newPassword } = await req.json();

    if (!currentPassword) {
      return NextResponse.json({ error: "Musisz podać obecne hasło, aby zapisać zmiany." }, { status: 400 });
    }

    // 1. Weryfikacja obecnego hasła (Kluczowy krok bezpieczeństwa!)
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Obecne hasło jest nieprawidłowe." }, { status: 400 });
    }

    const updateData: any = {};

    // 2. Walidacja i przygotowanie zmiany e-maila
    if (newEmail && newEmail !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existingEmail) {
        return NextResponse.json({ error: "Ten adres e-mail jest już przypisany do innego konta." }, { status: 400 });
      }
      updateData.email = newEmail;
    }

    // 3. Walidacja i przygotowanie zmiany hasła
    if (newPassword) {
      if (newPassword.length < 6) {
         return NextResponse.json({ error: "Nowe hasło musi mieć min. 6 znaków." }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Jeśli nic nie zmieniono
    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: "Nie wprowadzono żadnych zmian." }, { status: 400 });
    }

    // 4. Zapis do bazy
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