"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Terminal window */}
        <div className="border border-green-900/50 bg-black/60 backdrop-blur-sm">
          {/* Title bar */}
          <div className="border-b border-green-900/50 px-4 py-2 flex items-center gap-2">
            <span className="text-[10px] font-mono text-green-700 tracking-widest uppercase">mebase://error</span>
          </div>

          <div className="p-8 space-y-6">
            {/* Error code */}
            <div>
              <p className="text-[10px] font-mono text-green-700 tracking-widest mb-2">{`>`} SYSTEM_ERROR</p>
              <h1 className="text-7xl font-mono font-black text-green-400 leading-none">404</h1>
              <p className="text-xs font-mono text-green-900 mt-1">EXIT_CODE: PAGE_NOT_FOUND</p>
            </div>

            <div className="border-t border-green-900/30" />

            {/* Message */}
            <div className="space-y-1">
              <p className="text-xs font-mono text-green-700">{`>`} TRACE:</p>
              <p className="text-sm font-mono text-zinc-500 leading-relaxed pl-4">
                Żądany zasób nie istnieje w systemie.<br />
                Sprawdź adres URL lub wróć do bazy.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 border border-green-700 bg-green-400/5 hover:bg-green-400/10 text-green-400 px-6 py-3 text-xs font-mono uppercase tracking-wider transition-all"
              >
                <Home className="w-4 h-4" />
                {`>`} HOME
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center gap-2 border border-green-900/50 hover:border-green-700 text-zinc-600 hover:text-green-400 px-6 py-3 text-xs font-mono uppercase tracking-wider transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {'<'} BACK
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] font-mono text-green-900/50 mt-4 tracking-wider">
          MeBase v1.0 // error.handler
        </p>
      </div>
    </div>
  );
}
