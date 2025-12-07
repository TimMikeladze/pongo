import { StatsCard } from "@/components/stats-card";
import { AnnouncementsList } from "@/components/announcements-list";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { MaintenanceSchedule } from "@/components/maintenance-schedule";
import { SLAStatus } from "@/components/sla-status";
import { UptimeBars } from "@/components/uptime-bars";
import {
  getDashboard,
  getMonitors,
  getActiveIncidents,
  getLatestCheckResult,
  getUptimePercentage,
  getAverageResponseTime,
} from "@/lib/data";

interface DashboardViewProps {
  dashboardId: string;
  isPublic?: boolean;
}

export async function DashboardView({
  dashboardId,
  isPublic = false,
}: DashboardViewProps) {
  const dashboard = await getDashboard(dashboardId);

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-xs">Dashboard not found</p>
      </div>
    );
  }

  const [allMonitors, activeIncidents] = await Promise.all([
    getMonitors(),
    getActiveIncidents(dashboardId),
  ]);

  const monitors = allMonitors.filter((m) =>
    dashboard.monitorIds.includes(m.id),
  );

  // Calculate overall stats
  const latestResults = await Promise.all(
    monitors.map((m) => getLatestCheckResult(m.id)),
  );

  const allUp = latestResults.every((result) => result?.status === "up");

  const [uptimes, responseTimes] = await Promise.all([
    Promise.all(monitors.map((m) => getUptimePercentage(m.id, 24))),
    Promise.all(monitors.map((m) => getAverageResponseTime(m.id, 24))),
  ]);

  const overallUptime =
    monitors.length > 0
      ? uptimes.reduce((acc, uptime) => acc + uptime, 0) / monitors.length
      : 100;

  const avgResponseTime =
    monitors.length > 0
      ? Math.round(
          responseTimes.reduce((acc, time) => acc + time, 0) / monitors.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Active Incidents Banner */}
      {activeIncidents.length > 0 && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <p className="text-xs font-medium text-red-400 mb-2">
            {activeIncidents.length} active incident
            {activeIncidents.length > 1 ? "s" : ""}
          </p>
          <IncidentsTimeline dashboardId={dashboardId} showResolved={false} />
        </div>
      )}

      {/* Announcements */}
      <AnnouncementsList dashboardId={dashboardId} limit={3} />

      {/* Maintenance Schedule */}
      <MaintenanceSchedule dashboardId={dashboardId} />

      {/* Overall Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard
          title="status"
          value={allUp ? "operational" : "degraded"}
          trend={allUp ? "up" : "down"}
        />
        <StatsCard
          title="uptime"
          value={`${overallUptime.toFixed(1)}%`}
          description="24h"
        />
        <StatsCard
          title="latency"
          value={`${avgResponseTime}ms`}
          description="avg"
        />
        <StatsCard
          title="monitors"
          value={monitors.length.toString()}
          description="active"
        />
      </div>

      {/* SLA Status */}
      {dashboard.slaTarget && <SLAStatus dashboardId={dashboardId} />}

      <div className="space-y-2">
        <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
          system status
        </h3>
        {monitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground text-xs">
              No monitors in this dashboard
            </p>
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
          <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
            incident history
          </h3>
          <IncidentsTimeline dashboardId={dashboardId} limit={5} />
        </div>
      )}
    </div>
  );
}
