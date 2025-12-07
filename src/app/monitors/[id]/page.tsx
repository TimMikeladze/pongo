// src/app/monitors/[id]/page.tsx

import { formatDistanceToNow } from "date-fns";
import type { Metadata } from "next";
import { Suspense } from "react";
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

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnouncementsList } from "@/components/announcements-list";
import { ChartCard } from "@/components/chart-card";
import { ErrorRateChart } from "@/components/error-rate-chart";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { RegionBreakdown } from "@/components/region-breakdown";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { SectionWithTooltip } from "@/components/section-with-tooltip";
import {
  ChartGridSkeleton,
  ListSkeleton,
  RecentChecksSkeleton,
  RegionBreakdownSkeleton,
  StatsGridSkeleton,
} from "@/components/skeletons";
import { StatsCard } from "@/components/stats-card";
import { StatusBadge } from "@/components/status-badge";
import { TriggerButton } from "@/components/trigger-button";
import { Button } from "@/components/ui/button";
import { UptimeBars } from "@/components/uptime-bars";
import type { TimeRange as TRType } from "@/lib/data";
import {
  getCheckResults,
  getDashboards,
  getErrorRateChartData,
  getMonitorStats,
  getMonitorStatsByRegion,
  getResponseTimeChartData,
  getStatusTimelineData,
} from "@/lib/data";
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
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pt-4">
        <Button variant="ghost" size="icon" asChild className="h-7 w-7">
          <Link href="/monitors">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <StatusBadge
              status={monitor.isActive ? status : "pending"}
              size="lg"
            />
            <h1 className="text-sm">{monitor.name}</h1>
            {!monitor.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                paused
              </span>
            )}
          </div>
        </div>
        <TriggerButton
          monitorId={id}
          enabled={process.env.ENABLE_MANUAL_RUN === "true"}
        />
      </div>

      <div className="space-y-6">
        {/* Stats - streams when ready */}
        <Suspense fallback={<StatsGridSkeleton />}>
          <MonitorStats
            monitorId={id}
            timeRange={timeRange}
            interval={interval}
            latestResult={latestResult}
          />
        </Suspense>

        {/* Region breakdown - streams when ready */}
        <Suspense fallback={<RegionBreakdownSkeleton />}>
          <MonitorRegionBreakdown monitorId={id} timeRange={timeRange} />
        </Suspense>

        {/* Uptime bars */}
        <div className="border border-border rounded bg-card p-4">
          <UptimeBars
            monitorId={id}
            monitorName={monitor.name}
            timeRange={timeRange}
            interval={interval}
            showLabels={true}
          />
        </div>

        {/* Charts - streams when ready */}
        <Suspense fallback={<ChartGridSkeleton />}>
          <MonitorCharts
            monitorId={id}
            timeRange={timeRange}
            interval={interval}
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
        <div className="border border-border rounded bg-card p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
            configuration
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">interval</span>
              <p className="font-mono">{monitor.intervalSeconds}s</p>
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
        </div>
      </div>
    </div>
  );
}

// Async component for stats section
async function MonitorStats({
  monitorId,
  timeRange,
  interval,
  latestResult,
}: {
  monitorId: string;
  timeRange: TRType;
  interval: IntervalOption;
  latestResult: Awaited<ReturnType<typeof getLatestCheckResult>>;
}) {
  const [stats, statusTimelineData] = await Promise.all([
    getMonitorStats(monitorId, timeRange),
    getStatusTimelineData(monitorId, timeRange, interval, 50),
  ]);

  const totalChecks = statusTimelineData.reduce((acc, d) => acc + d.total, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatsCard
        title="uptime"
        value={`${stats.uptime}%`}
        trend={
          stats.uptime >= 99.9 ? "up" : stats.uptime >= 99 ? "neutral" : "down"
        }
      />
      <StatsCard title="avg latency" value={`${stats.avgResponseTime}ms`} />
      <StatsCard title="checks" value={`${totalChecks}`} />
      <StatsCard
        title="last check"
        value={
          latestResult
            ? formatDistanceToNow(new Date(latestResult.checkedAt), {
                addSuffix: true,
              })
            : "never"
        }
        description={
          latestResult ? `${latestResult.responseTimeMs}ms` : undefined
        }
      />
    </div>
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
    <div className="grid md:grid-cols-2 gap-4">
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
    <div className="border border-border rounded bg-card p-4">
      <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
        recent checks
      </h3>
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
              <span className="text-[10px] text-muted-foreground">
                {result.errorMessage || "ok"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
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
      <SectionWithTooltip
        title="announcements"
        tooltip="To add announcements, create a markdown file in data/announcements/ with frontmatter specifying the dashboard and announcement details (title, type, expiresAt)."
      />
      <AnnouncementsList dashboardId={dashboardId} limit={5} />
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
      <SectionWithTooltip
        title="incident history"
        tooltip="To add incidents, create a markdown file in data/incidents/ with frontmatter specifying the dashboard, affectedMonitorIds (including this monitor), severity, and status."
      />
      <IncidentsTimeline dashboardId={dashboardId} limit={5} />
    </div>
  );
}
