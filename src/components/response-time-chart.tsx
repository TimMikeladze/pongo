"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CheckResult } from "@/lib/types";
import { format } from "date-fns";
import { useTheme } from "@/components/theme-provider";

interface ResponseTimeChartProps {
  results: CheckResult[];
  height?: number;
}

export function ResponseTimeChart({
  results,
  height = 120,
}: ResponseTimeChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    return [...results]
      .reverse()
      .slice(-30)
      .map((r) => ({
        time: format(new Date(r.checkedAt), "HH:mm"),
        responseTime: r.status === "down" ? null : r.responseTimeMs,
        status: r.status,
      }));
  }, [results]);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const colors = useMemo(() => {
    return {
      stroke: isDark ? "#4ade80" : "#16a34a",
      fill: isDark ? "#4ade8020" : "#16a34a20",
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
      <AreaChart
        data={chartData}
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
          labelStyle={{ color: colors.text }}
          formatter={(value: number) => [`${value}ms`, "latency"]}
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
    </ResponsiveContainer>
  );
}
