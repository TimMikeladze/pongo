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
  YAxis,
} from "recharts";
import { useChartFullscreen, useChartType } from "@/components/chart-card";
import type { ChartType } from "@/components/chart-type-toggle";
import { useTheme } from "@/components/theme-provider";
import type { ErrorRateDataPoint } from "@/lib/data";
import { dualTimeLabelFormatter } from "@/lib/format-time";

interface ErrorRateChartProps {
  data: ErrorRateDataPoint[];
  height?: number;
  chartType?: ChartType;
}

export function ErrorRateChart({
  data,
  height = 120,
  chartType: chartTypeProp,
}: ErrorRateChartProps) {
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
      bar: isDark ? "#ef4444" : "#dc2626",
      barLight: isDark ? "#ef444440" : "#dc262640",
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
    chartType === "bar" ? (
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
          tickFormatter={(v) => `${v}%`}
          domain={[0, "auto"]}
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
          formatter={(value, name) => [
            name === "errorRate" ? `${value}%` : value,
            name === "errorRate" ? "error rate" : "errors",
          ]}
        />
        <Bar dataKey="errorRate" radius={[2, 2, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.time}
              fill={entry.errorRate > 0 ? colors.bar : colors.barLight}
            />
          ))}
        </Bar>
      </BarChart>
    ) : (
      <AreaChart
        data={data}
        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="errorRateGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.bar} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.bar} stopOpacity={0} />
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
          tickFormatter={(v) => `${v}%`}
          domain={[0, "auto"]}
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
          formatter={(value, name) => [
            name === "errorRate" ? `${value}%` : value,
            name === "errorRate" ? "error rate" : "errors",
          ]}
        />
        <Area
          type="monotone"
          dataKey="errorRate"
          stroke={colors.bar}
          strokeWidth={1.5}
          fill="url(#errorRateGradient)"
          dot={false}
          activeDot={{ r: 3, fill: colors.bar }}
        />
      </AreaChart>
    );

  return (
    <ResponsiveContainer width="100%" height={isFullscreen ? "100%" : height}>
      {chartContent}
    </ResponsiveContainer>
  );
}
