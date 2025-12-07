"use client";

import { useMemo, useEffect, useState } from "react";
import type { CheckResult } from "@/lib/types";
import { format } from "date-fns";
import { useTheme } from "@/components/theme-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LatencyHeatmapProps {
  results: CheckResult[];
  height?: number;
}

export function LatencyHeatmap({ results, height = 120 }: LatencyHeatmapProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const heatmapData = useMemo(() => {
    const hourlyData: {
      [key: string]: { avg: number; max: number; count: number };
    } = {};

    results.forEach((r) => {
      if (r.status === "down") return;
      const hour = format(new Date(r.checkedAt), "HH:00");
      if (!hourlyData[hour]) {
        hourlyData[hour] = { avg: 0, max: 0, count: 0 };
      }
      hourlyData[hour].count++;
      hourlyData[hour].avg += r.responseTimeMs;
      hourlyData[hour].max = Math.max(hourlyData[hour].max, r.responseTimeMs);
    });

    return Object.entries(hourlyData)
      .map(([hour, data]) => ({
        hour,
        avg: Math.round(data.avg / data.count),
        max: data.max,
        count: data.count,
      }))
      .slice(-24);
  }, [results]);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const getHeatColor = (avg: number) => {
    if (avg < 100) return isDark ? "#4ade8040" : "#16a34a40";
    if (avg < 200) return isDark ? "#4ade80" : "#16a34a";
    if (avg < 300) return isDark ? "#facc1540" : "#ca8a0440";
    if (avg < 500) return isDark ? "#facc15" : "#ca8a04";
    return isDark ? "#ef4444" : "#dc2626";
  };

  if (heatmapData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        no data available
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2" style={{ height }}>
        <div className="flex gap-1 flex-wrap">
          {heatmapData.map((d, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className="w-6 h-6 rounded cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: getHeatColor(d.avg) }}
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-background border border-border text-foreground font-mono text-[10px] p-2"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">{d.hour}</span>
                  <span>avg: {d.avg}ms</span>
                  <span>max: {d.max}ms</span>
                  <span>checks: {d.count}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: isDark ? "#4ade80" : "#16a34a" }}
            />
            <span>{"<200ms"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: isDark ? "#facc15" : "#ca8a04" }}
            />
            <span>200-500ms</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: isDark ? "#ef4444" : "#dc2626" }}
            />
            <span>{">500ms"}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
