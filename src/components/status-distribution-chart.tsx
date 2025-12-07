"use client";

import { useMemo, useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CheckResult } from "@/lib/types";
import { useTheme } from "@/components/theme-provider";

interface StatusDistributionChartProps {
  results: CheckResult[];
  height?: number;
}

export function StatusDistributionChart({
  results,
  height = 120,
}: StatusDistributionChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    const distribution = { up: 0, degraded: 0, down: 0 };
    results.forEach((r) => {
      if (r.status === "up") distribution.up++;
      else if (r.status === "degraded") distribution.degraded++;
      else if (r.status === "down") distribution.down++;
    });
    return [
      { name: "up", value: distribution.up },
      { name: "degraded", value: distribution.degraded },
      { name: "down", value: distribution.down },
    ].filter((d) => d.value > 0);
  }, [results]);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const colors = useMemo(() => {
    return {
      up: isDark ? "#4ade80" : "#16a34a",
      degraded: isDark ? "#facc15" : "#ca8a04",
      down: isDark ? "#ef4444" : "#dc2626",
      grid: isDark ? "#1a1a1a" : "#e5e5e5",
      text: isDark ? "#666" : "#999",
    };
  }, [isDark]);

  const getColor = (name: string) => {
    if (name === "up") return colors.up;
    if (name === "degraded") return colors.degraded;
    return colors.down;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground">
        no data available
      </div>
    );
  }

  const total = chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={45}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
              border: `1px solid ${colors.grid}`,
              borderRadius: "4px",
              fontSize: "10px",
              fontFamily: "monospace",
            }}
            formatter={(value: number, name: string) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2 text-[10px] font-mono">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getColor(d.name) }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
