"use client"

import Link from "next/link"
import { MoreHorizontal, Pause, Play, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/status-badge"
import { Sparkline } from "@/components/sparkline"
import { useLatestCheckResult, useCheckResults, useMonitorStats } from "@/lib/hooks"
import { useTheme } from "@/components/theme-provider"
import { store } from "@/lib/store"
import type { Monitor } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MonitorCardProps {
  monitor: Monitor
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const latestResult = useLatestCheckResult(monitor.id)
  const results = useCheckResults(monitor.id, 30)
  const stats = useMonitorStats(monitor.id, 24)
  const { density } = useTheme()

  const status = latestResult?.status ?? "pending"
  const isDense = density === "dense"

  const handleToggleActive = () => {
    store.updateMonitor(monitor.id, { isActive: !monitor.isActive })
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this monitor?")) {
      store.deleteMonitor(monitor.id)
    }
  }

  return (
    <div
      className={cn(
        "group border border-border rounded bg-card hover:border-primary/30 transition-colors",
        isDense ? "p-2" : "p-4",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <StatusBadge
            status={monitor.isActive ? status : "pending"}
            size={isDense ? "sm" : "lg"}
            pulse={status === "up"}
          />
          <div className="flex-1 min-w-0">
            <Link
              href={`/monitors/${monitor.id}`}
              className={cn("hover:text-primary transition-colors", isDense ? "text-xs" : "text-sm")}
            >
              {monitor.name}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  "px-1 py-0.5 rounded bg-secondary font-mono",
                  isDense ? "text-[8px]" : "text-[10px]",
                  monitor.method === "GET" && "text-status-up",
                  monitor.method === "POST" && "text-status-degraded",
                  monitor.method === "DELETE" && "text-status-down",
                )}
              >
                {monitor.method}
              </span>
              <span className={cn("text-muted-foreground truncate font-mono", isDense ? "text-[8px]" : "text-[10px]")}>
                {monitor.url}
              </span>
            </div>
          </div>
        </div>

        <div className={cn("flex-shrink-0 hidden sm:block", isDense ? "w-16" : "w-24")}>
          <Sparkline results={results} height={isDense ? 20 : 32} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                isDense ? "h-5 w-5" : "h-6 w-6",
              )}
            >
              <MoreHorizontal className={isDense ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem asChild>
              <Link href={`/monitors/${monitor.id}`}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleActive}>
              {monitor.isActive ? (
                <>
                  <Pause className="mr-2 h-3.5 w-3.5" />
                  pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-3.5 w-3.5" />
                  resume
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats row */}
      <div
        className={cn(
          "flex items-center gap-4 border-t border-border/50",
          isDense ? "text-[8px] mt-2 pt-2" : "text-[10px] mt-4 pt-3",
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">uptime</span>
          <span
            className={cn(
              "font-mono",
              stats.uptime >= 99.9 ? "text-status-up" : stats.uptime >= 99 ? "text-foreground" : "text-status-down",
            )}
          >
            {stats.uptime}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">latency</span>
          <span className="font-mono">{stats.avgResponseTime}ms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">interval</span>
          <span className="font-mono">{monitor.intervalSeconds}s</span>
        </div>
        {!monitor.isActive && (
          <span
            className={cn(
              "px-1 py-0.5 rounded bg-secondary text-muted-foreground",
              isDense ? "text-[8px]" : "text-[10px]",
            )}
          >
            paused
          </span>
        )}
      </div>
    </div>
  )
}
