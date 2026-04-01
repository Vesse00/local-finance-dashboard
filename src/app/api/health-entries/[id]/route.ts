import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.healthEntry.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Wpis nie odnaleziony lub brak uprawnień" }, { status: 404 });
    }

    const entry = await prisma.healthEntry.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        calories: body.calories !== undefined ? parseInt(body.calories) : existing.calories,
        detasils: body.details !== undefined ? body.details : existing.detasils,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Wystąpił błąd przy aktualizacji wpisu." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const { id } = await params;
    const existing = await prisma.healthEntry.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Wpis nie odnaleziony lub brak uprawnień" }, { status: 404 });
    }

    await prisma.healthEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}
