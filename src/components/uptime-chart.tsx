"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useChartFullscreen, useChartType } from "@/components/chart-card";
import type { ChartType } from "@/components/chart-type-toggle";
import { useTheme } from "@/components/theme-provider";
import type { UptimeDataPoint } from "@/lib/data";
import { dualTimeLabelFormatter } from "@/lib/format-time";

interface UptimeChartProps {
  data: UptimeDataPoint[];
  height?: number;
  chartType?: ChartType;
}

export function UptimeChart({
  data,
  height = 60,
  chartType: chartTypeProp,
}: UptimeChartProps) {
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
      up: isDark ? "#4ade80" : "#16a34a",
      degraded: isDark ? "#facc15" : "#ca8a04",
      down: isDark ? "#ef4444" : "#dc2626",
      grid: isDark ? "#1a1a1a" : "#e5e5e5",
      text: isDark ? "#a3a3a3" : "#666",
    };
  }, [isDark]);

  const getBarColor = (uptime: number) => {
    if (uptime >= 99) return colors.up;
    if (uptime >= 95) return colors.degraded;
    return colors.down;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60px] text-xs text-muted-foreground">
        no data available
      </div>
    );
  }

  const chartContent =
    chartType === "bar" ? (
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <XAxis
          dataKey="time"
          tick={{ fill: colors.text, fontSize: 8 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
            border: `1px solid ${colors.grid}`,
            borderRadius: "4px",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
          labelStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
          itemStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
          labelFormatter={dualTimeLabelFormatter}
          formatter={(value) => [`${value}%`, "uptime"]}
        />
        <Bar dataKey="uptime" radius={[2, 2, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.time} fill={getBarColor(entry.uptime)} />
          ))}
        </Bar>
      </BarChart>
    ) : (
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <defs>
          <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.up} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.up} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fill: colors.text, fontSize: 8 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
            border: `1px solid ${colors.grid}`,
            borderRadius: "4px",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
          labelStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
          itemStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
          labelFormatter={dualTimeLabelFormatter}
          formatter={(value) => [`${value}%`, "uptime"]}
        />
        <Area
          type="monotone"
          dataKey="uptime"
          stroke={colors.up}
          strokeWidth={1.5}
          fill="url(#uptimeGradient)"
          dot={false}
          activeDot={{ r: 3, fill: colors.up }}
        />
      </AreaChart>
    );

  return (
    <ResponsiveContainer width="100%" height={isFullscreen ? "100%" : height}>
      {chartContent}
    </ResponsiveContainer>
  );
}
