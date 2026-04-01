import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const items = await prisma.drawerItem.findMany({
      where: { userId: user.id },
      orderBy: { endDate: 'asc' }
    });

    const safeItems = JSON.parse(JSON.stringify(items, (key, value) => typeof value === 'bigint' ? value.toString() : value));
    return NextResponse.json(safeItems);
  } catch (error) {
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

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

      // ĹšcieĹĽka do folderu public/uploads (tworzy go, jeĹ›li nie istnieje)
      const uploadDir = path.join(process.cwd(), "public/uploads");
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}

      // Generujemy unikalnÄ… nazwÄ™ pliku, ĹĽeby siÄ™ nie nadpisaĹ‚y
      const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, uniqueName);
      
      await writeFile(filePath, buffer);
      documentUrl = `/uploads/${uniqueName}`; // ĹšcieĹĽka, ktĂłrÄ… zapiszemy w bazie
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
          description: title + (isRecurring ? " (Abonament)" : " (Szuflada)"),
          date: new Date(startDate),
          categoryId: category?.id || ""
        }
      });
    }

    return NextResponse.json({ message: "Zapisano pomyĹ›lnie", drawerItem });
  } catch (error) {
    console.error("BĹ‚Ä…d zapisu:", error);
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const { id } = await req.json();
    await prisma.drawerItem.delete({ where: { id } });
    // W przyszĹ‚oĹ›ci moĹĽna tu teĹĽ dodaÄ‡ usuwanie pliku z dysku (fs.unlink)

    return NextResponse.json({ message: "UsuniÄ™to pomyĹ›lnie" });
  } catch (error) {
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}
