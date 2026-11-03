import {
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  TriangleAlert,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { ChartCard } from "@/components/chart-card";
import { dashboardMeasurements } from "@/components/dashboard-measurements";
import { Disclosure } from "@/components/disclosure";
import { ErrorRateChart } from "@/components/error-rate-chart";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { LatencyPercentilesChart } from "@/components/latency-percentiles-chart";
import { MonitorTable } from "@/components/monitor-table";
import {
  EmptyState,
  MetricStrip,
  PageHeading,
  SectionHeading,
} from "@/components/page-layout";
import { PublicDashboardsList } from "@/components/public-dashboards-list";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { StatsCard } from "@/components/stats-card";
import { StatusDistributionChart } from "@/components/status-distribution-chart";
import { ThroughputChart } from "@/components/throughput-chart";
import { TimeRangePicker } from "@/components/time-range-picker";
import { Button } from "@/components/ui/button";
import { UptimeChart } from "@/components/uptime-chart";
import { isAuthEnabled, isAuthenticated } from "@/lib/auth";
import {
  getAggregatedErrorRateChartData,
  getAggregatedLatencyPercentilesChartData,
  getAggregatedResponseTimeChartData,
  getAggregatedStatusDistributionData,
  getAggregatedThroughputChartData,
  getAggregatedUptimeChartData,
  getCheckResults,
  getDashboards,
  getFiringAlerts,
  getLatestCheckResult,
  getMonitors,
} from "@/lib/data";
import { summarizeHealth } from "@/lib/health";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";

export const metadata: Metadata = {
  title: "Overview",
  description: "Current monitor health, alerts and service performance",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OverviewPage({ searchParams }: Props) {
  if (isAuthEnabled() && !(await isAuthenticated())) {
    const publicDashboards = (await getDashboards()).filter(
      (dashboard) => dashboard.isPublic,
    );
    if (publicDashboards.length === 1)
      redirect(`/shared/${publicDashboards[0].slug}`);
    return <PublicDashboardsList dashboards={publicDashboards} />;
  }
  const monitors = await getMonitors();
  const active = monitors.filter((monitor) => monitor.isActive);
  const ids = active.map((monitor) => monitor.id);
  const { preset, from, to, interval } =
    await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });
  const [latest, checks, firingAlerts] = await Promise.all([
    Promise.all(active.map((monitor) => getLatestCheckResult(monitor.id))),
    Promise.all(
      active.map((monitor) => getCheckResults(monitor.id, { timeRange })),
    ),
    getFiringAlerts(),
  ]);
  const health = summarizeHealth(latest.map((result) => result?.status));
  const measurements = dashboardMeasurements(checks);
  const upCount = latest.filter((result) => result?.status === "up").length;
  const affected = active.filter(
    (_, index) =>
      latest[index]?.status === "down" || latest[index]?.status === "degraded",
  );
  const HealthIcon =
    health === "up"
      ? CheckCircle2
      : health === "pending"
        ? CircleHelp
        : TriangleAlert;
  const [
    responseTimeData,
    uptimeData,
    errorRateData,
    latencyData,
    throughputData,
    distribution,
  ] = ids.length
    ? await Promise.all([
        getAggregatedResponseTimeChartData(ids, timeRange, interval),
        getAggregatedUptimeChartData(ids, timeRange, interval),
        getAggregatedErrorRateChartData(ids, timeRange, interval),
        getAggregatedLatencyPercentilesChartData(ids, timeRange, interval),
        getAggregatedThroughputChartData(ids, timeRange, interval),
        getAggregatedStatusDistributionData(ids, timeRange),
      ])
    : [[], [], [], [], [], { up: 0, degraded: 0, down: 0 }];
  return (
    <div className="page-stack">
      <AutoRefresh
        intervalSeconds={
          active.length
            ? Math.min(...active.map((monitor) => monitor.intervalSeconds))
            : 0
        }
      />
      <PageHeading
        title="Overview"
        description={`${monitors.length} configured monitors · ${active.length} active · ${monitors.length - active.length} paused`}
        actions={
          <>
            <TimeRangePicker />
            <Button asChild variant="outline">
              <Link href="/dashboards" className="control-button">
                Status pages
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </>
        }
      />
      <section
        className="notice"
        aria-label="Current system health"
        style={
          health === "down" || health === "degraded"
            ? {
                background: "var(--status-degraded-bg)",
                borderColor:
                  "color-mix(in srgb, var(--status-degraded), var(--border) 65%)",
              }
            : undefined
        }
      >
        <HealthIcon
          className={`size-5 shrink-0 ${health === "up" ? "text-status-up" : health === "pending" ? "text-muted-foreground" : "text-status-degraded"}`}
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold">
            {affected.length
              ? `${affected.length} ${affected.length === 1 ? "monitor needs" : "monitors need"} attention`
              : health === "pending"
                ? "Waiting for the first check results"
                : "All monitors operational"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {affected.length
              ? `${affected.map((monitor) => monitor.name).join(", ")} · ${firingAlerts.length} firing ${firingAlerts.length === 1 ? "alert" : "alerts"}`
              : health === "pending"
                ? active.length
                  ? "Run the scheduler to start collecting measurements."
                  : "Configure and activate monitors to start collecting measurements."
                : firingAlerts.length
                  ? `${firingAlerts.length} firing alerts still need review.`
                  : "No services are currently reporting an issue."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link
            href={
              affected.length
                ? `/monitors/${affected[0].id}`
                : health === "pending"
                  ? "/settings"
                  : "/alerts"
            }
            className="control-button"
          >
            {affected.length
              ? "Investigate"
              : health === "pending"
                ? "View setup"
                : "View alerts"}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </section>
      <MetricStrip>
        <StatsCard
          title="Availability"
          value={
            measurements.uptime === null
              ? "—"
              : `${measurements.uptime.toFixed(3)}%`
          }
          description={
            measurements.checkCount
              ? "Selected reporting period"
              : "No check data"
          }
        />
        <StatsCard
          title="Average response"
          value={
            measurements.responseTime === null
              ? "—"
              : `${measurements.responseTime} ms`
          }
          description={
            measurements.responseTime === null
              ? "Not measured yet"
              : "Across measured monitors"
          }
        />
        <StatsCard
          title="Operational monitors"
          value={`${upCount} / ${active.length}`}
          description={
            active.length ? "Current check status" : "No active monitors"
          }
        />
        <StatsCard
          title="Firing alerts"
          value={firingAlerts.length}
          description={
            firingAlerts.length ? "Review alert conditions" : "No alerts firing"
          }
          trend={firingAlerts.length ? "down" : "neutral"}
        />
      </MetricStrip>
      <section aria-label="Monitors">
        <SectionHeading
          title="Monitors"
          actions={
            <Link
              href="/monitors"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all monitors <ArrowUpRight className="inline size-3.5" />
            </Link>
          }
        />
        {monitors.length ? (
          <MonitorTable monitors={monitors} timeRange={timeRange} />
        ) : (
          <div className="panel">
            <EmptyState
              variant="plain"
              title="No monitors configured"
              description="Define monitors in pongo/monitors/ and run the scheduler to collect checks."
            >
              <Button asChild variant="outline">
                <Link href="/settings" className="control-button">
                  Configuration
                </Link>
              </Button>
            </EmptyState>
          </div>
        )}
      </section>
      <Disclosure
        title="Performance"
        description="Response times, availability and check volume"
      >
        <div className="page-stack">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard
              title="Response time"
              icon="activity"
              defaultChartType="line"
            >
              <ResponseTimeChart data={responseTimeData} height={160} />
            </ChartCard>
            <ChartCard
              title="Availability"
              icon="check-circle"
              defaultChartType="bar"
            >
              <UptimeChart data={uptimeData} height={160} />
            </ChartCard>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Error rate" icon="alert-triangle">
              <ErrorRateChart data={errorRateData} height={150} />
            </ChartCard>
            <ChartCard title="Latency percentiles" icon="trending-up">
              <LatencyPercentilesChart data={latencyData} height={150} />
            </ChartCard>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Check throughput" icon="zap">
              <ThroughputChart data={throughputData} height={150} />
            </ChartCard>
            <ChartCard
              title="Status distribution"
              icon="check-circle"
              showToggle={false}
            >
              <StatusDistributionChart data={distribution} height={150} />
            </ChartCard>
          </div>
          <p className="text-xs text-muted-foreground">
            {measurements.checkCount.toLocaleString()} measured checks in the
            selected period. Charts use the selected aggregation interval.
          </p>
        </div>
      </Disclosure>
      <section>
        <SectionHeading
          title="Recent incidents"
          actions={
            <Link
              href="/dashboards"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Browse dashboards
              <ArrowUpRight className="inline size-3.5" />
            </Link>
          }
        />
        <IncidentsTimeline limit={3} compactEmpty />
      </section>
      {process.env.SHOW_ABOUT === "true" && (
        <Disclosure
          title="About Pongo"
          description="Configuration and deployment"
        >
          <div className="space-y-3 pb-4 text-sm text-muted-foreground max-w-prose">
            <p>
              Create a status page with your coding agent. Paste:{" "}
              <code>https://pongo.sh Create a status page for Acme.</code>
            </p>
            <p>
              Your agent asks for service URLs, configures Pongo, and checks the
              running page. Read the{" "}
              <a href="/llms.txt" className="underline">
                agent instructions
              </a>{" "}
              or use the{" "}
              <a href="/skills/create-pongo/SKILL.md" className="underline">
                setup skill
              </a>
              .
            </p>
            <p>
              Define monitors, dashboards and alerts in TypeScript and incidents
              in Markdown. Commit configuration alongside your code.
            </p>
            <p>
              Deploy with SQLite or PostgreSQL. Run schedulers in multiple
              regions, deliver webhook alerts, and publish status pages with RSS
              and Atom feeds.
            </p>
            <a
              className="underline"
              href="https://github.com/TimMikeladze/pongo#readme"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the configuration guide
            </a>
          </div>
        </Disclosure>
      )}
    </div>
  );
}
