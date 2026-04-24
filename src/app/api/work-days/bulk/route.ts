import { NextResponse } from "next/server";
import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function POST(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/work-days/bulk",
    method: "POST",
    body: payload,
    serverErrorMessage: "Wystąpił błąd podczas generowania.",
  });
}

export async function DELETE(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/work-days/bulk",
    method: "DELETE",
    body: payload,
    serverErrorMessage: "Wystąpił błąd podczas usuwania.",
  });
}
