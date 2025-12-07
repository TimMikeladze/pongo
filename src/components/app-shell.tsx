"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Activity, LayoutDashboard, Bell, Monitor, Terminal, Minimize2, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { DensityToggle } from "@/components/density-toggle"
import { useTheme } from "@/components/theme-provider"

const navigation = [
  { name: "overview", href: "/", icon: Terminal },
  { name: "monitors", href: "/monitors", icon: Monitor },
  { name: "dashboards", href: "/dashboards", icon: LayoutDashboard },
  { name: "alerts", href: "/settings/notifications", icon: Bell },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { density, toggleDensity, theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showZenControls, setShowZenControls] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "z" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
        toggleDensity()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleDensity])

  const isPublicPage = pathname.startsWith("/public/")

  if (isPublicPage) {
    return <>{children}</>
  }

  const isDense = mounted && density === "dense"

  return (
    <div className="min-h-screen bg-background">
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm transition-all duration-300",
          isDense ? "h-0 opacity-0 pointer-events-none" : "h-12",
        )}
      >
        <div className="flex h-full items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <Activity className="h-4 w-4" />
            <span className="text-sm tracking-wider">uptime_</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs transition-colors rounded",
                    isActive
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <DensityToggle />
            <ThemeToggle />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary glow-up" />
              <span className="hidden sm:inline">operational</span>
            </div>
          </div>
        </div>
      </header>

      {isDense && (
        <div
          className="fixed top-4 right-4 z-50"
          onMouseEnter={() => setShowZenControls(true)}
          onMouseLeave={() => setShowZenControls(false)}
        >
          <div
            className={cn(
              "relative flex items-center gap-1 transition-all duration-300 ease-out",
              showZenControls
                ? "bg-background/95 backdrop-blur-md border border-border shadow-lg rounded-full px-1 py-1"
                : "bg-transparent",
            )}
          >
            <div
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-300",
                showZenControls ? "opacity-0 scale-0" : "opacity-100 scale-100",
              )}
            >
              <div className="w-2 h-2 rounded-full bg-primary/40 hover:bg-primary/60 cursor-pointer" />
            </div>

            <div
              className={cn(
                "flex items-center gap-0.5 transition-all duration-300",
                showZenControls ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
              )}
            >
              <button
                onClick={toggleDensity}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Exit zen mode (z)"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <div className="w-px h-4 bg-border" />
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div
            className={cn(
              "absolute top-full right-0 mt-2 text-[10px] text-muted-foreground/50 whitespace-nowrap transition-opacity duration-300",
              showZenControls ? "opacity-100" : "opacity-0",
            )}
          >
            z to exit
          </div>
        </div>
      )}

      <main className={cn("min-h-screen transition-all duration-300", isDense ? "pt-0" : "pt-12")}>{children}</main>
    </div>
  )
}
