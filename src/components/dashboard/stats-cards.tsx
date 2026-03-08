import { ArrowDownRight, ArrowUpRight, Coins, CreditCard, Wallet } from "lucide-react";

export function StatsCards() {
  const stats = [
    {
      title: "Całkowite Saldo",
      amount: "24 500,00 zł",
      trend: "+2.5%",
      isPositive: true,
      icon: Wallet,
      color: "from-blue-500 to-cyan-400"
    },
    {
      title: "Przychody (W tym miesiącu)",
      amount: "8 230,00 zł",
      trend: "+12.5%",
      isPositive: true,
      icon: Coins,
      color: "from-emerald-500 to-teal-400"
    },
    {
      title: "Wydatki (W tym miesiącu)",
      amount: "3 450,00 zł",
      trend: "-4.2%",
      isPositive: false,
      icon: CreditCard,
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index} 
            className="relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:shadow-none"
          >
            {/* Tło z subtelnym gradientem w rogu */}
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-2xl dark:opacity-40`}></div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {stat.title}
              </span>
              <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-2 shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {stat.amount}
              </h3>
            </div>
            
            <div className="mt-2 flex items-center text-sm">
              {stat.isPositive ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-rose-500" />
              )}
              <span className={stat.isPositive ? "text-emerald-500 font-medium" : "text-rose-500 font-medium"}>
                {stat.trend}
              </span>
              <span className="ml-2 text-zinc-500 dark:text-zinc-400">od ostatniego miesiąca</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}