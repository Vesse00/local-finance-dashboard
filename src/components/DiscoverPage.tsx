"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface DiscoverPageProps {
  page: string;
}

/**
 * Niewidoczny komponent – umieszczony na stronie powoduje,
 * że odwiedzenie jej zostaje zapisane w bazie (pole discoveredPages).
 * Wysyła request tylko raz na sesję przeglądarki (sessionStorage).
 */
export function DiscoverPage({ page }: DiscoverPageProps) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const key = `disc_${page}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");

    fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page }),
    }).catch(() => {
      // jeśli nie uda – usuń flagę żeby spróbować znowu
      sessionStorage.removeItem(key);
    });
  }, [status, session, page]);

  return null;
}
