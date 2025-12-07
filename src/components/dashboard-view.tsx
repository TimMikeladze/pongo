"use client"
import { StatsCard } from "@/components/stats-card"
import { AnnouncementsList } from "@/components/announcements-list"
import { IncidentsTimeline } from "@/components/incidents-timeline"
import { MaintenanceSchedule } from "@/components/maintenance-schedule"
import { SLAStatus } from "@/components/sla-status"
import { UptimeBars } from "@/components/uptime-bars"
import { useMonitors, useActiveIncidents } from "@/lib/hooks"
import type { Dashboard } from "@/lib/types"
import { store } from "@/lib/store"

interface DashboardViewProps {
  dashboard: Dashboard
  isPublic?: boolean
}

export function DashboardView({ dashboard, isPublic = false }: DashboardViewProps) {
  const allMonitors = useMonitors()
  const monitors = allMonitors.filter((m) => dashboard.monitorIds.includes(m.id))
  const activeIncidents = useActiveIncidents(dashboard.id)

  // Calculate overall stats
  const allUp = monitors.every((m) => {
    const result = store.getLatestCheckResult(m.id)
    return result?.status === "up"
  })

  const overallUptime =
    monitors.length > 0
      ? monitors.reduce((acc, m) => acc + store.getUptimePercentage(m.id, 24), 0) / monitors.length
      : 100

  const avgResponseTime =
    monitors.length > 0
      ? Math.round(monitors.reduce((acc, m) => acc + store.getAverageResponseTime(m.id, 24), 0) / monitors.length)
      : 0

  return (
    <div className="space-y-6">
      {/* Active Incidents Banner */}
      {activeIncidents.length > 0 && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <p className="text-xs font-medium text-red-400 mb-2">
            {activeIncidents.length} active incident{activeIncidents.length > 1 ? "s" : ""}
          </p>
          <IncidentsTimeline dashboardId={dashboard.id} showResolved={false} />
        </div>
      )}

      {/* Announcements */}
      <AnnouncementsList dashboardId={dashboard.id} limit={3} />

      {/* Maintenance Schedule */}
      <MaintenanceSchedule dashboardId={dashboard.id} />

      {/* Overall Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard title="status" value={allUp ? "operational" : "degraded"} trend={allUp ? "up" : "down"} />
        <StatsCard title="uptime" value={`${overallUptime.toFixed(1)}%`} description="24h" />
        <StatsCard title="latency" value={`${avgResponseTime}ms`} description="avg" />
        <StatsCard title="monitors" value={monitors.length.toString()} description="active" />
      </div>

      {/* SLA Status */}
      {dashboard.slaTarget && <SLAStatus dashboardId={dashboard.id} />}

      <div className="space-y-2">
        <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">system status</h3>
        {monitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground text-xs">No monitors in this dashboard</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            {monitors.map((monitor) => (
              <UptimeBars
                key={monitor.id}
                monitorId={monitor.id}
                monitorName={monitor.name}
                days={90}
                showLabels={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Incident History */}
      {!isPublic && (
        <div className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">incident history</h3>
          <IncidentsTimeline dashboardId={dashboard.id} limit={5} />
        </div>
      )}
    </div>
  )
}
