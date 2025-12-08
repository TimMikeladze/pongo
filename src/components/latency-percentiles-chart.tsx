"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartFullscreen, useChartType } from "@/components/chart-card";
import type { ChartType } from "@/components/chart-type-toggle";
import { useTheme } from "@/components/theme-provider";
import type { LatencyPercentilesDataPoint } from "@/lib/data";

interface LatencyPercentilesChartProps {
  data: LatencyPercentilesDataPoint[];
  height?: number;
  chartType?: ChartType;
}

export function LatencyPercentilesChart({
  data,
  height = 120,
  chartType: chartTypeProp,
}: LatencyPercentilesChartProps) {
  const contextChartType = useChartType();
  const chartType = chartTypeProp ?? contextChartType;
  const isFullscreen = useChartFullscreen();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground">
        no data available
      </div>
    );
  }

  const chartContent =
    chartType === "line" ? (
      <LineChart
        data={data}
        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
      >
        <XAxis
          dataKey="time"
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
    ) : (
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="time"
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
          iconType="square"
          iconSize={8}
        />
        <Bar dataKey="p50" fill={colors.p50} name="p50" radius={[2, 2, 0, 0]} />
        <Bar dataKey="p95" fill={colors.p95} name="p95" radius={[2, 2, 0, 0]} />
        <Bar dataKey="p99" fill={colors.p99} name="p99" radius={[2, 2, 0, 0]} />
      </BarChart>
    );

  return (
    <ResponsiveContainer width="100%" height={isFullscreen ? "100%" : height}>
      {chartContent}
    </ResponsiveContainer>
  );
}
