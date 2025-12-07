import { cn } from "@/lib/utils";
import { getStatusBuckets, type TimeRange } from "@/lib/data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MonitorStatus } from "@/lib/types";
import type { IntervalOption } from "@/lib/time-range";
import { formatPresetLabel } from "@/lib/time-range";

interface UptimeBarsProps {
  monitorId: string;
  monitorName: string;
  timeRange: TimeRange;
  interval: IntervalOption;
  showLabels?: boolean;
}

const statusColors: Record<MonitorStatus | "pending", string> = {
  up: "bg-blue-500",
  down: "bg-red-500",
  degraded: "bg-amber-500",
  pending: "bg-muted-foreground/20",
};

const statusLabels: Record<MonitorStatus | "pending", string> = {
  up: "Operational",
  down: "Outage",
  degraded: "Degraded",
  pending: "No data",
};

export async function UptimeBars({
  monitorId,
  monitorName,
  timeRange,
  interval,
  showLabels = true,
}: UptimeBarsProps) {
  const statusBuckets = await getStatusBuckets(monitorId, timeRange, interval);

  // Get current status (last bucket)
  const currentStatus =
    statusBuckets[statusBuckets.length - 1]?.status ?? "pending";

  // Calculate time range label
  const startLabel = statusBuckets[0]?.label ?? "";
  const endLabel = statusBuckets[statusBuckets.length - 1]?.label ?? "Now";

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
          {statusBuckets.map((bucket) => (
            <Tooltip key={bucket.timestamp}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex-1 h-8 rounded-[2px] transition-all hover:opacity-80 cursor-default",
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
                      bucket.status === "up" && "text-blue-500",
                      bucket.status === "down" && "text-red-500",
                      bucket.status === "degraded" && "text-amber-500",
                      bucket.status === "pending" && "text-muted-foreground",
                    )}
                  >
                    {bucket.uptime}% uptime
                  </p>
                  <p className="text-muted-foreground">
                    {bucket.checks} checks
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {showLabels && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              {startLabel}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {endLabel}
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
