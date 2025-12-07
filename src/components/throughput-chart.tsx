"use client"

import { useMemo, useEffect, useState } from "react"
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import type { CheckResult } from "@/lib/types"
import { format } from "date-fns"
import { useTheme } from "@/components/theme-provider"

interface ThroughputChartProps {
  results: CheckResult[]
  height?: number
}

export function ThroughputChart({ results, height = 120 }: ThroughputChartProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = useMemo(() => {
    const hourlyData: { [key: string]: number } = {}

    results.forEach((r) => {
      const hour = format(new Date(r.checkedAt), "HH:00")
      if (!hourlyData[hour]) {
        hourlyData[hour] = 0
      }
      hourlyData[hour]++
    })

    return Object.entries(hourlyData)
      .map(([hour, count]) => ({
        hour,
        checks: count,
      }))
      .slice(-24)
  }, [results])

  const isDark = mounted ? resolvedTheme === "dark" : true
  const colors = useMemo(() => {
    return {
      stroke: isDark ? "#8b5cf6" : "#7c3aed",
      fill: isDark ? "#8b5cf620" : "#7c3aed20",
      grid: isDark ? "#1a1a1a" : "#e5e5e5",
      text: isDark ? "#666" : "#999",
    }
  }, [isDark])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground">no data available</div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="hour"
          tick={{ fill: colors.text, fontSize: 9 }}
          axisLine={{ stroke: colors.grid }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: colors.text, fontSize: 9 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
            border: `1px solid ${colors.grid}`,
            borderRadius: "4px",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
          formatter={(value: number) => [`${value}`, "checks"]}
        />
        <Area
          type="monotone"
          dataKey="checks"
          stroke={colors.stroke}
          strokeWidth={1.5}
          fill="url(#throughputGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
