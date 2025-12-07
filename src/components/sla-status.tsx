import { getSLAStatus } from "@/lib/data"
import { Target, TrendingUp, TrendingDown } from "lucide-react"

interface SLAStatusProps {
  dashboardId: string
  days?: number
}

export async function SLAStatus({ dashboardId, days = 30 }: SLAStatusProps) {
  const sla = await getSLAStatus(dashboardId, days)

  if (!sla) return null

  const percentageFill = Math.min(100, (sla.actual / sla.target) * 100)

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">SLA Status</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{days}d</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <p className={`text-2xl font-mono ${sla.met ? "text-emerald-400" : "text-red-400"}`}>
              {sla.actual.toFixed(2)}%
            </p>
            <p className="text-[10px] text-muted-foreground">actual uptime</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-muted-foreground">{sla.target}%</p>
            <p className="text-[10px] text-muted-foreground">target</p>
          </div>
        </div>

        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${sla.met ? "bg-emerald-500" : "bg-red-500"}`}
            style={{ width: `${percentageFill}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px]">
          {sla.met ? (
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              SLA target met
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="h-3 w-3" />
              {sla.remaining.toFixed(2)}% below target
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
