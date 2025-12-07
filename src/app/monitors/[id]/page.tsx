// src/app/monitors/[id]/page.tsx

import { formatDistanceToNow } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { StatsCard } from "@/components/stats-card";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { UptimeBars } from "@/components/uptime-bars";
import { Button } from "@/components/ui/button";
import {
  getCheckResults,
  getLatestCheckResult,
  getMonitor,
  getMonitorStats,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { TriggerButton } from "@/components/trigger-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MonitorDetailPage({ params }: Props) {
  const { id } = await params;
  const monitor = await getMonitor(id);

  if (!monitor) {
    notFound();
  }

  const [latestResult, results, stats24h, stats7d] = await Promise.all([
    getLatestCheckResult(id),
    getCheckResults(id, 50),
    getMonitorStats(id, 24),
    getMonitorStats(id, 168),
  ]);

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
        <TriggerButton monitorId={id} />
      </div>

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="uptime 24h"
            value={`${stats24h.uptime}%`}
            trend={
              stats24h.uptime >= 99.9
                ? "up"
                : stats24h.uptime >= 99
                  ? "neutral"
                  : "down"
            }
          />
          <StatsCard
            title="uptime 7d"
            value={`${stats7d.uptime}%`}
            trend={
              stats7d.uptime >= 99.9
                ? "up"
                : stats7d.uptime >= 99
                  ? "neutral"
                  : "down"
            }
          />
          <StatsCard
            title="avg latency"
            value={`${stats24h.avgResponseTime}ms`}
            description="24h"
          />
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

        {/* 90-day uptime bars */}
        <div className="border border-border rounded bg-card p-4">
          <UptimeBars
            monitorId={id}
            monitorName={monitor.name}
            days={90}
            showLabels={true}
          />
        </div>

        {/* Response time chart */}
        <div className="border border-border rounded bg-card p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
            response time
          </h3>
          <ResponseTimeChart results={results} height={160} />
        </div>

        {/* Recent status timeline */}
        <div className="border border-border rounded bg-card p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
            recent checks
          </h3>
          <StatusTimeline results={results} limit={50} />
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
