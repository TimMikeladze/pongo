"use client"

import Link from "next/link"
import { Plus, Terminal, Activity, Clock, AlertTriangle, CheckCircle, Zap, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MonitorCard } from "@/components/monitor-card"
import { StatsCard } from "@/components/stats-card"
import { useMonitors } from "@/lib/hooks"
import { useTheme } from "@/components/theme-provider"
import { store } from "@/lib/store"
import { ResponseTimeChart } from "@/components/response-time-chart"
import { UptimeChart } from "@/components/uptime-chart"
import { ErrorRateChart } from "@/components/error-rate-chart"
import { LatencyPercentilesChart } from "@/components/latency-percentiles-chart"
import { StatusDistributionChart } from "@/components/status-distribution-chart"
import { LatencyHeatmap } from "@/components/latency-heatmap"
import { ThroughputChart } from "@/components/throughput-chart"
import { cn } from "@/lib/utils"

export default function OverviewPage() {
  const monitors = useMonitors()
  const { density } = useTheme()
  const isDense = density === "dense"

  const activeMonitors = monitors.filter((m) => m.isActive)

  const overallUptime =
    monitors.length > 0
      ? monitors.reduce((acc, m) => acc + store.getUptimePercentage(m.id, 24), 0) / monitors.length
      : 100

  const avgResponseTime =
    monitors.length > 0
      ? Math.round(monitors.reduce((acc, m) => acc + store.getAverageResponseTime(m.id, 24), 0) / monitors.length)
      : 0

  const errorRate =
    monitors.length > 0 ? monitors.reduce((acc, m) => acc + store.getErrorRate(m.id, 24), 0) / monitors.length : 0

  const p95Latency =
    monitors.length > 0
      ? Math.round(monitors.reduce((acc, m) => acc + store.getP95ResponseTime(m.id, 24), 0) / monitors.length)
      : 0

  const p99Latency =
    monitors.length > 0
      ? Math.round(monitors.reduce((acc, m) => acc + store.getP99ResponseTime(m.id, 24), 0) / monitors.length)
      : 0

  const totalChecks = monitors.reduce((acc, m) => acc + store.getTotalChecks(m.id, 24), 0)

  const downCount = monitors.filter((m) => {
    const latest = store.getLatestCheckResult(m.id)
    return latest?.status === "down"
  }).length

  const allResults = monitors.flatMap((m) => store.getCheckResults(m.id, 100))

  return (
    <div className={cn("mx-auto", isDense ? "p-2 max-w-none" : "p-6 max-w-7xl")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", isDense ? "mb-3 pt-1" : "mb-8 pt-4")}>
        <div className="flex items-center gap-2">
          <Terminal className={cn("text-primary", isDense ? "h-3 w-3" : "h-4 w-4")} />
          <div>
            <h1 className={isDense ? "text-xs" : "text-sm"}>system overview</h1>
            {!isDense && (
              <p className="text-[10px] text-muted-foreground mt-0.5">monitoring {monitors.length} endpoints</p>
            )}
          </div>
        </div>
        <Button asChild size="sm" className={cn(isDense ? "h-6 text-[10px]" : "h-7 text-xs")}>
          <Link href="/monitors/new">
            <Plus className={cn("mr-1", isDense ? "h-2.5 w-2.5" : "h-3 w-3")} />
            {isDense ? "new" : "new monitor"}
          </Link>
        </Button>
      </div>

      {/* Primary KPIs */}
      <div className={cn("grid grid-cols-4 md:grid-cols-7", isDense ? "gap-1.5 mb-3" : "gap-3 mb-6")}>
        <StatsCard
          title="uptime"
          value={`${overallUptime.toFixed(1)}%`}
          description={isDense ? undefined : "24h average"}
          trend={overallUptime >= 99.9 ? "up" : overallUptime >= 99 ? "neutral" : "down"}
        />
        <StatsCard
          title="monitors"
          value={activeMonitors.length}
          description={isDense ? undefined : `${monitors.length} total`}
        />
        <StatsCard
          title="avg latency"
          value={`${avgResponseTime}ms`}
          description={isDense ? undefined : "response time"}
        />
        <StatsCard title="p95" value={`${p95Latency}ms`} description={isDense ? undefined : "95th percentile"} />
        <StatsCard
          title="errors"
          value={`${errorRate.toFixed(1)}%`}
          description={isDense ? undefined : "failures"}
          trend={errorRate === 0 ? "up" : errorRate < 1 ? "neutral" : "down"}
        />
        <StatsCard title="checks" value={totalChecks} description={isDense ? undefined : "24h"} />
        <StatsCard
          title="incidents"
          value={downCount}
          description={isDense ? undefined : "down"}
          trend={downCount === 0 ? "up" : "down"}
        />
      </div>

      {/* Primary Charts Row */}
      <div className={cn("grid md:grid-cols-2", isDense ? "gap-1.5 mb-3" : "gap-4 mb-6")}>
        <div className={cn("border border-border rounded bg-card", isDense ? "p-2" : "p-4")}>
          <div className={cn("flex items-center gap-1.5", isDense ? "mb-1.5" : "mb-3")}>
            <Activity className={cn("text-primary", isDense ? "h-2.5 w-2.5" : "h-3 w-3")} />
            <h3
              className={cn("uppercase tracking-wider text-muted-foreground", isDense ? "text-[8px]" : "text-[10px]")}
            >
              response time
            </h3>
          </div>
          <ResponseTimeChart results={allResults} height={isDense ? 80 : 140} />
        </div>
        <div className={cn("border border-border rounded bg-card", isDense ? "p-2" : "p-4")}>
          <div className={cn("flex items-center gap-1.5", isDense ? "mb-1.5" : "mb-3")}>
            <CheckCircle className={cn("text-status-up", isDense ? "h-2.5 w-2.5" : "h-3 w-3")} />
            <h3
              className={cn("uppercase tracking-wider text-muted-foreground", isDense ? "text-[8px]" : "text-[10px]")}
            >
              hourly uptime
            </h3>
          </div>
          <UptimeChart results={allResults} height={isDense ? 80 : 140} />
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className={cn("grid md:grid-cols-3", isDense ? "gap-1.5 mb-3" : "gap-4 mb-6")}>
        <div className={cn("border border-border rounded bg-card", isDense ? "p-2" : "p-4")}>
          <div className={cn("flex items-center gap-1.5", isDense ? "mb-1.5" : "mb-3")}>
            <AlertTriangle className={cn("text-status-down", isDense ? "h-2.5 w-2.5" : "h-3 w-3")} />
            <h3
              className={cn("uppercase tracking-wider text-muted-foreground", isDense ? "text-[8px]" : "text-[10px]")}
            >
              error rate
            </h3>
          </div>
          <ErrorRateChart results={allResults} height={isDense ? 60 : 120} />
        </div>
        <div className={cn("border border-border rounded bg-card", isDense ? "p-2" : "p-4")}>
          <div className={cn("flex items-center gap-1.5", isDense ? "mb-1.5" : "mb-3")}>
            <TrendingUp className={cn("text-status-degraded", isDense ? "h-2.5 w-2.5" : "h-3 w-3")} />
            <h3
              className={cn("uppercase tracking-wider text-muted-foreground", isDense ? "text-[8px]" : "text-[10px]")}
            >
              latency percentiles
            </h3>
          </div>
          <LatencyPercentilesChart results={allResults} height={isDense ? 60 : 120} />
        </div>
        <div className={cn("border border-border rounded bg-card", isDense ? "p-2" : "p-4")}>
          <div className={cn("flex items-center gap-1.5", isDense ? "mb-1.5" : "mb-3")}>
            <Zap className={cn("text-purple-500", isDense ? "h-2.5 w-2.5" : "h-3 w-3")} />
            <h3
              className={cn("uppercase tracking-wider text-muted-foreground", isDense ? "text-[8px]" : "text-[10px]")}
            >
              throughput
            </h3>
          </div>
          <ThroughputChart results={allResults} height={isDense ? 60 : 120} />
        </div>
      </div>

      {/* Tertiary Charts Row - hidden in dense mode */}
      {!isDense && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="border border-border rounded bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">latency heatmap</h3>
            </div>
            <LatencyHeatmap results={allResults} height={100} />
          </div>
          <div className="border border-border rounded bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-3 w-3 text-muted-foreground" />
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">status distribution</h3>
            </div>
            <StatusDistributionChart results={allResults} height={100} />
          </div>
        </div>
      )}

      {/* Monitors List */}
      <div className={isDense ? "space-y-1.5" : "space-y-4"}>
        <div className="flex items-center justify-between">
          <h2 className={cn("text-muted-foreground uppercase tracking-wider", isDense ? "text-[8px]" : "text-xs")}>
            monitors
          </h2>
          <Link
            href="/monitors"
            className={cn(
              "text-muted-foreground hover:text-primary transition-colors",
              isDense ? "text-[8px]" : "text-[10px]",
            )}
          >
            view all →
          </Link>
        </div>

        {monitors.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center border border-dashed border-border rounded",
              isDense ? "py-6" : "py-16",
            )}
          >
            <Terminal className={cn("text-muted-foreground", isDense ? "h-4 w-4 mb-2" : "h-6 w-6 mb-3")} />
            <p className={cn("text-muted-foreground", isDense ? "text-[10px] mb-2" : "text-xs mb-4")}>
              no monitors configured
            </p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className={cn("bg-transparent", isDense ? "h-6 text-[10px]" : "h-7 text-xs")}
            >
              <Link href="/monitors/new">
                <Plus className="mr-1.5 h-3 w-3" />
                create monitor
              </Link>
            </Button>
          </div>
        ) : (
          <div className={cn("grid", isDense ? "gap-1.5" : "gap-3")}>
            {monitors.slice(0, isDense ? 10 : 5).map((monitor) => (
              <MonitorCard key={monitor.id} monitor={monitor} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
