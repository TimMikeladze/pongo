// src/app/monitors/[id]/page.tsx

import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { getMonitor } from "@/lib/data";

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
  };
}
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Info,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChartCard } from "@/components/chart-card";
import { ErrorRateChart } from "@/components/error-rate-chart";
import { IncidentCard } from "@/components/incident-card";
import { RegionBreakdown } from "@/components/region-breakdown";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { SectionWithTooltip } from "@/components/section-with-tooltip";
import { StatsCard } from "@/components/stats-card";
import { StatusBadge } from "@/components/status-badge";
import { TriggerButton } from "@/components/trigger-button";
import { Button } from "@/components/ui/button";
import { UptimeBars } from "@/components/uptime-bars";
import {
  getAnnouncements,
  getCheckResults,
  getDashboards,
  getErrorRateChartData,
  getIncidents,
  getLatestCheckResult,
  getMonitorStats,
  getMonitorStatsByRegion,
  getMonitors,
  getResponseTimeChartData,
  getStatusTimelineData,
} from "@/lib/data";
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

  const [
    latestResult,
    results,
    stats,
    regionStats,
    dashboards,
    allMonitors,
    responseTimeData,
    errorRateData,
    statusTimelineData,
  ] = await Promise.all([
    getLatestCheckResult(id),
    getCheckResults(id, { timeRange, limit: 10 }), // Only fetch what we need for recent checks list
    getMonitorStats(id, timeRange),
    getMonitorStatsByRegion(id, timeRange),
    getDashboards(),
    getMonitors(),
    getResponseTimeChartData(id, timeRange, interval),
    getErrorRateChartData(id, timeRange, interval),
    getStatusTimelineData(id, timeRange, interval, 50),
  ]);

  const status = latestResult?.status ?? "pending";

  // Get dashboards that include this monitor
  const relevantDashboards = dashboards.filter((d) =>
    d.monitorIds.includes(id),
  );

  // Get announcements from relevant dashboards
  const allAnnouncements = await Promise.all(
    relevantDashboards.map((d) => getAnnouncements(d.id)),
  );
  const monitorAnnouncements = allAnnouncements.flat().slice(0, 5);

  // Get incidents that affect this monitor
  const allIncidents = await Promise.all(
    relevantDashboards.map((d) => getIncidents(d.id)),
  );
  const monitorIncidents = allIncidents
    .flat()
    .filter((incident) => incident.affectedMonitorIds.includes(id))
    .slice(0, 5);

  const announcementTypeIcons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    maintenance: Wrench,
  };

  const announcementTypeStyles = {
    info: "border-blue-500/30 bg-blue-500/5 text-blue-400",
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    maintenance: "border-purple-500/30 bg-purple-500/5 text-purple-400",
  };

  // Calculate total checks from timeline data for stats
  const totalChecks = statusTimelineData.reduce((acc, d) => acc + d.total, 0);

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
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="uptime"
            value={`${stats.uptime}%`}
            trend={
              stats.uptime >= 99.9
                ? "up"
                : stats.uptime >= 99
                  ? "neutral"
                  : "down"
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

        {/* Region breakdown */}
        {regionStats.length > 1 && <RegionBreakdown stats={regionStats} />}

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

        {/* Response time and error rate charts */}
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

        {/* Recent Checks */}
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

        {/* Announcements */}
        <div className="space-y-2">
          <SectionWithTooltip
            title="announcements"
            tooltip="To add announcements, create a markdown file in data/announcements/ with frontmatter specifying the dashboard and announcement details (title, type, expiresAt)."
          />
          <div className="border border-border rounded bg-card p-4">
            {monitorAnnouncements.length === 0 ? (
              <div className="text-center py-8 text-[11px] text-muted-foreground">
                No announcements
              </div>
            ) : (
              <div className="space-y-3">
                {monitorAnnouncements.map((announcement) => {
                  const Icon = announcementTypeIcons[announcement.type];
                  return (
                    <div
                      key={announcement.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${announcementTypeStyles[announcement.type]}`}
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">
                            {announcement.title}
                          </p>
                          <span className="text-[10px] opacity-60">
                            {formatDistanceToNow(
                              new Date(announcement.createdAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </span>
                        </div>
                        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: rendering markdown */}
                        <div
                          className="text-[11px] opacity-80 mt-1 prose prose-sm prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: announcement.message,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Incident History */}
        <div className="space-y-2">
          <SectionWithTooltip
            title="incident history"
            tooltip="To add incidents, create a markdown file in data/incidents/ with frontmatter specifying the dashboard, affectedMonitorIds (including this monitor), severity, and status."
          />
          <div className="border border-border rounded bg-card p-4">
            {monitorIncidents.length === 0 ? (
              <div className="text-center py-8 text-[11px] text-muted-foreground">
                No incidents reported
              </div>
            ) : (
              <div className="space-y-3">
                {monitorIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    monitors={allMonitors}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

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
