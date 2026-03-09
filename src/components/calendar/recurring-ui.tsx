"use client";

import { useState, useTransition } from "react";
import { Repeat, Plus, X, Trash2, CalendarDays, Wallet } from "lucide-react";
import { addRecurringPayment, deleteRecurringPayment } from "@/lib/actions";
import { RecurringForm } from "./recurring-form";

interface RecurringUIProps {
  recurrings: any[];
  categories: any[];
}

export function RecurringUI({ recurrings, categories }: RecurringUIProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCredit, setIsCredit] = useState(false); // Czy dodajemy subskrypcję czy ratę?

  const handleDelete = (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    startTransition(async () => {
      await deleteRecurringPayment(formData);
    });
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await addRecurringPayment(formData);
      setIsModalOpen(false);
    });
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Repeat className="w-6 h-6 text-indigo-500" />
            Zlecenia stałe i Raty
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Zarządzaj powtarzającymi się płatnościami. Aplikacja automatycznie wygeneruje je w kalendarzu.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-5 h-5" /> Nowe zlecenie
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recurrings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-white/30 dark:bg-black/20 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
            Brak zdefiniowanych płatności. Kliknij "Nowe zlecenie", aby dodać subskrypcję lub ratę kredytu.
          </div>
        ) : (
          recurrings.map(rec => {
            const isLoan = rec.totalAmount !== null;
            const progress = isLoan ? ((rec.totalAmount - rec.remainingAmount) / rec.totalAmount) * 100 : 0;

            return (
              <div key={rec.id} className="relative p-5 rounded-2xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-sm group hover:border-indigo-500/30 transition-all">
                <button 
                  onClick={() => handleDelete(rec.id)}
                  className="absolute top-4 right-4 p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                  title="Usuń to zlecenie"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-xl shadow-inner">
                    {rec.category?.icon || "🔄"}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white leading-tight">{rec.name}</h3>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                      <CalendarDays className="w-3 h-3" /> Płatne każdego {rec.dayOfMonth}. dnia
                    </p>
                  </div>
                </div>

                <div className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-4">
                  {rec.defaultAmount.toLocaleString("pl-PL", { style: "currency", currency: rec.currency })}
                  <span className="text-sm font-normal text-zinc-500"> / m-c</span>
                </div>

                {isLoan && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-500">Spłacono: {progress.toFixed(0)}%</span>
                      <span className="text-zinc-900 dark:text-white">
                        Pozostało: {rec.remainingAmount.toLocaleString("pl-PL", { style: "currency", currency: rec.currency })}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DODAWANIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-indigo-500" /> Dodaj zlecenie stałe
            </h3>

            {/* NASZ NOWY UNIWERSALNY FORMULARZ */}
            <RecurringForm 
              categories={categories} 
              onSuccess={() => setIsModalOpen(false)} 
            />

          </div>
        </div>
      )}
    </div>
  );
}