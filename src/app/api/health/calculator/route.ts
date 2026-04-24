import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function POST(req: Request) {
  const payload = await req.json();
  return proxyWithInternalAuth({
    path: "/health/calculator",
    method: "POST",
    body: payload,
    serverErrorMessage: "Nie udało się obliczyć zapotrzebowania",
  });
}
