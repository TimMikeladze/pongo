"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StatusTimelineDataPoint } from "@/lib/data";
import type { MonitorStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusTimelineProps {
  data: StatusTimelineDataPoint[];
  limit?: number;
}

const statusColors: Record<MonitorStatus, string> = {
  up: "bg-status-up",
  down: "bg-status-down",
  degraded: "bg-status-degraded",
  pending: "bg-status-pending",
};

export function StatusTimeline({ data, limit = 30 }: StatusTimelineProps) {
  // Pad with empty slots if less than limit
  const paddedData: (StatusTimelineDataPoint | null)[] = [
    ...Array(Math.max(0, limit - data.length)).fill(null),
    ...data,
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-[2px]">
        {paddedData.map((bucket, index) =>
          bucket ? (
            <Tooltip key={bucket.timestamp}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-6 w-1 rounded-[1px] transition-all hover:scale-y-110 cursor-default",
                    statusColors[bucket.status],
                    bucket.status === "up" && "opacity-80 hover:opacity-100",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-card border-border">
                <div className="text-xs font-mono">
                  <p className="text-muted-foreground mb-1">{bucket.time}</p>
                  <p
                    className={cn(
                      "lowercase",
                      bucket.status === "up" && "text-status-up",
                      bucket.status === "down" && "text-status-down",
                      bucket.status === "degraded" && "text-status-degraded",
                    )}
                  >
                    {bucket.status}
                  </p>
                  <p className="text-muted-foreground">
                    avg: {bucket.avgResponseTime}ms
                  </p>
                  <p className="text-muted-foreground">
                    {bucket.total} check{bucket.total !== 1 ? "s" : ""}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: empty slots have no unique identifier
            <div
              key={`empty-${index}`}
              className="h-6 w-1 rounded-[1px] bg-secondary opacity-30"
            />
          ),
        )}
      </div>
    </TooltipProvider>
  );
}
