import { proxyWithInternalAuth } from "@/lib/backendProxy";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return proxyWithInternalAuth({
    path: `/cars/${resolvedParams.id}`,
    method: "GET",
    cache: "no-store",
    serverErrorMessage: "Wystąpił błąd",
  });
}