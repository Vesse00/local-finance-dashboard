import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createInternalApiToken } from "@/lib/internalApiAuth";

type ProxyOptions = {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  cache?: RequestCache;
  serverErrorMessage?: string;
};

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000/api";

const getSessionUserId = async (): Promise<string | undefined> => {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id;
};

export const proxyWithInternalAuth = async ({
  path,
  method,
  body,
  cache,
  serverErrorMessage = "Błąd serwera",
}: ProxyOptions) => {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const headers: Record<string, string> = {
      "x-internal-auth": createInternalApiToken(userId),
    };

    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache,
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }
};
