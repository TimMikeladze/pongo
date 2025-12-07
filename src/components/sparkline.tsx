"use client";

import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { useTheme } from "@/components/theme-provider";
import type { CheckResult } from "@/lib/types";

interface SparklineProps {
  results: CheckResult[];
  height?: number;
  className?: string;
}

export function Sparkline({ results, height = 32, className }: SparklineProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    return [...results].reverse().map((r, i) => ({
      index: i,
      value: r.status === "down" ? null : r.responseTimeMs,
      status: r.status,
    }));
  }, [results]);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  // Calculate color based on average response time
  const avgResponseTime = useMemo(() => {
    const validResults = results.filter((r) => r.status !== "down");
    if (validResults.length === 0) return 0;
    return (
      validResults.reduce((acc, r) => acc + r.responseTimeMs, 0) /
      validResults.length
    );
  }, [results]);

  // Green for fast, amber for medium, red for slow
  const strokeColor =
    avgResponseTime < 200
      ? isDark
        ? "#4ade80"
        : "#16a34a"
      : avgResponseTime < 500
        ? isDark
          ? "#fbbf24"
          : "#d97706"
        : isDark
          ? "#f87171"
          : "#dc2626";

  const fillColor =
    avgResponseTime < 200
      ? isDark
        ? "rgba(74, 222, 128, 0.1)"
        : "rgba(22, 163, 74, 0.1)"
      : avgResponseTime < 500
        ? isDark
          ? "rgba(251, 191, 36, 0.1)"
          : "rgba(217, 119, 6, 0.1)"
        : isDark
          ? "rgba(248, 113, 113, 0.1)"
          : "rgba(220, 38, 38, 0.1)";

  if (!mounted || results.length < 2) {
    return <div className={className} style={{ height }} />;
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
        >
          <YAxis domain={["dataMin - 20", "dataMax + 20"]} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={fillColor}
            connectNulls={false}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
