"use client";

import Link from "next/link";
import { Ghost, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#09090b] p-6">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Animated Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
          <div className="w-24 h-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 animate-bounce">
            <Ghost className="w-12 h-12 text-indigo-500" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            404 - Nie odnaleziono
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-[280px] mx-auto">
            Wygląda na to, że zabłądziłeś. Strona o podanym adresie URL nie istnieje w systemie.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full">
          <Link 
            href="/" 
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25"
          >
            <Home className="w-4 h-4" />
            Wróć na Główną
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 px-6 py-3 rounded-xl font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Cofnij
          </button>
        </div>

      </div>
    </div>
  );
}
