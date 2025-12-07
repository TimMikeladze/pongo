import { cn } from "@/lib/utils"
import { getDailyStatus } from "@/lib/data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { MonitorStatus } from "@/lib/types"

interface UptimeBarsProps {
  monitorId: string
  monitorName: string
  days?: number
  showLabels?: boolean
}

const statusColors: Record<MonitorStatus | "pending", string> = {
  up: "bg-blue-500",
  down: "bg-red-500",
  degraded: "bg-amber-500",
  pending: "bg-muted/30",
}

const statusLabels: Record<MonitorStatus | "pending", string> = {
  up: "Operational",
  down: "Outage",
  degraded: "Degraded",
  pending: "No data",
}

export async function UptimeBars({ monitorId, monitorName, days = 90, showLabels = true }: UptimeBarsProps) {
  const dailyStatus = await getDailyStatus(monitorId, days)

  // Get current status (last day)
  const currentStatus = dailyStatus[dailyStatus.length - 1]?.status ?? "pending"

  return (
    <TooltipProvider delayDuration={0}>
      <div className="py-4 border-b border-border last:border-b-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium font-mono">{monitorName}</span>
          <span
            className={cn(
              "text-xs font-mono",
              currentStatus === "up" && "text-blue-500",
              currentStatus === "down" && "text-red-500",
              currentStatus === "degraded" && "text-amber-500",
              currentStatus === "pending" && "text-muted-foreground",
            )}
          >
            {statusLabels[currentStatus]}
          </span>
        </div>

        <div className="flex gap-[2px]">
          {dailyStatus.map((day) => (
            <Tooltip key={day.date}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex-1 h-8 rounded-[2px] transition-all hover:opacity-80 cursor-default",
                    statusColors[day.status],
                    day.status === "up" && "opacity-90",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-card border-border text-xs font-mono">
                <div className="space-y-1">
                  <p className="text-foreground">{day.date}</p>
                  <p
                    className={cn(
                      day.status === "up" && "text-blue-500",
                      day.status === "down" && "text-red-500",
                      day.status === "degraded" && "text-amber-500",
                      day.status === "pending" && "text-muted-foreground",
                    )}
                  >
                    {day.uptime}% uptime
                  </p>
                  <p className="text-muted-foreground">{day.checks} checks</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {showLabels && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground font-mono">{days} days ago</span>
            <span className="text-[10px] text-muted-foreground font-mono">Today</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
