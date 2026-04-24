import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function GET() {
  return proxyWithInternalAuth({
    path: "/settings",
    method: "GET",
    cache: "no-store",
    serverErrorMessage: "Błąd serwera",
  });
}

export async function PUT(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/settings",
    method: "PUT",
    body: payload,
    serverErrorMessage: "Wystąpił błąd serwera podczas zapisywania zmian.",
  });
}
