"use client";

import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { BarChart3, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { DualTime } from "@/components/dual-time";
import { useTheme } from "@/components/theme-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StatusBucket } from "@/lib/data";
import { groupStatusHistory } from "@/lib/status-history";
import type { MonitorStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type DisplayMode = "bars" | "sparkline";

interface UptimeDisplayProps {
  monitorName: string;
  statusBuckets: StatusBucket[];
  showLabels?: boolean;
  currentStatus?: MonitorStatus;
  paused?: boolean;
  uptime?: number | null;
  responseTime?: number | null;
}

const statusColors: Record<MonitorStatus | "pending", string> = {
  up: "bg-status-up",
  down: "bg-status-down",
  degraded: "bg-status-degraded",
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
  currentStatus = "pending",
  paused = false,
  uptime = null,
  responseTime = null,
}: UptimeDisplayProps) {
  const gradientId = useId();
  const historyId = useId();
  const history = useMemo(
    () => groupStatusHistory(statusBuckets),
    [statusBuckets],
  );
  const [mode, setMode] = useState<DisplayMode>("bars");
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const selectedIndex = Math.max(
    0,
    Math.min(focusIndex ?? history.length - 1, history.length - 1),
  );
  const selectedBucket = history[selectedIndex];

  useEffect(() => {
    setFocusIndex((index) =>
      index === null ? null : Math.max(0, Math.min(index, history.length - 1)),
    );
  }, [history.length]);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const startTs = statusBuckets[0]?.timestamp;
  const endTs = statusBuckets[statusBuckets.length - 1]?.timestamp;
  const startLabel = startTs
    ? formatInTimeZone(new Date(startTs), "UTC", "MMM d, HH:mm")
    : "";
  const endLabel = endTs
    ? `${formatInTimeZone(new Date(endTs), "UTC", "MMM d, HH:mm")} UTC`
    : "Now";

  const colors = useMemo(() => {
    return {
      up: isDark ? "#4ade80" : "#16a34a",
      grid: isDark ? "#1a1a1a" : "#e5e5e5",
      text: isDark ? "#a3a3a3" : "#666",
    };
  }, [isDark]);

  const sparklineData = useMemo(() => {
    return statusBuckets.map((bucket) => ({
      time: bucket.label,
      _ts: bucket.timestamp,
      uptime: bucket.status === "pending" ? null : bucket.uptime,
      checks: bucket.checks,
    }));
  }, [statusBuckets]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="py-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">{monitorName}</span>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="font-mono text-xs tabular-nums"
              title="Availability"
            >
              {uptime === null ? "—" : `${uptime.toFixed(2)}%`}
            </span>
            <span
              className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:inline"
              title="Average response"
            >
              {responseTime === null ? "—" : `${responseTime} ms`}
            </span>
            <div className="flex items-center gap-0.5 bg-secondary/50 rounded p-0.5">
              <button
                type="button"
                onClick={() => setMode("bars")}
                className={cn(
                  "min-h-8 min-w-8 rounded transition-colors",
                  mode === "bars"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={`Availability bars for ${monitorName}`}
                aria-pressed={mode === "bars"}
              >
                <BarChart3 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setMode("sparkline")}
                className={cn(
                  "min-h-8 min-w-8 rounded transition-colors",
                  mode === "sparkline"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={`Availability sparkline for ${monitorName}`}
                aria-pressed={mode === "sparkline"}
              >
                <TrendingUp className="h-3 w-3" />
              </button>
            </div>
            <span className="status-pill text-xs" data-status={currentStatus}>
              {paused ? "Paused" : statusLabels[currentStatus]}
            </span>
          </div>
        </div>

        {mode === "bars" ? (
          <fieldset
            className="flex gap-[2px] min-w-0"
            aria-label={`Availability history for ${monitorName}`}
          >
            {history.map((bucket, index) => (
              <Tooltip key={bucket.timestamp}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    tabIndex={index === selectedIndex ? 0 : -1}
                    onFocus={() => setFocusIndex(index)}
                    onKeyDown={(event) => {
                      if (
                        !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                          event.key,
                        )
                      )
                        return;
                      event.preventDefault();
                      const next =
                        event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? history.length - 1
                            : Math.max(
                                0,
                                Math.min(
                                  history.length - 1,
                                  index + (event.key === "ArrowLeft" ? -1 : 1),
                                ),
                              );
                      const buttons = event.currentTarget
                        .closest("fieldset")
                        ?.querySelectorAll("button");
                      buttons?.[next]?.focus();
                    }}
                    aria-label={`${monitorName}, ${bucket.label}: ${bucket.checks === 0 ? "No data" : `${bucket.uptime}% availability, ${bucket.checks} checks`}`}
                    className={cn(
                      "min-w-0 flex-1 h-6 rounded-[2px] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2",
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
                    <DualTime
                      date={bucket.timestamp}
                      formatStr="MMM d, h:mm a"
                      className="text-foreground block"
                    />
                    {bucket.periods > 1 && (
                      <p className="text-muted-foreground">
                        Through{" "}
                        {formatInTimeZone(
                          new Date(bucket.endTimestamp),
                          "UTC",
                          "MMM d, HH:mm",
                        )}{" "}
                        UTC · {bucket.periods} intervals
                      </p>
                    )}
                    {bucket.missingPeriods > 0 && (
                      <p className="text-muted-foreground">
                        {bucket.missingPeriods} intervals without measurements
                      </p>
                    )}
                    <p
                      className={cn(
                        bucket.status === "up" &&
                          "text-green-700 dark:text-green-400",
                        bucket.status === "down" &&
                          "text-red-700 dark:text-red-400",
                        bucket.status === "degraded" &&
                          "text-yellow-700 dark:text-yellow-400",
                        bucket.status === "pending" && "text-muted-foreground",
                      )}
                    >
                      {bucket.checks === 0
                        ? "No data"
                        : `${bucket.uptime}% availability`}
                    </p>
                    <p className="text-muted-foreground">
                      {bucket.checks} checks
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </fieldset>
        ) : (
          <div className="h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparklineData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                  // biome-ignore lint/suspicious/noExplicitAny: recharts type issue
                  formatter={(value: any) => [
                    value !== null ? `${value}%` : "No data",
                    "uptime",
                  ]}
                  labelFormatter={(_label, payload) => {
                    const ts = payload?.[0]?.payload?._ts;
                    if (!ts) return _label;
                    const d = new Date(ts);
                    return `UTC ${formatInTimeZone(d, "UTC", "MMM d, HH:mm")}\nLocal ${format(d, "MMM d, HH:mm")}`;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="uptime"
                  stroke={colors.up}
                  strokeWidth={1.5}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {(showLabels || selectedBucket) && (
          <div
            className={cn(
              "mt-2 flex items-center justify-between gap-2",
              !showLabels && "justify-center sm:hidden",
            )}
          >
            {showLabels && (
              <span className="min-w-0 text-xs text-muted-foreground font-mono">
                {startLabel}
              </span>
            )}
            {selectedBucket && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="min-h-11 shrink-0 rounded px-2 text-xs text-muted-foreground hover:text-foreground sm:hidden"
                    aria-label={`Inspect history for ${monitorName}`}
                  >
                    Inspect history
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  aria-label={`${monitorName} history inspection`}
                  align="center"
                  collisionPadding={16}
                  className="w-[min(22rem,calc(100vw-32px))] max-h-[min(80dvh,var(--radix-popover-content-available-height))] overflow-y-auto p-4 sm:hidden"
                >
                  <h3 className="text-sm font-semibold">
                    {monitorName} history
                  </h3>
                  <div className="mt-3 space-y-3 text-xs">
                    <div>
                      <p className="mb-1 text-muted-foreground">
                        First interval
                      </p>
                      <DualTime
                        date={selectedBucket.timestamp}
                        formatStr="MMM d, yyyy HH:mm:ss"
                        className="block font-mono"
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-muted-foreground">
                        Last interval
                      </p>
                      <DualTime
                        date={selectedBucket.endTimestamp}
                        formatStr="MMM d, yyyy HH:mm:ss"
                        className="block font-mono"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="status-pill"
                        data-status={selectedBucket.status}
                      >
                        {statusLabels[selectedBucket.status]}
                      </span>
                      <span className="font-mono">
                        {selectedBucket.checks === 0
                          ? "No availability data"
                          : `${selectedBucket.uptime.toFixed(2)}% availability`}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {selectedBucket.checks} checks · {selectedBucket.periods}{" "}
                      {selectedBucket.periods === 1 ? "interval" : "intervals"}
                      <br />
                      {selectedBucket.missingPeriods} intervals without
                      measurements
                    </p>
                    <p className="text-muted-foreground">
                      Grouped periods show the worst recorded state. The
                      sparkline shows every interval.
                    </p>
                  </div>
                  <div className="mt-3">
                    <label
                      htmlFor={historyId}
                      className="text-xs text-muted-foreground"
                    >
                      Period {selectedIndex + 1} of {history.length}
                    </label>
                    <input
                      id={historyId}
                      type="range"
                      min={0}
                      max={Math.max(0, history.length - 1)}
                      value={selectedIndex}
                      disabled={history.length < 2}
                      onChange={(event) =>
                        setFocusIndex(Number(event.currentTarget.value))
                      }
                      aria-label={`${monitorName} history period`}
                      aria-valuetext={`Period ${selectedIndex + 1} of ${history.length}: ${selectedBucket.label}`}
                      className="min-h-11 w-full accent-[var(--status-up)]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="control-button min-h-11 min-w-11 disabled:opacity-50"
                      disabled={selectedIndex === 0}
                      onClick={() => setFocusIndex(selectedIndex - 1)}
                      aria-label={`Previous period for ${monitorName}`}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      className="control-button min-h-11 min-w-11 disabled:opacity-50"
                      disabled={selectedIndex === history.length - 1}
                      onClick={() => setFocusIndex(selectedIndex + 1)}
                      aria-label={`Next period for ${monitorName}`}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {showLabels && (
              <span className="min-w-0 text-right text-xs text-muted-foreground font-mono">
                {endLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
