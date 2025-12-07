import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Sparkline } from "@/components/sparkline";
import {
  getLatestCheckResult,
  getCheckResults,
  getMonitorStats,
} from "@/lib/data";
import type { Monitor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MonitorCardProps {
  monitor: Monitor;
}

export async function MonitorCard({ monitor }: MonitorCardProps) {
  const [latestResult, results, stats] = await Promise.all([
    getLatestCheckResult(monitor.id),
    getCheckResults(monitor.id, 30),
    getMonitorStats(monitor.id, 24),
  ]);

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
              {monitor.id}.js
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 hidden sm:block w-24">
          <Sparkline results={results} height={32} />
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
