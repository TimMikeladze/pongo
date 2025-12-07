"use client"

import { useMemo, useEffect, useState } from "react"
import { Bar, BarChart, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"
import type { CheckResult } from "@/lib/types"
import { format } from "date-fns"
import { useTheme } from "@/components/theme-provider"

interface UptimeChartProps {
  results: CheckResult[]
  height?: number
}

export function UptimeChart({ results, height = 60 }: UptimeChartProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = useMemo(() => {
    const hourlyData: { [key: string]: { up: number; total: number } } = {}

    results.forEach((r) => {
      const hour = format(new Date(r.checkedAt), "HH:00")
      if (!hourlyData[hour]) {
        hourlyData[hour] = { up: 0, total: 0 }
      }
      hourlyData[hour].total++
      if (r.status === "up" || r.status === "degraded") {
        hourlyData[hour].up++
      }
    })

    return Object.entries(hourlyData)
      .map(([hour, data]) => ({
        hour,
        uptime: Math.round((data.up / data.total) * 100),
      }))
      .slice(-24)
  }, [results])

  const isDark = mounted ? resolvedTheme === "dark" : true
  const colors = useMemo(() => {
    return {
      up: isDark ? "#4ade80" : "#16a34a",
      degraded: isDark ? "#facc15" : "#ca8a04",
      down: isDark ? "#ef4444" : "#dc2626",
      grid: isDark ? "#1a1a1a" : "#e5e5e5",
      text: isDark ? "#666" : "#999",
    }
  }, [isDark])

  const getBarColor = (uptime: number) => {
    if (uptime >= 99) return colors.up
    if (uptime >= 95) return colors.degraded
    return colors.down
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60px] text-xs text-muted-foreground">no data available</div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <XAxis
          dataKey="hour"
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
          formatter={(value: number) => [`${value}%`, "uptime"]}
        />
        <Bar dataKey="uptime" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.uptime)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
