import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    const items = await prisma.drawerItem.findMany({
      where: { userId: user.id },
      orderBy: { endDate: 'asc' }
    });

    const safeItems = JSON.parse(JSON.stringify(items, (key, value) => typeof value === 'bigint' ? value.toString() : value));
    return NextResponse.json(safeItems);
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    // Odbieramy dane jako FormData (wspiera pliki)
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const cost = formData.get("cost") as string;
    const isRecurring = formData.get("isRecurring") === "true";
    const createExpense = formData.get("createExpense") === "true";
    const notes = formData.get("notes") as string;
    
    // Odbieramy plik
    const file = formData.get("file") as File | null;
    let documentUrl = null;

    // Logika zapisu pliku na dysk
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Ścieżka do folderu public/uploads (tworzy go, jeśli nie istnieje)
      const uploadDir = path.join(process.cwd(), "public/uploads");
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}

      // Generujemy unikalną nazwę pliku, żeby się nie nadpisały
      const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, uniqueName);
      
      await writeFile(filePath, buffer);
      documentUrl = `/uploads/${uniqueName}`; // Ścieżka, którą zapiszemy w bazie
    }

    // 1. Zapisujemy w Cyfrowej Szufladzie z linkiem do pliku
    const drawerItem = await prisma.drawerItem.create({
      data: {
        userId: user.id,
        title,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        cost: cost ? parseFloat(cost) : null,
        isRecurring: isRecurring || false,
        notes: notes || "",
        documentUrl: documentUrl // Zapisujemy wygenerowany link!
      }
    });

    // 2. Automatyczne generowanie kosztu w finansach
    if (createExpense && cost) {
      let category = await prisma.category.findFirst({ where: { name: "Rachunki" } });
      if (!category) category = await prisma.category.findFirst();

      await prisma.expense.create({
        data: {
          userId: user.id,
          amount: parseFloat(cost),
          name: title + (isRecurring ? " (Abonament)" : " (Szuflada)"),
          date: new Date(startDate),
          categoryId: category?.id || ""
        }
      });
    }

    return NextResponse.json({ message: "Zapisano pomyślnie", drawerItem });
  } catch (error) {
    console.error("Błąd zapisu:", error);
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    const { id } = await req.json();
    await prisma.drawerItem.delete({ where: { id } });
    // W przyszłości można tu też dodać usuwanie pliku z dysku (fs.unlink)

    return NextResponse.json({ message: "Usunięto pomyślnie" });
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}