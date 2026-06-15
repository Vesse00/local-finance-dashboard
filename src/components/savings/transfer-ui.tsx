"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowRightLeft, X } from "lucide-react";
import { TransferForm } from "@/components/calendar/transfer-form";

interface TransferUIProps {
  onTransferComplete?: () => void;
}

export function TransferUI({ onTransferComplete }: TransferUIProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Upewniamy się, że komponent renderuje portal dopiero po stronie klienta
  useEffect(() => setMounted(true), []);

  // Blokowanie scrollowania strony gdy modal jest otwarty
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isModalOpen]);

  // Zawartość naszego modala
  const modalContent = isModalOpen ? (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
      <div className="relative w-full max-w-md max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors">
          <X className="h-5 w-5" />
        </button>
        
        <h3 className="text-xl font-bold mb-1 flex items-center gap-2 text-zinc-900 dark:text-white">
          <ArrowRightLeft className="w-5 h-5 text-indigo-500" /> Transfer środków
        </h3>
        <p className="text-sm text-zinc-500 mb-6">Szybkie przesunięcie pieniędzy między kontami</p>

        {/* Wstrzykujemy formularz i po sukcesie wywołujemy odświeżenie danych */}
        <TransferForm 
          onSuccess={() => {
            setIsModalOpen(false);
            if (onTransferComplete) onTransferComplete();
          }} 
          defaultFrom="MAIN" 
          defaultTo="SAVINGS" 
        />

      </div>
    </div>
  ) : null;

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
      >
        <ArrowRightLeft className="w-4 h-4" />
        Transfer środków
      </button>

      {/* Renderujemy modal prosto w tagu <body> za pomocą Portalu */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}