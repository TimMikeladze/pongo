import { CheckCircle2, CircleHelp, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { AnnouncementsList } from "@/components/announcements-list";
import { dashboardMeasurements } from "@/components/dashboard-measurements";
import { Disclosure } from "@/components/disclosure";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { MaintenanceSchedule } from "@/components/maintenance-schedule";
import { MonitorErrorRateChart } from "@/components/monitor-error-rate-chart";
import { MonitorResponseChart } from "@/components/monitor-response-chart";
import {
  EmptyState,
  MetricStrip,
  SectionHeading,
} from "@/components/page-layout";
import { SLAStatus } from "@/components/sla-status";
import { TimeRangePicker } from "@/components/time-range-picker";
import { Badge } from "@/components/ui/badge";
import { UptimeBars } from "@/components/uptime-bars";
import {
  getActiveIncidents,
  getAnnouncements,
  getCheckResults,
  getDashboard,
  getLatestCheckResult,
  getMonitors,
  type TimeRange,
} from "@/lib/data";
import { healthLabels, summarizeHealth } from "@/lib/health";
import type { IntervalOption } from "@/lib/time-range";

interface DashboardViewProps {
  dashboardId: string;
  isPublic?: boolean;
  timeRange: TimeRange;
  interval?: IntervalOption;
}

export async function DashboardView({
  dashboardId,
  isPublic = false,
  timeRange,
  interval = "1h",
}: DashboardViewProps) {
  const dashboard = await getDashboard(dashboardId);
  if (!dashboard) return <EmptyState title="Dashboard not found" />;
  const [allMonitors, activeIncidents, announcements] = await Promise.all([
    getMonitors(),
    getActiveIncidents(dashboardId),
    getAnnouncements(dashboardId),
  ]);
  const monitors = allMonitors.filter((monitor) =>
    dashboard.monitorIds.includes(monitor.id),
  );
  const [latestResults, checks] = await Promise.all([
    Promise.all(monitors.map((monitor) => getLatestCheckResult(monitor.id))),
    Promise.all(
      monitors.map((monitor) => getCheckResults(monitor.id, { timeRange })),
    ),
  ]);
  const health = summarizeHealth(
    monitors.map((monitor, index) =>
      monitor.isActive ? latestResults[index]?.status : "pending",
    ),
  );
  const measurements = dashboardMeasurements(checks);
  const HealthIcon =
    health === "up"
      ? CheckCircle2
      : health === "pending"
        ? CircleHelp
        : TriangleAlert;
  const basePath = isPublic
    ? `/shared/${dashboard.slug}`
    : `/dashboards/${dashboardId}`;
  const HealthHeading = isPublic ? "h1" : "h2";
  const title = {
    up: "All systems operational",
    down: "Some services are down",
    degraded: "Some services are degraded",
    pending: "Awaiting service checks",
  }[health];

  return (
    <div className="page-stack">
      <section
        className="flex items-center gap-3 flex-wrap"
        aria-label="Current service health"
      >
        <Badge
          variant="status"
          className="status-pill p-3"
          data-status={health}
        >
          <HealthIcon className="h-6 w-6" />
        </Badge>
        <div>
          <HealthHeading className="page-title">{title}</HealthHeading>
          <p className="mt-1 text-sm text-muted-foreground">
            {monitors.length} monitored{" "}
            {monitors.length === 1 ? "service" : "services"}
            {activeIncidents.length
              ? ` · ${activeIncidents.length} active ${activeIncidents.length === 1 ? "incident" : "incidents"}`
              : ""}
          </p>
        </div>
        <div className="ml-auto shrink-0">
          <TimeRangePicker />
        </div>
      </section>
      <MetricStrip>
        <dl className="contents">
          <div>
            <dt className="metric-label">Availability</dt>
            <dd className="metric-value">
              {measurements.uptime === null
                ? "—"
                : `${measurements.uptime.toFixed(2)}%`}
            </dd>
          </div>
          <div>
            <dt className="metric-label">Average response</dt>
            <dd className="metric-value">
              {measurements.responseTime === null
                ? "—"
                : `${measurements.responseTime} ms`}
            </dd>
          </div>
          <div>
            <dt className="metric-label">Recorded checks</dt>
            <dd className="metric-value">
              {measurements.checkCount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="metric-label">Current status</dt>
            <dd className="metric-value text-sm font-sans tracking-normal">
              {healthLabels[health]}
            </dd>
          </div>
        </dl>
      </MetricStrip>
      {activeIncidents.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Active incidents"
            actions={
              <Link
                className="text-sm text-muted-foreground hover:text-foreground"
                href={`${basePath}/incidents`}
              >
                Incident history
              </Link>
            }
          />
          <IncidentsTimeline dashboardId={dashboardId} showResolved={false} />
        </section>
      )}
      <section className="space-y-3">
        <SectionHeading
          title="Service status"
          description="Bars show the worst recorded state per display period. Inspect a period for checks; the sparkline shows every interval."
        />
        {monitors.length === 0 ? (
          <EmptyState
            title="No services configured"
            description="This dashboard has no monitors yet."
          />
        ) : (
          <div className="panel divide-y divide-border px-3">
            {monitors.map((monitor) => (
              <UptimeBars
                key={monitor.id}
                monitorId={monitor.id}
                monitorName={monitor.name}
                timeRange={timeRange}
                interval={interval}
                showLabels
              />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {(["up", "degraded", "down", "pending"] as const).map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-sm bg-status-pending"
                style={{ backgroundColor: `var(--status-${status})` }}
              />
              {status === "pending" ? "No data" : healthLabels[status]}
            </span>
          ))}
        </div>
      </section>
      {announcements.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            title="Updates"
            actions={
              <Link
                className="text-sm text-muted-foreground hover:text-foreground"
                href={`${basePath}/announcements`}
              >
                View all updates
              </Link>
            }
          />
          <AnnouncementsList dashboardId={dashboardId} limit={3} />
        </section>
      )}
      <MaintenanceSchedule dashboardId={dashboardId} />
      {dashboard.slaTarget && (
        <SLAStatus dashboardId={dashboardId} timeRange={timeRange} />
      )}
      {monitors.length > 0 && (
        <Disclosure
          title="Performance"
          description="Response times and error rates · expand to inspect"
          className="panel"
        >
          <div className="space-y-3 border-t border-border p-3">
            {measurements.checkCount === 0 ? (
              <EmptyState
                variant="plain"
                title="No measurements in this period"
                description="Choose another time range or wait for the scheduler to record checks."
              />
            ) : (
              monitors.map((monitor, index) => (
                <section key={monitor.id} className="space-y-3">
                  <h3 className="text-sm font-medium">{monitor.name}</h3>
                  {dashboardMeasurements([checks[index]]).checkCount ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs text-muted-foreground">
                          Response time
                        </p>
                        <MonitorResponseChart
                          monitorId={monitor.id}
                          height={130}
                          timeRange={timeRange}
                          interval={interval}
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-xs text-muted-foreground">
                          Error rate
                        </p>
                        <MonitorErrorRateChart
                          monitorId={monitor.id}
                          height={130}
                          timeRange={timeRange}
                          interval={interval}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Awaiting first check in this period.
                    </p>
                  )}
                </section>
              ))
            )}
          </div>
        </Disclosure>
      )}
      <section className="space-y-3">
        <SectionHeading
          title="Recent incidents"
          actions={
            <Link
              className="text-sm text-muted-foreground hover:text-foreground"
              href={`${basePath}/incidents`}
            >
              View incident history
            </Link>
          }
        />
        <IncidentsTimeline
          dashboardId={dashboardId}
          limit={isPublic ? 2 : 5}
          compactEmpty
        />
      </section>
    </div>
  );
}
