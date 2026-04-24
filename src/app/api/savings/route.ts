import { NextResponse } from "next/server";
import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function GET(req: Request) {
  return proxyWithInternalAuth({
    path: "/savings",
    method: "GET",
    cache: "no-store",
    serverErrorMessage: "Błąd",
  });
}

export async function POST(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/savings",
    method: "POST",
    body: payload,
    serverErrorMessage: "Błąd przy tworzeniu konta",
  });
}

export async function DELETE(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/savings",
    method: "DELETE",
    body: payload,
    serverErrorMessage: "Błąd przy usuwaniu konta",
  });
}
