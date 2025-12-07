"use client"

import { useParams, useRouter, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pause, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { StatusTimeline } from "@/components/status-timeline"
import { StatsCard } from "@/components/stats-card"
import { MonitorForm } from "@/components/monitor-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMonitor, useCheckResults, useMonitorStats, useLatestCheckResult } from "@/lib/hooks"
import { store } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { ResponseTimeChart } from "@/components/response-time-chart"

export default function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const monitor = useMonitor(id)
  const latestResult = useLatestCheckResult(id)
  const results = useCheckResults(id, 50)
  const stats24h = useMonitorStats(id, 24)
  const stats7d = useMonitorStats(id, 168)

  if (!monitor) {
    notFound()
  }

  const status = latestResult?.status ?? "pending"

  const handleToggleActive = () => {
    store.updateMonitor(monitor.id, { isActive: !monitor.isActive })
  }

  const handleDelete = () => {
    if (confirm("delete this monitor?")) {
      store.deleteMonitor(monitor.id)
      router.push("/monitors")
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pt-4">
        <Button variant="ghost" size="icon" asChild className="h-7 w-7">
          <Link href="/monitors">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <StatusBadge status={monitor.isActive ? status : "pending"} size="lg" pulse={status === "up"} />
            <h1 className="text-sm">{monitor.name}</h1>
            {!monitor.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">paused</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {monitor.method} {monitor.url}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleActive} className="h-7 text-xs bg-transparent">
            {monitor.isActive ? (
              <>
                <Pause className="mr-1.5 h-3 w-3" />
                pause
              </>
            ) : (
              <>
                <Play className="mr-1.5 h-3 w-3" />
                resume
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="h-7 text-xs text-destructive hover:text-destructive border-destructive/30 bg-transparent"
          >
            <Trash2 className="mr-1.5 h-3 w-3" />
            delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card border border-border h-8">
          <TabsTrigger value="overview" className="text-xs h-6 data-[state=active]:bg-accent">
            overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs h-6 data-[state=active]:bg-accent">
            settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard
              title="uptime 24h"
              value={`${stats24h.uptime}%`}
              trend={stats24h.uptime >= 99.9 ? "up" : stats24h.uptime >= 99 ? "neutral" : "down"}
            />
            <StatsCard
              title="uptime 7d"
              value={`${stats7d.uptime}%`}
              trend={stats7d.uptime >= 99.9 ? "up" : stats7d.uptime >= 99 ? "neutral" : "down"}
            />
            <StatsCard title="avg latency" value={`${stats24h.avgResponseTime}ms`} description="24h" />
            <StatsCard
              title="last check"
              value={
                latestResult ? formatDistanceToNow(new Date(latestResult.checkedAt), { addSuffix: true }) : "never"
              }
              description={latestResult ? `${latestResult.responseTimeMs}ms` : undefined}
            />
          </div>

          <div className="border border-border rounded bg-card p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">response time</h3>
            <ResponseTimeChart results={results} height={160} />
          </div>

          {/* Timeline */}
          <div className="border border-border rounded bg-card p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">status history</h3>
            <StatusTimeline results={results} limit={50} />
          </div>

          {/* Recent Checks */}
          <div className="border border-border rounded bg-card p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">recent checks</h3>
            <div className="space-y-1">
              {results.slice(0, 10).map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={result.status} size="sm" />
                    <span
                      className={cn(
                        "text-xs",
                        result.status === "up" && "text-primary",
                        result.status === "down" && "text-destructive",
                        result.status === "degraded" && "text-yellow-500",
                      )}
                    >
                      {result.statusCode || "err"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{result.errorMessage || "ok"}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span>{result.responseTimeMs}ms</span>
                    <span>{formatDistanceToNow(new Date(result.checkedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <MonitorForm monitor={monitor} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
