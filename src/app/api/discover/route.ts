import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_PAGES = [
  "calendar",
  "savings",
  "planner",
  "analysis",
  "work-schedule",
  "health/daily",
  "health/body",
  "health/energy",
  "garage",
  "drawer",
  "achievements",
] as const;

type AllowedPage = (typeof ALLOWED_PAGES)[number];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  const body = await req.json().catch(() => ({}));
  const page = body?.page as AllowedPage | undefined;

  if (!page || !ALLOWED_PAGES.includes(page)) {
    return NextResponse.json({ error: "Nieprawidłowa strona" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { discoveredPages: true },
  });

  const current = (user?.discoveredPages ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (!current.includes(page)) {
    current.push(page);
    await prisma.user.update({
      where: { id: userId },
      data: { discoveredPages: current.join(",") },
    });
  }

  return NextResponse.json({ discovered: current });
}
