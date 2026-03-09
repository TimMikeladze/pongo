"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartFullscreen, useChartType } from "@/components/chart-card";
import type { ChartType } from "@/components/chart-type-toggle";
import { useTheme } from "@/components/theme-provider";
import type { ResponseTimeDataPoint } from "@/lib/data";
import { dualTimeLabelFormatter } from "@/lib/format-time";

interface ResponseTimeChartProps {
  data: ResponseTimeDataPoint[];
  height?: number;
  chartType?: ChartType;
}

export function ResponseTimeChart({
  data,
  height = 120,
  chartType: chartTypeProp,
}: ResponseTimeChartProps) {
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
      stroke: isDark ? "#4ade80" : "#16a34a",
      fill: isDark ? "#4ade8020" : "#16a34a20",
      grid: isDark ? "#1a1a1a" : "#e5e5e5",
      text: isDark ? "#a3a3a3" : "#666",
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
      <AreaChart
        data={data}
        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          labelStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
          itemStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
          labelFormatter={dualTimeLabelFormatter}
          formatter={(value) => [`${value}ms`, "latency"]}
        />
        <Area
          type="monotone"
          dataKey="responseTime"
          stroke={colors.stroke}
          strokeWidth={1.5}
          fill="url(#responseTimeGradient)"
          dot={false}
          activeDot={{ r: 3, fill: colors.stroke }}
          connectNulls={false}
        />
      </AreaChart>
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
          labelStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
          itemStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
          labelFormatter={dualTimeLabelFormatter}
          formatter={(value) => [`${value}ms`, "latency"]}
        />
        <Bar
          dataKey="responseTime"
          fill={colors.stroke}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    );

  return (
    <ResponsiveContainer width="100%" height={isFullscreen ? "100%" : height}>
      {chartContent}
    </ResponsiveContainer>
  );
}
