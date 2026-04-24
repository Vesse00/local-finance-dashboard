import { NextResponse } from "next/server";
import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function POST(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/transfer",
    method: "POST",
    body: payload,
    serverErrorMessage: "Błąd serwera",
  });
}