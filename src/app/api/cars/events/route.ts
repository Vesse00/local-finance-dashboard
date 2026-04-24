import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function POST(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/cars/events",
    method: "POST",
    body: payload,
    serverErrorMessage: "Błąd serwera",
  });
}

export async function DELETE(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/cars/events",
    method: "DELETE",
    body: payload,
    serverErrorMessage: "Błąd",
  });
}
