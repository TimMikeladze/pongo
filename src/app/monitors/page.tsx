"use client"

import Link from "next/link"
import { Plus, Search, Terminal, Zap } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MonitorCard } from "@/components/monitor-card"
import { useMonitors } from "@/lib/hooks"

export default function MonitorsPage() {
  const monitors = useMonitors()
  const [search, setSearch] = useState("")

  const filteredMonitors = monitors.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.url.toLowerCase().includes(search.toLowerCase()),
  )

  const activeCount = monitors.filter((m) => m.isActive).length
  const pausedCount = monitors.length - activeCount

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">monitors</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {monitors.length} total · {activeCount} active · {pausedCount} paused
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="h-7 text-xs">
          <Link href="/monitors/new">
            <Plus className="mr-1.5 h-3 w-3" />
            new monitor
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="search monitors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-8 text-xs max-w-sm bg-card border-border font-mono"
        />
      </div>

      {/* Monitors List */}
      {filteredMonitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded bg-card/50">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            {search ? "no monitors found" : "no monitors configured yet"}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mb-4">
            {search ? "try a different search term" : "create your first monitor to start tracking uptime"}
          </p>
          {!search && (
            <Button asChild size="sm" className="h-7 text-xs">
              <Link href="/monitors/new">
                <Plus className="mr-1.5 h-3 w-3" />
                create monitor
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMonitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      )}
    </div>
  )
}
