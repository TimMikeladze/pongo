"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "@/components/theme-provider";
import type { StatusDistributionData } from "@/lib/data";

interface StatusDistributionChartProps {
  data: StatusDistributionData;
  height?: number;
}

export function StatusDistributionChart({
  data,
  height = 120,
}: StatusDistributionChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    return [
      { name: "up", value: data.up },
      { name: "degraded", value: data.degraded },
      { name: "down", value: data.down },
    ].filter((d) => d.value > 0);
  }, [data]);

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
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={getColor(entry.name)} />
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
            labelStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
            itemStyle={{ color: isDark ? "#e5e5e5" : "#1a1a1a" }}
            formatter={(value, name) => [
              `${value} (${((Number(value) / total) * 100).toFixed(1)}%)`,
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
