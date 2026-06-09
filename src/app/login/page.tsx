"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowRight, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

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
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden px-4">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-[400px] border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden">
        <CardHeader className="space-y-2 flex flex-col items-center pt-8">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Witaj ponownie</CardTitle>
          <CardDescription className="text-zinc-400">Zaloguj się do portfela</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8 pb-6 bg-transparent">
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300 ml-1">E-mail lub Użytkownik</Label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input 
                  id="username" 
                  name="username" 
                  placeholder="admin" 
                  className="pl-10 h-11 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-primary/50 focus:ring-0 transition-all rounded-xl" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-zinc-300">Hasło</Label>
                {/* MAGICZNY GUZIK ODZYSKIWANIA HASŁA */}
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  Zapomniałeś hasła?
                </Link>
              </div>
              
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-primary/50 focus:ring-0 transition-all rounded-xl" 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-8 pb-10 bg-transparent">
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 group" disabled={loading}>
              {loading ? "Logowanie..." : "Zaloguj się"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </Button>
            <div className="text-sm text-zinc-500 text-center">
              Nie masz profilu? <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">Stwórz konto</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}