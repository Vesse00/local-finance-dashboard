"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Sparkles, User, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Stany dla widoczności haseł
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }
    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/login?registered=true");
    } else {
      const data = await res.json();
      setError(data.message || "Błąd rejestracji.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden px-4">
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-[420px] border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-500 to-purple-600 opacity-80" />
        
        <CardHeader className="space-y-2 flex flex-col pt-8 px-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/90">Prywatny System</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Nowy profil</CardTitle>
          <CardDescription className="text-zinc-400">Skonfiguruj swoje lokalne konto</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8 pb-6 bg-transparent">
            {/* Login */}
            <div className="space-y-2">
              <Label className="text-zinc-300 ml-1 text-sm">Użytkownik</Label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input name="username" placeholder="Login..." className="pl-10 h-11 bg-white/[0.05] border-white/10 text-white rounded-xl" required />
              </div>
            </div>
            
            {/* Hasło */}
            <div className="space-y-2">
              <Label className="text-zinc-300 ml-1 text-sm">Hasło</Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input 
                  name="password" 
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-white/[0.05] border-white/10 text-white rounded-xl" 
                  required 
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Powtórz Hasło */}
            <div className="space-y-2">
              <Label className="text-zinc-300 ml-1 text-sm">Powtórz hasło</Label>
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input 
                  name="confirmPassword" 
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-white/[0.05] border-white/10 text-white rounded-xl" 
                  required 
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold rounded-xl shadow-lg shadow-primary/20 group" disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
              {loading ? "Tworzenie..." : "Zarejestruj się"}
            </Button>
            <div className="text-sm text-zinc-500 text-center">
              Masz już profil? <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Zaloguj się</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}