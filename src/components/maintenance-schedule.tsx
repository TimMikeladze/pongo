"use client"

import { format, isPast, isFuture } from "date-fns"
import { Calendar, Clock, Wrench, X } from "lucide-react"
import { useUpcomingMaintenance, useMonitors } from "@/lib/hooks"
import { store } from "@/lib/store"
import { Button } from "@/components/ui/button"

interface MaintenanceScheduleProps {
  dashboardId?: string
  showDelete?: boolean
}

export function MaintenanceSchedule({ dashboardId, showDelete = false }: MaintenanceScheduleProps) {
  const maintenance = useUpcomingMaintenance(dashboardId)
  const monitors = useMonitors()

  if (maintenance.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {maintenance.map((window) => {
        const affectedMonitors = monitors.filter((m) => window.affectedMonitorIds.includes(m.id))
        const startDate = new Date(window.scheduledStart)
        const endDate = new Date(window.scheduledEnd)
        const isOngoing = isPast(startDate) && isFuture(endDate)
        const isUpcoming = isFuture(startDate)

        return (
          <div
            key={window.id}
            className={`p-4 rounded-lg border ${
              isOngoing ? "border-amber-500/30 bg-amber-500/5" : "border-purple-500/30 bg-purple-500/5"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Wrench className={`h-4 w-4 mt-0.5 ${isOngoing ? "text-amber-400" : "text-purple-400"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">{window.title}</p>
                    {isOngoing && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase">
                        ongoing
                      </span>
                    )}
                  </div>
                  {window.description && <p className="text-[11px] opacity-60 mt-1">{window.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-[10px] opacity-60">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(startDate, "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                    </div>
                  </div>
                  {affectedMonitors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {affectedMonitors.map((m) => (
                        <span key={m.id} className="text-[10px] px-2 py-0.5 rounded bg-background/50 opacity-60">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {showDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-50 hover:opacity-100"
                  onClick={() => store.deleteMaintenanceWindow(window.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
