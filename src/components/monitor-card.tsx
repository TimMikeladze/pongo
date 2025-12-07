import Link from "next/link";
import { subDays } from "date-fns";
import { ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Sparkline } from "@/components/sparkline";
import {
  getLatestCheckResult,
  getCheckResults,
  getMonitorStats,
  type TimeRange,
} from "@/lib/data";
import type { Monitor } from "@/lib/types";
import type { CheckResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MonitorCardProps {
  monitor: Monitor;
  timeRange: TimeRange;
}

// Aggregate check results into hourly buckets
function aggregateByHour(results: CheckResult[], hours: number): CheckResult[] {
  if (results.length === 0) return [];

  const now = Date.now();
  const buckets: Map<number, CheckResult[]> = new Map();

  // Create hourly buckets
  for (let i = 0; i < hours; i++) {
    buckets.set(i, []);
  }

  // Assign results to buckets
  for (const result of results) {
    const resultTime = new Date(result.checkedAt).getTime();
    const hoursAgo = Math.floor((now - resultTime) / (60 * 60 * 1000));
    if (hoursAgo >= 0 && hoursAgo < hours) {
      buckets.get(hoursAgo)?.push(result);
    }
  }

  // Aggregate each bucket into a single representative result
  const aggregated: CheckResult[] = [];
  for (let i = hours - 1; i >= 0; i--) {
    const bucket = buckets.get(i) || [];
    if (bucket.length === 0) continue;

    // Use average response time, worst status
    const avgResponseTime = Math.round(
      bucket.reduce((sum, r) => sum + r.responseTimeMs, 0) / bucket.length,
    );
    const hasDown = bucket.some((r) => r.status === "down");
    const hasDegraded = bucket.some((r) => r.status === "degraded");
    const status = hasDown ? "down" : hasDegraded ? "degraded" : "up";

    aggregated.push({
      id: `agg-${i}`,
      monitorId: bucket[0].monitorId,
      status,
      responseTimeMs: avgResponseTime,
      statusCode: bucket[0].statusCode,
      errorMessage: null,
      checkedAt: new Date(now - i * 60 * 60 * 1000).toISOString(),
    });
  }

  return aggregated;
}

export async function MonitorCard({ monitor, timeRange }: MonitorCardProps) {
  // Fixed 3-day range for sparkline
  const sparklineRange: TimeRange = {
    from: subDays(new Date(), 3),
    to: new Date(),
  };

  const [latestResult, sparklineResults, stats] = await Promise.all([
    getLatestCheckResult(monitor.id),
    getCheckResults(monitor.id, { timeRange: sparklineRange }),
    getMonitorStats(monitor.id, timeRange),
  ]);

  // Aggregate to hourly intervals (72 hours = 3 days)
  const aggregatedResults = aggregateByHour(sparklineResults, 72);

  const status = latestResult?.status ?? "pending";

  return (
    <div className="group border border-border rounded bg-card hover:border-primary/30 transition-colors p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="mt-1">
            <StatusBadge
              status={monitor.isActive ? status : "pending"}
              size="lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/monitors/${monitor.id}`}
              className="text-sm hover:text-primary transition-colors"
            >
              {monitor.name}
            </Link>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {monitor.id}.ts
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 hidden sm:block w-24">
          <Sparkline results={aggregatedResults} height={32} />
        </div>

        <Link
          href={`/monitors/${monitor.id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-6 w-6 flex items-center justify-center hover:bg-accent rounded"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 border-t border-border/50 text-[10px] mt-4 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">uptime</span>
          <span
            className={cn(
              "font-mono",
              stats.uptime >= 99.9
                ? "text-status-up"
                : stats.uptime >= 99
                  ? "text-foreground"
                  : "text-status-down",
            )}
          >
            {stats.uptime}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">latency</span>
          <span className="font-mono">{stats.avgResponseTime}ms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">interval</span>
          <span className="font-mono">{monitor.intervalSeconds}s</span>
        </div>
        {!monitor.isActive && (
          <span className="px-1 py-0.5 rounded bg-secondary text-muted-foreground text-[10px]">
            paused
          </span>
        )}
      </div>
    </div>
  );
}
