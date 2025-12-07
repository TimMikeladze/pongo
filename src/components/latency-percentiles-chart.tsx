"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { CheckResult } from "@/lib/types";
import { format } from "date-fns";
import { useTheme } from "@/components/theme-provider";

interface LatencyPercentilesChartProps {
  results: CheckResult[];
  height?: number;
}

export function LatencyPercentilesChart({
  results,
  height = 120,
}: LatencyPercentilesChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    const hourlyData: { [key: string]: number[] } = {};

    results.forEach((r) => {
      if (r.status === "down") return;
      const hour = format(new Date(r.checkedAt), "HH:00");
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(r.responseTimeMs);
    });

    return Object.entries(hourlyData)
      .map(([hour, times]) => {
        const sorted = times.sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
        const p99 =
          sorted[Math.floor(sorted.length * 0.99)] ||
          sorted[sorted.length - 1] ||
          0;
        return { hour, p50, p95, p99 };
      })
      .slice(-24);
  }, [results]);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const colors = useMemo(() => {
    return {
      p50: isDark ? "#4ade80" : "#16a34a",
      p95: isDark ? "#facc15" : "#ca8a04",
      p99: isDark ? "#ef4444" : "#dc2626",
      grid: isDark ? "#1a1a1a" : "#e5e5e5",
      text: isDark ? "#666" : "#999",
    };
  }, [isDark]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground">
        no data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
      >
        <XAxis
          dataKey="hour"
          tick={{ fill: colors.text, fontSize: 9 }}
          axisLine={{ stroke: colors.grid }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: colors.text, fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}ms`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
            border: `1px solid ${colors.grid}`,
            borderRadius: "4px",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
          formatter={(value: number) => [`${value}ms`]}
        />
        <Legend
          wrapperStyle={{ fontSize: "9px", fontFamily: "monospace" }}
          iconType="line"
          iconSize={8}
        />
        <Line
          type="monotone"
          dataKey="p50"
          stroke={colors.p50}
          strokeWidth={1.5}
          dot={false}
          name="p50"
        />
        <Line
          type="monotone"
          dataKey="p95"
          stroke={colors.p95}
          strokeWidth={1.5}
          dot={false}
          name="p95"
        />
        <Line
          type="monotone"
          dataKey="p99"
          stroke={colors.p99}
          strokeWidth={1.5}
          dot={false}
          name="p99"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
