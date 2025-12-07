"use client"

import { cn } from "@/lib/utils"
import type { CheckResult } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDistanceToNow } from "date-fns"

interface StatusTimelineProps {
  results: CheckResult[]
  limit?: number
}

const statusColors = {
  up: "bg-status-up",
  down: "bg-status-down",
  degraded: "bg-status-degraded",
  pending: "bg-status-pending",
}

export function StatusTimeline({ results, limit = 30 }: StatusTimelineProps) {
  const displayResults = results.slice(0, limit).reverse()

  // Pad with empty slots if less than limit
  const paddedResults = [...Array(Math.max(0, limit - displayResults.length)).fill(null), ...displayResults]

  return (
    <TooltipProvider>
      <div className="flex items-center gap-[2px]">
        {paddedResults.map((result, index) =>
          result ? (
            <Tooltip key={result.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-6 w-1 rounded-[1px] transition-all hover:scale-y-110 cursor-default",
                    statusColors[result.status],
                    result.status === "up" && "opacity-80 hover:opacity-100",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-card border-border">
                <div className="text-xs font-mono">
                  <p
                    className={cn(
                      "lowercase",
                      result.status === "up" && "text-status-up",
                      result.status === "down" && "text-status-down",
                      result.status === "degraded" && "text-status-degraded",
                    )}
                  >
                    {result.status}
                  </p>
                  <p className="text-muted-foreground">
                    {result.responseTimeMs}ms / {result.statusCode || "err"}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(new Date(result.checkedAt), { addSuffix: true })}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div key={`empty-${index}`} className="h-6 w-1 rounded-[1px] bg-secondary opacity-30" />
          ),
        )}
      </div>
    </TooltipProvider>
  )
}
