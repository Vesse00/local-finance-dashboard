import { NextResponse } from "next/server";
import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthStr = searchParams.get("month");
  const suffix = monthStr ? `?month=${encodeURIComponent(monthStr)}` : "";

  return proxyWithInternalAuth({
    path: `/work-days${suffix}`,
    method: "GET",
    cache: "no-store",
    serverErrorMessage: "Wystąpił błąd",
  });
}

export async function POST(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/work-days",
    method: "POST",
    body: payload,
    serverErrorMessage: "Wystąpił błąd",
  });
}
