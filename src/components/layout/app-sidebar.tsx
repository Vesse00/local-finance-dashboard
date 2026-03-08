"use client"
import { LayoutDashboard, Calendar as CalendarIcon, PieChart, Repeat, Settings, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Kalendarz', href: '/calendar', icon: CalendarIcon },
  { name: 'Analiza', href: '/analysis', icon: PieChart },
  { name: 'Cykliczne', href: '/recurring', icon: Repeat },
  { name: 'Inwestycje', href: '/investments', icon: Wallet },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background/50 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 text-xl font-bold tracking-tight">
        Lokalny<span className="text-primary">Portfel</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <button className="flex w-full items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          <Settings className="mr-3 h-5 w-5" />
          Ustawienia
        </button>
      </div>
    </div>
  )
}