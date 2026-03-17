import { withAuth } from "next-auth/middleware";

// Wyraźne eksportowanie domyślnej funkcji middleware (rozwiązuje błąd Next.js)
export default withAuth({
  pages: {
    signIn: "/login", // Mówimy strażnikowi: "Jak ktoś nie ma dostępu, wyrzuć go na NASZĄ stronę logowania"
  },
});

export const config = {
  // Określamy chronione ścieżki
  matcher: ["/((?!login|register|forgot-password|reset-password|api|_next/static|_next/image|favicon.ico).*)"],
};