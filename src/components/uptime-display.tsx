"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { useTheme } from "@/components/theme-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StatusBucket } from "@/lib/data";
import type { MonitorStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type DisplayMode = "bars" | "sparkline";

interface UptimeDisplayProps {
  monitorName: string;
  statusBuckets: StatusBucket[];
  showLabels?: boolean;
}

const statusColors: Record<MonitorStatus | "pending", string> = {
  up: "bg-blue-500",
  down: "bg-red-500",
  degraded: "bg-amber-500",
  pending: "bg-muted-foreground/20",
};

const statusLabels: Record<MonitorStatus | "pending", string> = {
  up: "Operational",
  down: "Outage",
  degraded: "Degraded",
  pending: "No data",
};

export function UptimeDisplay({
  monitorName,
  statusBuckets,
  showLabels = true,
}: UptimeDisplayProps) {
  const [mode, setMode] = useState<DisplayMode>("bars");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  // Get current status (last bucket with data, or last bucket)
  const currentStatus = useMemo(() => {
    for (let i = statusBuckets.length - 1; i >= 0; i--) {
      if (statusBuckets[i].status !== "pending") {
        return statusBuckets[i].status;
      }
    }
    return statusBuckets[statusBuckets.length - 1]?.status ?? "pending";
  }, [statusBuckets]);

  // Calculate time range label
  const startLabel = statusBuckets[0]?.label ?? "";
  const endLabel = statusBuckets[statusBuckets.length - 1]?.label ?? "Now";

  const colors = useMemo(() => {
    return {
      up: isDark ? "#3b82f6" : "#2563eb",
      grid: isDark ? "#1a1a1a" : "#e5e5e5",
      text: isDark ? "#666" : "#999",
    };
  }, [isDark]);

  // Prepare data for sparkline
  const sparklineData = useMemo(() => {
    return statusBuckets.map((bucket) => ({
      time: bucket.label,
      uptime: bucket.status === "pending" ? null : bucket.uptime,
      checks: bucket.checks,
    }));
  }, [statusBuckets]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="py-4 border-b border-border last:border-b-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium font-mono">{monitorName}</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-secondary/50 rounded p-0.5">
              <button
                type="button"
                onClick={() => setMode("bars")}
                className={cn(
                  "p-1 rounded transition-colors",
                  mode === "bars"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Bar view"
              >
                <BarChart3 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setMode("sparkline")}
                className={cn(
                  "p-1 rounded transition-colors",
                  mode === "sparkline"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Sparkline view"
              >
                <TrendingUp className="h-3 w-3" />
              </button>
            </div>
            <span
              className={cn(
                "text-xs font-mono",
                currentStatus === "up" && "text-blue-500",
                currentStatus === "down" && "text-red-500",
                currentStatus === "degraded" && "text-amber-500",
                currentStatus === "pending" && "text-muted-foreground",
              )}
            >
              {statusLabels[currentStatus]}
            </span>
          </div>
        </div>

        {mode === "bars" ? (
          <div className="flex gap-[2px]">
            {statusBuckets.map((bucket) => (
              <Tooltip key={bucket.timestamp}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex-1 h-8 rounded-[2px] transition-all hover:opacity-80 cursor-default",
                      statusColors[bucket.status],
                      bucket.status === "up" && "opacity-90",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-card border-border text-xs font-mono"
                >
                  <div className="space-y-1">
                    <p className="text-foreground">{bucket.label}</p>
                    <p
                      className={cn(
                        bucket.status === "up" && "text-blue-500",
                        bucket.status === "down" && "text-red-500",
                        bucket.status === "degraded" && "text-amber-500",
                        bucket.status === "pending" && "text-muted-foreground",
                      )}
                    >
                      {bucket.uptime}% uptime
                    </p>
                    <p className="text-muted-foreground">
                      {bucket.checks} checks
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ) : (
          <div className="h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparklineData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="uptimeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={colors.up} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={colors.up} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
                    border: `1px solid ${colors.grid}`,
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontFamily: "monospace",
                  }}
                  // biome-ignore lint/suspicious/noExplicitAny: recharts type issue
                  formatter={(value: any) => [
                    value !== null ? `${value}%` : "No data",
                    "uptime",
                  ]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="uptime"
                  stroke={colors.up}
                  strokeWidth={1.5}
                  fill="url(#uptimeGradient)"
                  dot={false}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {showLabels && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              {startLabel}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {endLabel}
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
