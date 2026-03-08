"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { ExpenseModal } from "@/components/calendar/expense-modal";
import { AddIncomeModal } from "@/components/dashboard/add-income-modal";

export default function CalendarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleAddExpense = (day: number) => {
    const date = new Date();
    date.setDate(day);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6">
      
      {/* Nagłówek Kalendarza */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold w-40 text-center">Listopad 2024</h2>
          <button className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Kontrolki po prawej: Dodaj wpływ + Kategorie */}
        <div className="flex items-center gap-3">
          <AddIncomeModal />
          
          <button className="flex items-center gap-2 p-2 px-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/10">
            <Settings className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Kategorie</span>
          </button>
        </div>

      </div>

      {/* Siatka Kalendarza */}
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold uppercase text-zinc-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-black/5 dark:bg-white/10">
          <div className="bg-white dark:bg-zinc-950 min-h-[120px]"></div>
          <div className="bg-white dark:bg-zinc-950 min-h-[120px]"></div>
          
          {days.map(day => (
            <div 
              key={day} 
              className="group relative bg-white dark:bg-zinc-950 min-h-[120px] p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-t border-l border-transparent"
            >
              <span className={`text-sm font-medium ${day === new Date().getDate() ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white" : "text-zinc-500"}`}>
                {day}
              </span>

              <button 
                onClick={() => handleAddExpense(day)}
                className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-lg transition-all transform scale-90 group-hover:opacity-100 group-hover:scale-100 hover:bg-primary/80"
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      <ExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedDate={selectedDate}
      />
    </div>
  );
}