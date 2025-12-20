import {
  Activity,
  Bell,
  Code,
  Database,
  Github,
  Globe,
  Layout,
  Terminal,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { ChartCard } from "@/components/chart-card";
import { ErrorRateChart } from "@/components/error-rate-chart";
import { LatencyPercentilesChart } from "@/components/latency-percentiles-chart";
import { MonitorCard } from "@/components/monitor-card";
import { PublicDashboardsList } from "@/components/public-dashboards-list";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { StatsCard } from "@/components/stats-card";
import { StatusDistributionChart } from "@/components/status-distribution-chart";
import { ThroughputChart } from "@/components/throughput-chart";
import { UptimeChart } from "@/components/uptime-chart";
import { isAuthEnabled, isAuthenticated } from "@/lib/auth";
import {
  getAggregatedErrorRateChartData,
  getAggregatedLatencyPercentilesChartData,
  getAggregatedResponseTimeChartData,
  getAggregatedStatusDistributionData,
  getAggregatedThroughputChartData,
  getAggregatedUptimeChartData,
  getAverageResponseTime,
  getDashboards,
  getErrorRate,
  getLatestCheckResult,
  getMonitors,
  getP95ResponseTime,
  getP99ResponseTime,
  getTotalChecks,
  getUptimePercentage,
} from "@/lib/data";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Self-hosted, file-driven uptime monitoring designed for developers who prefer configuration as code. Define monitors in TypeScript, commit to git, and deploy anywhere.",
  keywords: [
    "uptime monitoring",
    "status page",
    "self-hosted",
    "open source",
    "uptime",
    "monitoring",
    "developer tools",
    "configuration as code",
    "TypeScript",
  ],
  openGraph: {
    title: "Pongo.sh - Self-hosted uptime monitoring",
    description:
      "File-driven uptime monitoring for developers. Define monitors in TypeScript, commit to git, and deploy anywhere.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pongo.sh - Self-hosted uptime monitoring",
    description:
      "File-driven uptime monitoring for developers. Define monitors in TypeScript, commit to git, and deploy anywhere.",
  },
  alternates: {
    canonical: "/",
  },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OverviewPage({ searchParams }: Props) {
  // When ACCESS_CODE is set and user is not authenticated, show public dashboards
  if (isAuthEnabled() && !(await isAuthenticated())) {
    const dashboards = await getDashboards();
    const publicDashboards = dashboards.filter((d) => d.isPublic);

    // If only one public dashboard, redirect directly to it
    if (publicDashboards.length === 1) {
      redirect(`/shared/${publicDashboards[0].slug}`);
    }

    // Show list of public dashboards
    return <PublicDashboardsList dashboards={publicDashboards} />;
  }

  // Structured data for SEO (SoftwareApplication schema)
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pongo",
    applicationCategory: "DeveloperApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: "Linux, macOS, Windows",
  };

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
      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe - JSON.stringify with static configuration data only
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />
      <AutoRefresh intervalSeconds={minRefreshInterval} />
      {/* About Section */}
      {showAbout && (
        <div className="mb-12 pt-6">
          {/* Header & Hero */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-start gap-4">
              <img
                src="/banner.png"
                alt="Pongo"
                width={64}
                height={64}
                className="rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl font-medium tracking-tight">
                    pongo.sh
                  </h1>
                  <a
                    href="https://github.com/TimMikeladze/pongo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-2 py-1 rounded-md"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>View on GitHub</span>
                  </a>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Self-hosted, file-driven uptime monitoring designed for
                  developers who prefer configuration as code. Define monitors
                  in TypeScript, commit to git, and deploy anywhere.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-medium uppercase tracking-wider">
                  Config as Code
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Define monitors, alerts, and pages as TypeScript files. Version
                control your monitoring alongside your code.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <h3 className="text-xs font-medium uppercase tracking-wider">
                  Multi-Region
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deploy instances across multiple regions for redundant
                monitoring. Supports custom consistency levels.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="h-4 w-4 text-green-500" />
                <h3 className="text-xs font-medium uppercase tracking-wider">
                  Status Pages
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Beautiful public and private status pages with historical
                uptime, incident timeline, and RSS feeds.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-medium uppercase tracking-wider">
                  Smart Alerting
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Get notified via Slack, Discord, Email, or Webhooks. Configure
                alert throttling and recovery thresholds.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-purple-500" />
                <h3 className="text-xs font-medium uppercase tracking-wider">
                  Self-Hosted
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No vendor lock-in. Runs on SQLite or PostgreSQL. Deploy to
                Vercel, Railway, Docker, or bare metal.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <h3 className="text-xs font-medium uppercase tracking-wider">
                  Performance
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Built with modern tech stack: Next.js 15, React 19, Bun, and
                Drizzle ORM for maximum efficiency.
              </p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />
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
