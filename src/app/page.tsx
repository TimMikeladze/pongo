import Link from "next/link";
import {
  Terminal,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  TrendingUp,
  PawPrint,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonitorCard } from "@/components/monitor-card";
import { StatsCard } from "@/components/stats-card";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { UptimeChart } from "@/components/uptime-chart";
import { ErrorRateChart } from "@/components/error-rate-chart";
import { LatencyPercentilesChart } from "@/components/latency-percentiles-chart";
import { StatusDistributionChart } from "@/components/status-distribution-chart";
import { LatencyHeatmap } from "@/components/latency-heatmap";
import { ThroughputChart } from "@/components/throughput-chart";
import { cn } from "@/lib/utils";
import {
  getMonitors,
  getCheckResults,
  getLatestCheckResult,
  getUptimePercentage,
  getAverageResponseTime,
  getErrorRate,
  getP95ResponseTime,
  getP99ResponseTime,
  getTotalChecks,
} from "@/lib/data";

export default async function OverviewPage() {
  const monitors = await getMonitors();
  const activeMonitors = monitors.filter((m) => m.isActive);

  // Calculate overall stats
  const [
    overallUptime,
    avgResponseTime,
    errorRate,
    p95Latency,
    p99Latency,
    totalChecks,
  ] =
    monitors.length > 0
      ? await Promise.all([
          (async () => {
            const uptimes = await Promise.all(
              monitors.map((m) => getUptimePercentage(m.id, 24)),
            );
            return uptimes.reduce((acc, v) => acc + v, 0) / uptimes.length;
          })(),
          (async () => {
            const responseTimes = await Promise.all(
              monitors.map((m) => getAverageResponseTime(m.id, 24)),
            );
            return Math.round(
              responseTimes.reduce((acc, v) => acc + v, 0) /
                responseTimes.length,
            );
          })(),
          (async () => {
            const errorRates = await Promise.all(
              monitors.map((m) => getErrorRate(m.id, 24)),
            );
            return (
              errorRates.reduce((acc, v) => acc + v, 0) / errorRates.length
            );
          })(),
          (async () => {
            const p95s = await Promise.all(
              monitors.map((m) => getP95ResponseTime(m.id, 24)),
            );
            return Math.round(
              p95s.reduce((acc, v) => acc + v, 0) / p95s.length,
            );
          })(),
          (async () => {
            const p99s = await Promise.all(
              monitors.map((m) => getP99ResponseTime(m.id, 24)),
            );
            return Math.round(
              p99s.reduce((acc, v) => acc + v, 0) / p99s.length,
            );
          })(),
          (async () => {
            const checks = await Promise.all(
              monitors.map((m) => getTotalChecks(m.id, 24)),
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

  // Get all check results for charts
  const allResultsArrays = await Promise.all(
    monitors.map((m) => getCheckResults(m.id, 100)),
  );
  const allResults = allResultsArrays.flat();

  return (
    <div>
      {/* About Section */}
      <div className="mb-10 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-primary" />
            <div>
              <h1 className="text-sm">pongo</h1>
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
            pongo is an open source uptime monitoring solution designed for
            developers who prefer configuration as code. define your monitors as
            simple typescript files, commit them to your repository, and deploy
            anywhere that runs node. no complex setup wizards, no vendor lock-in
            — just code.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            track response times, uptime percentages, error rates, and latency
            percentiles with real-time dashboards. create beautiful public
            status pages to keep your users informed about service health.
            configure alerts to get notified instantly via email, slack, or
            webhooks when services degrade or go down.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            no database required — pongo reads monitor definitions directly from
            your filesystem. results are stored locally in sqlite, making it
            lightweight, portable, and easy to backup. deploy on vercel,
            railway, docker, or any platform that supports node.js.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            built with next.js, typescript, and tailwind css. fully customizable
            and extensible. check out the live demo below to see pongo in
            action.
          </p>
        </div>
      </div>

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
        <p className="text-[10px] text-muted-foreground">
          defined in{" "}
          <code className="bg-secondary px-1 rounded">data/monitors/</code>
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-6">
        <StatsCard
          title="uptime"
          value={`${overallUptime.toFixed(1)}%`}
          description="24h average"
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
        <StatsCard
          title="avg latency"
          value={`${avgResponseTime}ms`}
          description="response time"
        />
        <StatsCard
          title="p95"
          value={`${p95Latency}ms`}
          description="95th percentile"
        />
        <StatsCard
          title="errors"
          value={`${errorRate.toFixed(1)}%`}
          description="failures"
          trend={errorRate === 0 ? "up" : errorRate < 1 ? "neutral" : "down"}
        />
        <StatsCard title="checks" value={totalChecks} description="24h" />
        <StatsCard
          title="incidents"
          value={downCount}
          description="down"
          trend={downCount === 0 ? "up" : "down"}
        />
      </div>

      {/* Primary Charts Row */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Activity className="h-3 w-3 text-primary" />
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
              response time
            </h3>
          </div>
          <ResponseTimeChart results={allResults} height={140} />
        </div>
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle className="h-3 w-3 text-status-up" />
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
              hourly uptime
            </h3>
          </div>
          <UptimeChart results={allResults} height={140} />
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="h-3 w-3 text-status-down" />
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
              error rate
            </h3>
          </div>
          <ErrorRateChart results={allResults} height={120} />
        </div>
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="h-3 w-3 text-status-degraded" />
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
              latency percentiles
            </h3>
          </div>
          <LatencyPercentilesChart results={allResults} height={120} />
        </div>
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="h-3 w-3 text-purple-500" />
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
              throughput
            </h3>
          </div>
          <ThroughputChart results={allResults} height={120} />
        </div>
      </div>

      {/* Tertiary Charts Row */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
              latency heatmap
            </h3>
          </div>
          <LatencyHeatmap results={allResults} height={100} />
        </div>
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
              status distribution
            </h3>
          </div>
          <StatusDistributionChart results={allResults} height={100} />
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
            <p className="text-[10px] text-muted-foreground/70 mb-4">
              add .ts files to{" "}
              <code className="bg-secondary px-1 rounded">data/monitors/</code>
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {monitors.slice(0, 5).map((monitor) => (
              <MonitorCard key={monitor.id} monitor={monitor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
