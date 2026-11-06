// src/app/monitors/[id]/page.tsx

import { formatDistanceToNow } from "date-fns";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { getLatestCheckResult, getMonitor } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const monitor = await getMonitor(id);
  return {
    title: monitor?.name ?? "Monitor",
    description: monitor
      ? `Uptime monitoring for ${monitor.name}`
      : "Monitor details and statistics",
    robots: {
      index: false,
      follow: false,
    },
  };
}

import { notFound } from "next/navigation";
import { AlertActions } from "@/components/alert-actions";
import { AlertSeverityBadge } from "@/components/alert-severity-badge";
import { AlertTable } from "@/components/alert-table";
import { AnnouncementsList } from "@/components/announcements-list";
import { ChartCard } from "@/components/chart-card";
import { dashboardMeasurements } from "@/components/dashboard-measurements";
import { ErrorRateChart } from "@/components/error-rate-chart";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import {
  EmptyState,
  MetricStrip,
  PageHeading,
  SectionHeading,
} from "@/components/page-layout";
import { RegionBreakdown } from "@/components/region-breakdown";
import { ResponseTimeChart } from "@/components/response-time-chart";
import {
  ChartGridSkeleton,
  ListSkeleton,
  RecentChecksSkeleton,
  RegionBreakdownSkeleton,
  StatsGridSkeleton,
} from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import { TimeRangePicker } from "@/components/time-range-picker";
import { TriggerButton } from "@/components/trigger-button";
import { UptimeBars } from "@/components/uptime-bars";
import type { TimeRange as TRType } from "@/lib/data";
import {
  getAlertEvents,
  getAlertOverrides,
  getCheckResults,
  getDashboards,
  getErrorRateChartData,
  getFiringAlerts,
  getMonitorStatsByRegion,
  getResponseTimeChartData,
} from "@/lib/data";
import { healthLabels } from "@/lib/health";
import type { IntervalOption } from "@/lib/time-range";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MonitorDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const monitor = await getMonitor(id);

  if (!monitor) {
    notFound();
  }

  const { preset, from, to, interval } =
    await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });

  // Fetch only what's needed for immediate header render
  const latestResult = await getLatestCheckResult(id);
  const status = latestResult?.status ?? "pending";

  return (
    <div className="page-stack">
      <PageHeading
        title={monitor.name}
        description={`${monitor.cron ? `Schedule ${monitor.cron}` : `Checks every ${monitor.intervalSeconds}s`} · ${monitor.timeoutMs}ms timeout`}
        back={{ href: "/monitors", label: "Monitors" }}
        actions={
          <>
            <TimeRangePicker />
            <TriggerButton
              monitorId={id}
              enabled={process.env.ENABLE_MANUAL_RUN === "true"}
            />
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant="status"
          className="status-pill"
          data-status={monitor.isActive ? status : "pending"}
        >
          {monitor.isActive ? healthLabels[status] : "Paused"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {!monitor.isActive
            ? "Scheduled checks are paused."
            : latestResult
              ? latestResult.errorMessage || "Latest check recorded."
              : "Awaiting first check. Start the scheduler to collect measurements."}
        </span>
      </div>

      <div className="space-y-6">
        {/* Stats - streams when ready */}
        <Suspense fallback={<StatsGridSkeleton />}>
          <MonitorStats
            monitorId={id}
            timeRange={timeRange}
            latestResult={latestResult}
          />
        </Suspense>

        {/* Region breakdown - streams when ready */}
        <Suspense fallback={<RegionBreakdownSkeleton />}>
          <MonitorRegionBreakdown monitorId={id} timeRange={timeRange} />
        </Suspense>

        <section>
          <SectionHeading
            title="Availability history"
            description="Recorded checks in the selected time range."
          />
          <div className="panel p-3">
            <UptimeBars
              monitorId={id}
              monitorName={monitor.name}
              timeRange={timeRange}
              interval={interval}
              showLabels={true}
            />
          </div>
        </section>
        <section>
          <SectionHeading
            title="Performance"
            description="Response times and failures in the selected time range."
          />
          <Suspense fallback={<ChartGridSkeleton />}>
            <MonitorCharts
              monitorId={id}
              timeRange={timeRange}
              interval={interval}
            />
          </Suspense>
        </section>
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <MonitorAlerts
            monitorId={id}
            timeRange={timeRange}
            alerts={monitor.alerts ?? []}
          />
        </Suspense>

        {/* Recent Checks - streams when ready */}
        <Suspense fallback={<RecentChecksSkeleton />}>
          <MonitorRecentChecks monitorId={id} timeRange={timeRange} />
        </Suspense>

        {/* Announcements & Incidents - streams when ready */}
        <Suspense fallback={<ListSkeleton rows={3} />}>
          <MonitorAnnouncements monitorId={id} />
        </Suspense>

        <Suspense fallback={<ListSkeleton rows={3} />}>
          <MonitorIncidents monitorId={id} />
        </Suspense>

        {/* Config display */}
        <section>
          <SectionHeading
            title="Configuration"
            description={`Defined in pongo/monitors/${id}.ts. Edit the file and restart the scheduler to apply changes.`}
          />
          <div className="panel grid grid-cols-2 md:grid-cols-3 gap-3 p-3 text-sm">
            <div>
              <span className="text-muted-foreground">
                {monitor.cron ? "schedule" : "interval"}
              </span>
              <p className="font-mono">
                {monitor.cron || `${monitor.intervalSeconds}s`}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">timeout</span>
              <p className="font-mono">{monitor.timeoutMs}ms</p>
            </div>
            <div>
              <span className="text-muted-foreground">type</span>
              <p className="font-mono">handler</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Async component for stats section
async function MonitorStats({
  monitorId,
  timeRange,
  latestResult,
}: {
  monitorId: string;
  timeRange: TRType;
  latestResult: Awaited<ReturnType<typeof getLatestCheckResult>>;
}) {
  const results = await getCheckResults(monitorId, { timeRange });
  const stats = dashboardMeasurements([results]);
  const totalChecks = stats.checkCount;

  return (
    <MetricStrip>
      <div>
        <span className="text-xs text-muted-foreground">Availability</span>
        <p className="mt-1 text-2xl font-medium tabular-nums">
          {totalChecks
            ? `${Math.round((stats.uptime ?? 0) * 100) / 100}%`
            : "—"}
        </p>
        <span className="text-xs text-muted-foreground">
          {totalChecks ? "Selected period" : "No measurements"}
        </span>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">Average response</span>
        <p className="mt-1 text-2xl font-medium tabular-nums">
          {stats.responseTime !== null ? `${stats.responseTime} ms` : "—"}
        </p>
        <span className="text-xs text-muted-foreground">
          {totalChecks ? "Selected period" : "No measurements"}
        </span>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">Checks</span>
        <p className="mt-1 text-2xl font-medium tabular-nums">{totalChecks}</p>
        <span className="text-xs text-muted-foreground">Selected period</span>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">Last check</span>
        <p className="mt-1 text-base font-medium">
          {latestResult
            ? formatDistanceToNow(new Date(latestResult.checkedAt), {
                addSuffix: true,
              })
            : "Awaiting first check"}
        </p>
        <span className="text-xs text-muted-foreground">
          {latestResult &&
          latestResult.status !== "pending" &&
          latestResult.status !== "down"
            ? `${latestResult.responseTimeMs} ms`
            : "No response recorded"}
        </span>
      </div>
    </MetricStrip>
  );
}

// Async component for region breakdown
async function MonitorRegionBreakdown({
  monitorId,
  timeRange,
}: {
  monitorId: string;
  timeRange: TRType;
}) {
  const regionStats = await getMonitorStatsByRegion(monitorId, timeRange);

  if (regionStats.length <= 1) {
    return null;
  }

  return <RegionBreakdown stats={regionStats} />;
}

// Async component for charts
async function MonitorCharts({
  monitorId,
  timeRange,
  interval,
}: {
  monitorId: string;
  timeRange: TRType;
  interval: IntervalOption;
}) {
  const [responseTimeData, errorRateData] = await Promise.all([
    getResponseTimeChartData(monitorId, timeRange, interval),
    getErrorRateChartData(monitorId, timeRange, interval),
  ]);

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <ChartCard
        title="response time"
        icon="activity"
        iconClassName="text-primary"
        defaultChartType="line"
      >
        <ResponseTimeChart data={responseTimeData} height={140} />
      </ChartCard>
      <ChartCard
        title="error rate"
        icon="alert-triangle"
        iconClassName="text-status-down"
        defaultChartType="bar"
      >
        <ErrorRateChart data={errorRateData} height={140} />
      </ChartCard>
    </div>
  );
}

// Async component for recent checks
async function MonitorRecentChecks({
  monitorId,
  timeRange,
}: {
  monitorId: string;
  timeRange: TRType;
}) {
  const results = await getCheckResults(monitorId, { timeRange, limit: 10 });

  return (
    <section>
      <SectionHeading
        title="Recent checks"
        description="The ten latest results in the selected period."
      />
      {!results.length ? (
        <EmptyState
          title="No checks in this time range"
          description="Select a wider range or start the scheduler to record checks."
        />
      ) : null}
      <div className="panel px-3">
        <div className="space-y-1">
          {results.slice(0, 10).map((result) => (
            <div
              key={result.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-border last:border-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <StatusBadge status={result.status} size="sm" />
                <span
                  className={cn(
                    "text-xs",
                    result.status === "up" &&
                      "text-green-700 dark:text-green-400",
                    result.status === "degraded" &&
                      "text-yellow-700 dark:text-yellow-400",
                    result.status === "down" &&
                      "text-red-700 dark:text-red-400",
                  )}
                >
                  {result.statusCode ?? "—"}
                </span>
                <span className="break-words text-xs text-muted-foreground">
                  {result.errorMessage || result.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{result.responseTimeMs}ms</span>
                <span>
                  {formatDistanceToNow(new Date(result.checkedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Async component for announcements
async function MonitorAnnouncements({ monitorId }: { monitorId: string }) {
  const dashboards = await getDashboards();
  const relevantDashboardIds = dashboards
    .filter((d) => d.monitorIds.includes(monitorId))
    .map((d) => d.id);

  // Use the first relevant dashboard for announcements
  const dashboardId = relevantDashboardIds[0];

  return (
    <div className="space-y-2">
      <SectionHeading
        title="Updates"
        description="Updates for the dashboard containing this monitor."
      />
      {dashboardId ? (
        <AnnouncementsList dashboardId={dashboardId} limit={5} />
      ) : (
        <EmptyState
          title="No dashboard announcements"
          description="This monitor does not belong to a dashboard."
        />
      )}
    </div>
  );
}

// Async component for incidents
async function MonitorIncidents({ monitorId }: { monitorId: string }) {
  const dashboards = await getDashboards();
  const relevantDashboardIds = dashboards
    .filter((d) => d.monitorIds.includes(monitorId))
    .map((d) => d.id);

  const dashboardId = relevantDashboardIds[0];

  return (
    <div className="space-y-2">
      <SectionHeading
        title="Incident history"
        description="Incidents reported for the dashboard containing this monitor."
      />
      {dashboardId ? (
        <IncidentsTimeline dashboardId={dashboardId} limit={5} />
      ) : (
        <EmptyState
          title="No dashboard incidents"
          description="This monitor does not belong to a dashboard."
        />
      )}
    </div>
  );
}

async function MonitorAlerts({
  monitorId,
  timeRange,
  alerts,
}: {
  monitorId: string;
  timeRange: TRType;
  alerts: NonNullable<import("@/lib/types").Monitor["alerts"]>;
}) {
  const [events, overrides, firing] = await Promise.all([
    getAlertEvents(timeRange),
    getAlertOverrides(),
    getFiringAlerts(),
  ]);
  const monitorEvents = events.filter((event) => event.monitorId === monitorId);
  const severities = Object.fromEntries(
    alerts.map((alert) => [alert.id, alert.severity ?? "warning"]),
  );
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Alerts"
        description="Configured rules and recent activity for this monitor."
      />
      {alerts.length ? (
        <div className="panel divide-y divide-border">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{alert.name}</span>
                <AlertSeverityBadge severity={alert.severity ?? "warning"} />
                <span className="text-xs text-muted-foreground">
                  {overrides[alert.id]?.disabled
                    ? "Disabled"
                    : overrides[alert.id]?.silencedUntil &&
                        new Date(overrides[alert.id].silencedUntil ?? 0) >
                          new Date()
                      ? "Silenced"
                      : firing.some((item) => item.alertId === alert.id)
                        ? "Firing"
                        : "Not firing"}
                </span>
              </div>
              <AlertActions alertId={alert.id} override={overrides[alert.id]} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No alert rules configured"
          description="Add alert conditions and channel names to this monitor’s configuration."
        />
      )}
      {monitorEvents.length ? (
        <AlertTable
          events={monitorEvents}
          overrides={overrides}
          alertSeverities={severities}
        />
      ) : null}
    </section>
  );
}
