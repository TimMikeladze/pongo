import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStatusBuckets, type TimeRange } from "@/lib/data";
import type { MonitorStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CompactUptimeBarsProps {
  monitorId: string;
  timeRange: TimeRange;
}

const statusColors: Record<MonitorStatus | "pending", string> = {
  up: "bg-green-500",
  down: "bg-red-500",
  degraded: "bg-yellow-500",
  pending: "bg-muted-foreground/20",
};

export async function CompactUptimeBars({
  monitorId,
  timeRange,
}: CompactUptimeBarsProps) {
  // Use 1h interval for compact display
  const statusBuckets = await getStatusBuckets(monitorId, timeRange, "1h");

  // Limit to last 24 buckets for card display
  const displayBuckets = statusBuckets.slice(-24);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex gap-[2px]">
        {displayBuckets.map((bucket) => (
          <Tooltip key={bucket.timestamp}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex-1 h-4 rounded-[2px] transition-all hover:opacity-80 cursor-default",
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
                    bucket.status === "up" &&
                      "text-green-700 dark:text-green-400",
                    bucket.status === "down" &&
                      "text-red-700 dark:text-red-400",
                    bucket.status === "degraded" &&
                      "text-yellow-700 dark:text-yellow-400",
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
