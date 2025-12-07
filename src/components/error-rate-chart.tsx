"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import type { CheckResult } from "@/lib/types";
import { format } from "date-fns";
import { useTheme } from "@/components/theme-provider";

interface ErrorRateChartProps {
  results: CheckResult[];
  height?: number;
}

export function ErrorRateChart({ results, height = 120 }: ErrorRateChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    const hourlyData: { [key: string]: { errors: number; total: number } } = {};

    results.forEach((r) => {
      const hour = format(new Date(r.checkedAt), "HH:00");
      if (!hourlyData[hour]) {
        hourlyData[hour] = { errors: 0, total: 0 };
      }
      hourlyData[hour].total++;
      if (r.status === "down") {
        hourlyData[hour].errors++;
      }
    });

    return Object.entries(hourlyData)
      .map(([hour, data]) => ({
        hour,
        errorRate:
          data.total > 0 ? Math.round((data.errors / data.total) * 100) : 0,
        errors: data.errors,
      }))
      .slice(-24);
  }, [results]);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const colors = useMemo(() => {
    return {
      bar: isDark ? "#ef4444" : "#dc2626",
      barLight: isDark ? "#ef444440" : "#dc262640",
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
      <BarChart
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
          formatter={(value: number, name: string) => [
            name === "errorRate" ? `${value}%` : value,
            name === "errorRate" ? "error rate" : "errors",
          ]}
        />
        <Bar dataKey="errorRate" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.errorRate > 0 ? colors.bar : colors.barLight}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
