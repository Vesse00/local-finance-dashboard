import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      return NextResponse.json({ updateAvailable: false, latestVersion: null, lastChecked: null });
    }

    return NextResponse.json({
      updateAvailable: settings.updateAvailable,
      latestVersion: settings.latestVersion,
      lastChecked: settings.lastChecked,
    });
  } catch {
    return NextResponse.json({ updateAvailable: false }, { status: 500 });
  }
}
