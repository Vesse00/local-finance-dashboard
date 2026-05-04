"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, User, Eye, EyeOff } from "lucide-react";
import { MeBaseIconAnimated } from "@/components/ui/mebase-icon-animated";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError("Nieprawidłowe dane logowania.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden px-4 z-10">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Terminal window */}
        <div className="border border-green-900/50 bg-black/70 backdrop-blur-sm">

          {/* Title bar */}
          <div className="border-b border-green-900/50 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MeBaseIconAnimated size={20} />
              <span className="text-[10px] font-mono text-green-700 tracking-widest uppercase">mebase://auth</span>
            </div>
            <span className="text-[10px] font-mono text-green-900">v1.0</span>
          </div>

          {/* Header */}
          <div className="px-8 pt-7 pb-5 border-b border-green-900/20">
            <p className="text-[10px] font-mono text-green-700 tracking-widest mb-1">{`>`} INIT_SESSION</p>
            <h1 className="text-xl font-mono font-black text-white">Autoryzacja</h1>
            <p className="text-xs font-mono text-zinc-600 mt-1">Podaj dane dostępowe, aby kontynuować.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-8 py-6 space-y-5">

              <div className="space-y-1.5">
                <label htmlFor="username" className="text-[10px] font-mono text-green-700 uppercase tracking-widest block">
                  {`>`} USER_ID
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-4 w-4 text-green-900 pointer-events-none" />
                  <input
                    id="username"
                    name="username"
                    placeholder="admin"
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-green-900/50 text-white font-mono text-sm placeholder:text-zinc-700 focus:border-green-600 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[10px] font-mono text-green-700 uppercase tracking-widest">
                    {`>`} PASSWORD
                  </label>
                  <Link href="/forgot-password" className="text-[10px] font-mono text-zinc-600 hover:text-green-600 transition-colors tracking-wider">
                    RESET_PWD →
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-4 w-4 text-green-900 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-black/40 border border-green-900/50 text-white font-mono text-sm placeholder:text-zinc-700 focus:border-green-600 focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-zinc-600 hover:text-green-500 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="border border-red-900/50 bg-red-900/10 px-4 py-3 text-red-500 text-xs font-mono">
                  {`>`} ERR: {error}
                </div>
              )}
            </div>

            <div className="px-8 pb-8 space-y-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-green-400/10 hover:bg-green-400/20 border border-green-700 text-green-400 py-3 text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">{`>`} AUTHENTICATING...</span>
                ) : (
                  <>{`>`} EXECUTE_LOGIN <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
              <p className="text-center text-[10px] font-mono text-zinc-700">
                NO_ACCOUNT?{" "}
                <Link href="/register" className="text-green-900 hover:text-green-600 transition-colors">
                  REGISTER →
                </Link>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-[10px] font-mono text-green-900/40 mt-3 tracking-wider">
          MeBase // secure_channel_established
        </p>
      </div>
    </div>
  );
}