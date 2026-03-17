"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username })
      });
      if (res.ok) setStatus("success");
      else {
        const data = await res.json();
        setErrorMessage(data.error);
        setStatus("error");
      }
    } catch (err) {
      setErrorMessage("Błąd połączenia z serwerem.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-6">
        
        {status !== "success" ? (
          <>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Wróć do logowania
            </Link>

            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-6 h-6 text-indigo-500" /> Odzyskaj hasło
                </h1>
                <p className="text-sm text-zinc-500 mt-2">Podaj swój adres e-mail (login), a prześlemy Ci link do zmiany hasła.</p>
              </div>
              
              {status === "error" && <p className="text-sm text-red-500 font-bold bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">{errorMessage}</p>}
              
              <div className="space-y-2">
                <input type="email" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Wpisz e-mail" className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 font-bold text-zinc-900 dark:text-white" />
              </div>

              <button type="submit" disabled={status === "loading" || !username} className="w-full py-4 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50">
                {status === "loading" ? "Wysyłanie..." : "Wyślij link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Sprawdź pocztę!</h1>
            <p className="text-zinc-500 pb-4">Jeśli podany adres istnieje w naszej bazie, wysłaliśmy na niego link do zresetowania hasła.</p>
            <Link href="/login" className="block w-full py-4 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 transition-colors">
              Wróć do logowania
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}