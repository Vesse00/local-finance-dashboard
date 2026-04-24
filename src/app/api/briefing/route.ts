import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function GET() {
  return proxyWithInternalAuth({
    path: "/briefing",
    method: "GET",
    cache: "no-store",
    serverErrorMessage: "Błąd serwera",
  });
}