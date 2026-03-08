import { Card } from "@/components/ui/card"
import { Wallet, TrendingDown, ArrowUpRight } from "lucide-react"

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* GŁÓWNY WIDGET */}
      <Card className="p-6 bg-zinc-900 text-zinc-50 dark:bg-white dark:text-zinc-900 border-none shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80 flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Kwota wolna
          </p>
          <h2 className="text-4xl font-bold mt-2 tracking-tighter">4 250.00 PLN</h2>
          <div className="mt-4 flex items-center text-xs opacity-70">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            <span>Po odjęciu 1 500 PLN opłat stałych</span>
          </div>
        </div>
        {/* Dekoracyjny element w tle */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/20 rounded-full blur-3xl" />
      </Card>

      <Card className="p-6 border-zinc-200 dark:border-zinc-800">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-red-500" /> Wydano w tym miesiącu
        </p>
        <h2 className="text-3xl font-bold mt-2 tracking-tight">842.15 PLN</h2>
        <p className="text-xs text-muted-foreground mt-2">Wczoraj: +45.00 PLN</p>
      </Card>
    </div>
  )
}