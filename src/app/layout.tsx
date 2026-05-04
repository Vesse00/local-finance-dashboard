import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AppLayout } from "@/components/layout/app-layout";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "MeBase",
  description: "Prywatne centrum dowodzenia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={jetbrainsMono.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              {/* Tutaj dodajemy nasz nowy układ! */}
              <AppLayout>
                {children}
              </AppLayout>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}