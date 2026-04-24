import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function GET(req: Request) {
  return proxyWithInternalAuth({
    path: "/cars",
    method: "GET",
    cache: "no-store",
    serverErrorMessage: "Wystąpił błąd",
  });
}

export async function POST(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/cars",
    method: "POST",
    body: payload,
    serverErrorMessage: "Błąd serwera",
  });
}

export async function DELETE(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/cars",
    method: "DELETE",
    body: payload,
    serverErrorMessage: "Błąd",
  });
}
