"use client"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { theme, setTheme } = useTheme()

  // Funkcja do zmiany koloru akcentu (uproszczona)
  const changeAccent = (color: string) => {
    document.documentElement.style.setProperty('--primary', color);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-8">
        <div className="font-medium text-muted-foreground">Witaj z powrotem, Użytkowniku</div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => changeAccent('263 84% 50%')}>
             <Palette className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  )
}