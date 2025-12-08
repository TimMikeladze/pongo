import { Activity, Github, Terminal } from "lucide-react";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { ChartCard } from "@/components/chart-card";
import { ErrorRateChart } from "@/components/error-rate-chart";
import { LatencyPercentilesChart } from "@/components/latency-percentiles-chart";
import { MonitorCard } from "@/components/monitor-card";
import { PongoLogo } from "@/components/pongo-logo";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { StatsCard } from "@/components/stats-card";
import { StatusDistributionChart } from "@/components/status-distribution-chart";
import { ThroughputChart } from "@/components/throughput-chart";
import { UptimeChart } from "@/components/uptime-chart";
import {
  getAggregatedErrorRateChartData,
  getAggregatedLatencyPercentilesChartData,
  getAggregatedResponseTimeChartData,
  getAggregatedStatusDistributionData,
  getAggregatedThroughputChartData,
  getAggregatedUptimeChartData,
  getAverageResponseTime,
  getErrorRate,
  getLatestCheckResult,
  getMonitors,
  getP95ResponseTime,
  getP99ResponseTime,
  getTotalChecks,
  getUptimePercentage,
} from "@/lib/data";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OverviewPage({ searchParams }: Props) {
  const showAbout = process.env.SHOW_ABOUT === "true";
  const monitors = await getMonitors();
  const activeMonitors = monitors.filter((m) => m.isActive);
  const monitorIds = monitors.map((m) => m.id);

  const { preset, from, to, interval } =
    await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });

  // Calculate overall stats
  const [
    overallUptime,
    avgResponseTime,
    errorRate,
    p95Latency,
    _p99Latency,
    totalChecks,
  ] =
    monitors.length > 0
      ? await Promise.all([
          (async () => {
            const uptimes = await Promise.all(
              monitors.map((m) => getUptimePercentage(m.id, timeRange)),
            );
            return uptimes.reduce((acc, v) => acc + v, 0) / uptimes.length;
          })(),
          (async () => {
            const responseTimes = await Promise.all(
              monitors.map((m) => getAverageResponseTime(m.id, timeRange)),
            );
            return Math.round(
              responseTimes.reduce((acc, v) => acc + v, 0) /
                responseTimes.length,
            );
          })(),
          (async () => {
            const errorRates = await Promise.all(
              monitors.map((m) => getErrorRate(m.id, timeRange)),
            );
            return (
              errorRates.reduce((acc, v) => acc + v, 0) / errorRates.length
            );
          })(),
          (async () => {
            const p95s = await Promise.all(
              monitors.map((m) => getP95ResponseTime(m.id, timeRange)),
            );
            return Math.round(
              p95s.reduce((acc, v) => acc + v, 0) / p95s.length,
            );
          })(),
          (async () => {
            const p99s = await Promise.all(
              monitors.map((m) => getP99ResponseTime(m.id, timeRange)),
            );
            return Math.round(
              p99s.reduce((acc, v) => acc + v, 0) / p99s.length,
            );
          })(),
          (async () => {
            const checks = await Promise.all(
              monitors.map((m) => getTotalChecks(m.id, timeRange)),
            );
            return checks.reduce((acc, v) => acc + v, 0);
          })(),
        ])
      : [100, 0, 0, 0, 0, 0];

  // Get down count
  const latestResults = await Promise.all(
    monitors.map((m) => getLatestCheckResult(m.id)),
  );
  const downCount = latestResults.filter((r) => r?.status === "down").length;

  // Calculate minimum refresh interval
  const minRefreshInterval =
    monitors.length > 0
      ? Math.min(...monitors.map((m) => m.intervalSeconds))
      : 0;

  // Get aggregated chart data server-side
  const [
    responseTimeData,
    uptimeData,
    errorRateData,
    latencyPercentilesData,
    throughputData,
    statusDistributionData,
  ] =
    monitors.length > 0
      ? await Promise.all([
          getAggregatedResponseTimeChartData(monitorIds, timeRange, interval),
          getAggregatedUptimeChartData(monitorIds, timeRange, interval),
          getAggregatedErrorRateChartData(monitorIds, timeRange, interval),
          getAggregatedLatencyPercentilesChartData(
            monitorIds,
            timeRange,
            interval,
          ),
          getAggregatedThroughputChartData(monitorIds, timeRange, interval),
          getAggregatedStatusDistributionData(monitorIds, timeRange),
        ])
      : [[], [], [], [], [], { up: 0, degraded: 0, down: 0 }];

  return (
    <div>
      <AutoRefresh intervalSeconds={minRefreshInterval} />
      {/* About Section */}
      {showAbout && (
        <div className="mb-10 pt-4">
          <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <PongoLogo className="h-4 w-4" />
              <div>
                <h1 className="text-sm">pongo.sh</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  self-hosted, file-driven uptime monitoring
                </p>
              </div>
            </div>
            <a
              href="https://github.com/TimMikeladze/pongo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-3 w-3" />
              github.com/TimMikeladze/pongo
            </a>
          </div>
          <div className="border border-border rounded bg-card p-4">
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              pongo.sh is an open source uptime monitoring solution designed for
              developers who prefer configuration as code. define your monitors
              as simple typescript files, commit them to your repository, and
              deploy anywhere that runs node. no complex setup wizards, no
              vendor lock-in — just code.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              track response times, uptime percentages, error rates, and latency
              percentiles with real-time dashboards. create beautiful public
              status pages to keep your users informed about service health.
              configure alerts to get notified instantly via email, slack, or
              webhooks when services degrade or go down.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              no database required — pongo.sh reads monitor definitions directly
              from your filesystem. results are stored locally in sqlite, making
              it lightweight, portable, and easy to backup. deploy on vercel,
              railway, docker, or any platform that supports node.js.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              built with next.js, typescript, and tailwind css. fully
              customizable and extensible. check out the live demo below to see
              pongo.sh in action.
            </p>
          </div>
        </div>
      )}

      {/* System Overview Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm">system overview</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              monitoring {monitors.length} endpoints
            </p>
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
        <StatsCard
          title="uptime"
          value={`${overallUptime.toFixed(1)}%`}
          trend={
            overallUptime >= 99.9
              ? "up"
              : overallUptime >= 99
                ? "neutral"
                : "down"
          }
        />
        <StatsCard
          title="monitors"
          value={activeMonitors.length}
          description={`${monitors.length} total`}
        />
        <StatsCard title="avg latency" value={`${avgResponseTime}ms`} />
        <StatsCard title="p95" value={`${p95Latency}ms`} />
        <StatsCard
          title="errors"
          value={`${errorRate.toFixed(1)}%`}
          trend={errorRate === 0 ? "up" : errorRate < 1 ? "neutral" : "down"}
        />
        <StatsCard title="checks" value={totalChecks} />
        <StatsCard
          title="incidents"
          value={downCount}
          description="down"
          trend={downCount === 0 ? "up" : "down"}
        />
      </div>

      {/* Primary Charts Row */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ChartCard
          title="response time"
          icon="activity"
          iconClassName="text-primary"
          defaultChartType="line"
        >
          <ResponseTimeChart data={responseTimeData} height={140} />
        </ChartCard>
        <ChartCard
          title="hourly uptime"
          icon="check-circle"
          iconClassName="text-status-up"
          defaultChartType="bar"
        >
          <UptimeChart data={uptimeData} height={140} />
        </ChartCard>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <ChartCard
          title="error rate"
          icon="alert-triangle"
          iconClassName="text-status-down"
          defaultChartType="bar"
        >
          <ErrorRateChart data={errorRateData} height={120} />
        </ChartCard>
        <ChartCard
          title="latency percentiles"
          icon="trending-up"
          iconClassName="text-status-degraded"
          defaultChartType="line"
        >
          <LatencyPercentilesChart data={latencyPercentilesData} height={120} />
        </ChartCard>
        <ChartCard
          title="throughput"
          icon="zap"
          iconClassName="text-purple-500"
          defaultChartType="line"
        >
          <ThroughputChart data={throughputData} height={120} />
        </ChartCard>
      </div>

      {/* Status Distribution */}
      <div className="mb-8">
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
              status distribution
            </h3>
          </div>
          <StatusDistributionChart data={statusDistributionData} height={100} />
        </div>
      </div>

      {/* Monitors List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wider">
            monitors
          </h2>
          <Link
            href="/monitors"
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            view all →
          </Link>
        </div>

        {monitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded">
            <Terminal className="h-6 w-6 text-muted-foreground mb-3" />
            <p className="text-xs text-muted-foreground mb-4">
              no monitors configured
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {monitors.slice(0, 5).map((monitor) => (
              <MonitorCard
                key={monitor.id}
                monitor={monitor}
                timeRange={timeRange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
