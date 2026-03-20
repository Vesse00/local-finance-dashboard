"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, CheckCircle2 } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMessage("Brak autoryzacji. Link jest nieprawidłowy.");
      setStatus("error");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword })
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

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black">Hasło zmienione!</h1>
          <p className="text-zinc-500 pb-4">Możesz się teraz bezpiecznie zalogować.</p>
          <Link href="/login" className="block w-full py-4 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-lg">
            Przejdź do logowania
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-emerald-500" /> Ustaw nowe hasło
            </h1>
            <p className="text-sm text-zinc-500 mt-2">Wpisz nowe, bezpieczne hasło dla swojego konta.</p>
          </div>
          
          {status === "error" && <p className="text-sm text-red-500 font-bold bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">{errorMessage}</p>}
          
          <div className="space-y-2">
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              placeholder="Nowe hasło" 
              disabled={!token}
              className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-bold text-zinc-900 dark:text-white disabled:opacity-50" 
            />
          </div>

          <button type="submit" disabled={status === "loading" || !newPassword || !token} className="w-full py-4 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-50">
            {status === "loading" ? "Przetwarzanie..." : "Zapisz hasło"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Ładowanie...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}