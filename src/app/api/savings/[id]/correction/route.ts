import { NextResponse } from "next/server";
import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: `/savings/${resolvedParams.id}/correction`,
    method: "POST",
    body: payload,
    serverErrorMessage: "Wystąpił błąd serwera",
  });
}
