"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StatusBucket } from "@/lib/data";
import type { MonitorStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UptimeBarsCompactProps {
  statusBuckets: StatusBucket[];
}

const statusColors: Record<MonitorStatus | "pending", string> = {
  up: "bg-status-up",
  down: "bg-status-down",
  degraded: "bg-status-degraded",
  pending: "bg-status-pending",
};

export function UptimeBarsCompact({ statusBuckets }: UptimeBarsCompactProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex gap-[2px]">
        {statusBuckets.map((bucket) => (
          <Tooltip key={bucket.timestamp}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex-1 h-6 rounded-[2px] transition-all hover:opacity-80 cursor-default",
                  statusColors[bucket.status],
                  bucket.status === "up" && "opacity-90",
                )}
              />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-card border-border text-xs font-mono"
            >
              <div className="space-y-1">
                <p className="text-foreground">{bucket.label}</p>
                <p
                  className={cn(
                    bucket.status === "up" && "text-status-up",
                    bucket.status === "down" && "text-status-down",
                    bucket.status === "degraded" && "text-status-degraded",
                    bucket.status === "pending" && "text-muted-foreground",
                  )}
                >
                  {bucket.uptime}% uptime
                </p>
                <p className="text-muted-foreground">{bucket.checks} checks</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
