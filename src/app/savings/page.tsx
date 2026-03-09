import { prisma } from "@/lib/db";
import { PiggyBank, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { TransferUI } from "@/components/savings/transfer-ui";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  const savingHistory = await prisma.expense.findMany({
    where: { userId: user.id, type: "SAVING" },
    orderBy: { date: 'desc' }
  });

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-[80px] pointer-events-none"></div>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <PiggyBank className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Moje Oszczędności</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-2">
            Pieniądze przeniesione z konta głównego, odłożona "reszta" z miesiąca oraz saldo kont oszczędnościowych.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4 z-10">
          <div className="text-5xl md:text-6xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
            {user.savings.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
          </div>
          {/* Używamy naszego TransferUI */}
          <TransferUI />
        </div>
      </div>

      {/* HISTORIA ODKŁADANIA (Bez zmian) */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
          <ArrowRightLeft className="w-5 h-5 text-zinc-400" /> Historia odkładania
        </h3>
        
        <div className="space-y-3">
          {savingHistory.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 bg-white/30 dark:bg-black/20 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
              Jeszcze nic nie odłożono.
            </div>
          ) : (
            savingHistory.map(saving => (
              <div key={saving.id} className="flex items-center justify-between p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {saving.description || saving.recipient || "Transfer do oszczędności"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {format(new Date(saving.date), 'dd MMMM yyyy', { locale: pl })}
                    </p>
                  </div>
                </div>
                <div className="font-bold text-blue-600 dark:text-blue-400">
                  +{saving.amount.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}