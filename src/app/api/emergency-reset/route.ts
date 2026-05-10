import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(req: Request) {
  try {
    // 1. Sprawdzamy, czy użytkownik jest zalogowany
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Brak autoryzacji. Zaloguj się ponownie." }, { status: 401 });
    }

    // 2. Pobieramy hasło z zapytania
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Hasło jest wymagane do potwierdzenia operacji." }, { status: 400 });
    }

    // 3. Pobieramy użytkownika z bazy, aby uzyskać jego zahashowane hasło i ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "Nie znaleziono użytkownika w bazie." }, { status: 404 });
    }

    // 4. Weryfikujemy, czy podane hasło jest poprawne
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: "Nieprawidłowe hasło. Akcja przerwana." }, { status: 401 });
    }

    // 5. BEZPIECZNE USUWANIE REKORDÓW (TRANSACJA)
    // Używamy $transaction, aby upewnić się, że w przypadku błędu baza danych się nie "rozjedzie".
    // Kasujemy wszystkie powiązane rekordy (ale NIE tabelę User!)
    await prisma.$transaction([
      prisma.expense.deleteMany({ where: { userId: user.id } }),
      prisma.income.deleteMany({ where: { userId: user.id } }),
      prisma.recurringPayment.deleteMany({ where: { userId: user.id } }),
      prisma.monthSummary.deleteMany({ where: { userId: user.id } }),
      prisma.workDay.deleteMany({ where: { userId: user.id } }),
      prisma.healthDay.deleteMany({ where: { userId: user.id } }),
      prisma.healthEntry.deleteMany({ where: { userId: user.id } }),
      prisma.drawerItem.deleteMany({ where: { userId: user.id } }),
      
      // Relacje zagnieżdżone w CarEvent / SavingsTransaction zostaną usunięte
      // kaskadowo, gdy usuniemy główne rekordy Car i SavingsAccount (dzięki onDelete: Cascade)
      prisma.car.deleteMany({ where: { userId: user.id } }),
      prisma.savingsTransaction.deleteMany({ where: { userId: user.id } }),
      prisma.savingsAccount.deleteMany({ where: { userId: user.id } }),
      
      prisma.energyEntry.deleteMany({ where: { userId: user.id } }),

      // Opcjonalnie: Jeśli chcesz wyczyścić także stworzone przez niego Kategorie:
      // prisma.category.deleteMany({ where: { userId: user.id } }),
    ]);

    // Opcjonalnie: Wyzerowanie globalnych oszczędności bezpośrednio w tabeli User
    await prisma.user.update({
      where: { id: user.id },
      data: { savings: 0.0 }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Proces zakończony. Wszystkie Twoje dane zostały trwale wyczyszczone." 
    });

  } catch (error) {
    console.error("Błąd podczas resetu danych (Danger Zone):", error);
    return NextResponse.json({ error: "Błąd serwera. Skontaktuj się z administratorem." }, { status: 500 });
  }
}